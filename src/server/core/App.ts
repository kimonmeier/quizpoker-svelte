import PlayerManager from './PlayerManager.ts';
import BetManager from './BetManager.ts';
import SchaetzungManager from './SchaetzungManager.ts';
import { ControlsManager } from './ControlsManager.ts';
import { createInMemoryEventBus } from '@danielemariani/ts-event-bus';
import type { EventDeclaration, QuizPokerEventBus } from '@server/eventbus/Events.ts';
import { RoundManager } from './RoundManager.ts';
import { BlindManager } from './BlindManager.ts';
import { Server, type Socket } from 'socket.io';
import type { ClientToServerEvents } from '@poker-lib/message/ClientToServerEvents.ts';
import type { ServerToClientEvents } from '@poker-lib/message/ServerToClientEvents.ts';
import { HistoryManager } from './HistoryManager.ts';
import { randomUUID } from 'node:crypto';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, object, object>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, object>;

export class App {
	private readonly webSocket: AppServer;
	private readonly historyManager: HistoryManager;

	private readonly betManager: BetManager;
	private readonly playerManager: PlayerManager;
	private readonly schaetzungManager: SchaetzungManager;
	private readonly controlsManager: ControlsManager;
	private readonly roundManager: RoundManager;
	private readonly blindManager: BlindManager;
	private readonly eventBus: QuizPokerEventBus;

	public constructor() {
		this.eventBus = createInMemoryEventBus<EventDeclaration>();

		this.webSocket = new Server<ClientToServerEvents, ServerToClientEvents, object, object>({
			connectionStateRecovery: {}
		});
		this.historyManager = new HistoryManager(this.webSocket);

		this.playerManager = new PlayerManager(this.historyManager, this.eventBus);
		this.betManager = new BetManager(this.historyManager, this.eventBus, this.playerManager);
		this.blindManager = new BlindManager(this.eventBus, this.playerManager, this.betManager);

		this.controlsManager = new ControlsManager(
			this.historyManager,
			this.eventBus,
			this.betManager,
			this.playerManager,
			this.blindManager,
			this.webSocket
		);

		this.schaetzungManager = new SchaetzungManager(
			this.historyManager,
			this.eventBus,
			this.playerManager,
			this.webSocket
		);
		this.roundManager = new RoundManager(this.historyManager, this.eventBus);
	}

	public startApp(): void {
		console.log('Websocket wurde gestartet!');
		this.webSocket.on('connect', () => {
			console.log('Something is trying to connect');
		});

		this.webSocket.on('connect', async (socket) => {
			const userId = randomUUID() as PlayerId;
			socket.join(userId);

			socket.on('disconnect', (reason) => {
				console.log('Player disconnected because: ', reason);
			});

			this.historyManager.registerSocket(socket, userId);
			this.betManager.registerSocket(socket, userId);
			this.playerManager.registerSocket(socket, userId);
			this.schaetzungManager.registerSocket(socket, userId);
			this.controlsManager.registerSocket(socket, userId);
			this.roundManager.registerSocket(socket, userId);
			this.blindManager.registerSocket(socket, userId);
		});

		this.webSocket.listen(Deno.env.get('PORT') ?? 3000);
	}

	public stopApp(): void {
		this.webSocket.close();
	}
}
