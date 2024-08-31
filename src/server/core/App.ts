import type { ClientMessage } from '@poker-lib/message/ClientMessage.ts';
import type WebSocketClient from '@server/connection/WebSocketClient.ts';
import WebSocketConnection from '@server/connection/WebSocketConnection.ts';
import PlayerManager from './PlayerManager.ts';
import BetManager from './BetManager.ts';
import SchaetzungManager from './SchaetzungManager.ts';
import { ControlsManager } from './ControlsManager.ts';
import { createInMemoryEventBus } from '@danielemariani/ts-event-bus';
import type { EventDeclaration, QuizPokerEventBus } from '@server/eventbus/Events.ts';
import { RoundManager } from './RoundManager.ts';
import { BlindManager } from './BlindManager.ts';
import { C, S } from "../../../build/client/_app/immutable/chunks/scheduler.PumrSTIC.js";
import { ClientEvents } from "@poker-lib/enums/ClientEvents.ts";
import { ServerEvents } from "@poker-lib/enums/ServerEvents.ts";

export class App {
	private readonly webSocket: WebSocketConnection;
	private readonly betManager: BetManager;
	private readonly playerManager: PlayerManager;
	private readonly schaetzungManager: SchaetzungManager;
	private readonly controlsManager: ControlsManager;
	private readonly roundManager: RoundManager;
	private readonly blindManager: BlindManager;
	private readonly eventBus: QuizPokerEventBus;

	public constructor() {
		this.eventBus = createInMemoryEventBus<EventDeclaration>();

		this.webSocket = new WebSocketConnection();
		this.playerManager = new PlayerManager(this.webSocket, this.eventBus);
		this.betManager = new BetManager(this.webSocket, this.eventBus, this.playerManager);
		this.blindManager = new BlindManager(
			this.webSocket,
			this.eventBus,
			this.playerManager,
			this.betManager
		);
		this.controlsManager = new ControlsManager(
			this.webSocket,
			this.eventBus,
			this.betManager,
			this.playerManager,
			this.blindManager
		);
		this.schaetzungManager = new SchaetzungManager(
			this.webSocket,
			this.eventBus,
			this.playerManager
		);
		this.roundManager = new RoundManager(this.webSocket, this.eventBus, this.playerManager);
	}

	public startApp(): void {
		console.log('Websocket wurde gestartet!');

		this.webSocket.connect();

		this.webSocket.addListener('message', (client: WebSocketClient, message: ClientMessage) => {
			console.log('Neue Nachricht vo dem Client: ' + client.ip);
			console.log(message);

			if (message.type == ClientEvents.SERVER_PING) {
				client.send({
					type: ServerEvents.PING,
					ms: message.date - Date.now()
				})
			}

			this.betManager.handleInputs(client, message);
			this.controlsManager.handleInputs(client, message);
			this.playerManager.handleInputs(client, message);
			this.schaetzungManager.handleInputs(client, message);
			this.roundManager.handleInputs(client, message);
		});
	}

	public stopApp(): void {}
}
