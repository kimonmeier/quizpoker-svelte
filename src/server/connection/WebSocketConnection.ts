import { EventEmitter } from 'node:events';
import { IncomingMessage } from 'node:http';
import WebSocketClient from './WebSocketClient.ts';
import { WebSocketServer, WebSocket, type Data } from 'ws';
import type Connection from '@poker-lib/Connection.ts';
import type { ServerMessage } from '@poker-lib/message/ServerMessage.ts';
import type Client from '@poker-lib/Client.ts';
import { ServerEvents } from '@poker-lib/enums/ServerEvents.ts';

export default class WebSocketConnection extends EventEmitter implements Connection {
	private socket!: WebSocketServer;
	private _clients: WebSocketClient[] = [];
	private readonly events: ServerMessage[] = [];

	public constructor() {
		super();
	}

	public connect(): void {
		this.socket = new WebSocketServer({
			port: 2224
		});

		this.socket.on('connection', this.handleConnect);
	}

	public broadcast(m: ServerMessage): void {
		this.sendTo(this._clients, m);
	}

	public broadcastExcept(m: ServerMessage, ...clients: WebSocketClient[]): void {
		let arrays = new Array();
		this._clients.forEach((element) => {
			if (!clients.includes(element, 0)) {
				arrays.push(element);
			}
		});

		this.sendTo(arrays, m);
	}

	public sendTo(clients: WebSocketClient[], m: ServerMessage): void {
		for (const client of clients) client.send(m);
		this.events.push(m);
	}

	public sendToViaIds(clients: string[], m: ServerMessage): void {
		for (const clientId of clients)
			this.sendTo(
				this._clients.filter((x) => x.uuid == clientId),
				m
			);
	}

	public get clients(): Client[] {
		return this._clients;
	}

	private handleConnect = (clientSocket: WebSocket, request: IncomingMessage) => {
		const ip = request.socket.remoteAddress;

		//if (!ip) throw new Error('Connection had no ip');

		const client = new WebSocketClient(clientSocket, ip ?? '127.0.0.1');

		this._clients.push(client);
		this.emit('connect', client);

		clientSocket.on('close', () => this.handleClose(client));
		clientSocket.on('message', (m: Data) => this.handleMessage(client, m));

		client.send({ type: ServerEvents.PING, ms: 0 });
		this.events.forEach((element) => {
			client.send(element);
		});
	};

	private handleClose = (client: WebSocketClient) => {
		this._clients = this._clients.filter((c) => c !== client);
		this.emit('disconnect', client);
	};

	private handleMessage = (client: WebSocketClient, data: Data) => {
		this.emit('message', client, JSON.parse(data.toString()));
	};
}
