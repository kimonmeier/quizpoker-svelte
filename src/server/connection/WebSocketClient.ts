import type Client from '@poker-lib/Client.ts';
import type { ServerMessage } from '@poker-lib/message/ServerMessage.ts';
import * as uuid from 'uuid';
import { WebSocket } from 'ws';

export default class WebSocketClient implements Client {
	public readonly uuid: string;

	public constructor(
		private socket: WebSocket,
		public readonly ip: string
	) {
		this.uuid = uuid.v4();
	}

	public send(m: ServerMessage): void {
		this.socket.send(JSON.stringify(m));
	}

	public get isOpen(): boolean {
		return this.socket.readyState === WebSocket.OPEN;
	}
}
