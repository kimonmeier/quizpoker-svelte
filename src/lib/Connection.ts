import EventEmitter from 'node:events';
import type Client from './Client.ts';
import type { ClientMessage } from './message/ClientMessage.ts';
import type { ServerMessage } from './message/ServerMessage.ts';

export default interface Connection extends EventEmitter {
	addListener(type: 'connect', cb: (c: Client) => void): this;
	addListener(type: 'disconnect', cb: (c: Client) => void): this;
	addListener(type: 'message', cb: (c: Client, m: ClientMessage) => void): this;
	broadcast(m: ServerMessage): void;
	readonly clients: Client[];
	emit(type: 'connect', c: Client): boolean;
	emit(type: 'disconnect', c: Client): boolean;
	emit(type: 'message', c: Client, message: ClientMessage): boolean;
	removeListener(type: 'connect', cb: (c: Client) => void): this;
	removeListener(type: 'disconnect', cb: (c: Client) => void): this;
	removeListener(type: 'message', cb: (c: Client, message: ClientMessage) => void): this;
	sendTo(clients: Client[], m: ServerMessage): void;
}
