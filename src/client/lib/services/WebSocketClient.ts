import { ClientEvents } from "@poker-lib/enums/ClientEvents.ts";
import { ClientMessage } from "@poker-lib/message/ClientMessage.ts";
import { ServerMessage } from "@poker-lib/message/ServerMessage.ts";

export default class WebSocketClient {
	private readonly socket: WebSocket;
	private interval: number[] = [];
	private lastPingAnswer: number = -1;

	public constructor(public readonly ip: string) {
		this.socket = new WebSocket(ip);
		this.socket.onmessage = (event) => {
			this.recieve(JSON.parse(event.data as string));
		};
		this.socket.onopen = (e) => this.connected(e);
		this.socket.onclose = (e) => this.closed(e);
	}

	public closed(e: CloseEvent): void {
		this.interval.forEach(interval => {
			clearInterval(interval);
		})
	}

	public send(m: ClientMessage): void {
		console.log('Sended Message:', m);
		this.socket.send(JSON.stringify(m));
	}

	public connected(e: Event): void {
		this.lastPingAnswer = Date.now();
		this.interval.push(setInterval(() => {
			this.send({ type: ClientEvents.SERVER_PING, date: Date.now() });
		}, 1000));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
	public recieve(m: ServerMessage): void {}

	public get isOpen(): boolean {
		return this.socket.readyState === WebSocket.OPEN;
	}
}
