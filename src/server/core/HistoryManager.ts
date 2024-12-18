import type { ServerToClientEvents } from '@poker-lib/message/ServerToClientEvents.ts';
import type { BasicManager } from './BasicManager.ts';
import type { AppServer, AppSocket } from './App.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

type EventType = keyof ServerToClientEvents;
// Define a type for the history entries
type EventHistoryEntry<Ev extends EventType> = {
	event: Ev;
	args: unknown[];
};

export class HistoryManager implements BasicManager {
	private readonly connection: AppServer;
	// Define the history array to store events and arguments
	private eventHistory: EventHistoryEntry<any>[] = [];

	public constructor(connection: AppServer) {
		this.connection = connection;
	}

	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		console.log('Register Socket to HistoryManager');
		console.log('History contains, ', this.eventHistory.length, 'entries');
		setTimeout(() => {
			console.log('Send history to new socket');
			this.eventHistory.forEach((element) => {
				socket.emit(element.event, ...element.args);
			});
		}, 500);
	}

	public SendAndSaveToHistory<Ev extends EventType>(ev: Ev, ...args: unknown[]) {
		this.SaveToHistory(ev, ...args);
		this.connection.emit(ev, ...(args as any));
	}

	public SaveToHistory<Ev extends EventType>(ev: Ev, ...args: unknown[]) {
		this.eventHistory.push({
			event: ev,
			args: args
		});
	}
}
