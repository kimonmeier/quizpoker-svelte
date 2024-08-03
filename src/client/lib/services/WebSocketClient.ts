import { ServerEvents } from '@poker-lib/enums/ServerEvents';
import type { ClientMessage } from '@poker-lib/message/ClientMessage';
import type { ServerMessage } from '@poker-lib/message/ServerMessage';

export default class WebSocketClient {
	private readonly socket: WebSocket;

	public constructor(public readonly ip: string) {
		this.socket = new WebSocket(ip);
		this.socket.onmessage = (event) => {
			this.recieve(JSON.parse(event.data as string));
		};
	}

	public send(m: ClientMessage): void {
		console.log('Sended Message:', m);
		this.socket.send(JSON.stringify(m));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
	public recieve(m: ServerMessage): void {}

	public get isOpen(): boolean {
		return this.socket.readyState === WebSocket.OPEN;
	}
}
