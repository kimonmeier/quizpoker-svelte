import { GameMasterAction, type ClientMessage } from '@poker-lib/message/ClientMessage.ts';
import type WebSocketClient from '@server/connection/WebSocketClient.ts';
import type WebSocketConnection from '@server/connection/WebSocketConnection.ts';
import type PlayerManager from './PlayerManager.ts';
import { ClientEvents } from '@poker-lib/enums/ClientEvents.ts';
import { ServerEvents } from '@poker-lib/enums/ServerEvents.ts';
import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import { FragenPhase } from '@poker-lib/message/ServerMessage.ts';

export default class SchaetzungManager {
	private readonly connection: WebSocketConnection;
	private readonly eventBus: QuizPokerEventBus;
	private readonly playerManager: PlayerManager;

	private schaetzungen: Map<string, number> = new Map();
	private gameMasterId: string | null = null;
	private correctAnswer: number | null = null;

	public constructor(
		connection: WebSocketConnection,
		eventBus: QuizPokerEventBus,
		playerManager: PlayerManager
	) {
		this.connection = connection;
		this.eventBus = eventBus;
		this.playerManager = playerManager;

		this.eventBus.registerToEvent({
			event: 'PHASE-TRIGGERED',
			listener: (phase) => {
				if (phase.payload == FragenPhase.RUNDE_1) {
					this.revealSchaetzungen();
				} else if (phase.payload == FragenPhase.PAUSE) {
					this.schaetzungen.clear();
				}
			}
		});
	}

	public handleInputs(client: WebSocketClient, m: ClientMessage): void {
		switch (m.type) {
			case ClientEvents.GAMEMASTER_LOGIN:
				this.gameMasterId = client.uuid;
				break;
			case ClientEvents.SCHAETZUNG_ABGEBEN:
				this.schaetzungen.set(client.uuid, m.schaetzung);

				this.connection.clients
					.find((x) => x.uuid == this.gameMasterId)
					?.send({
						type: ServerEvents.MEMBER_ISSUED_SCHAETZUNG,
						id: client.uuid,
						schaetzung: m.schaetzung
					});
				break;
			case ClientEvents.GAME_MASTER_ACTION:
				if (m.action == GameMasterAction.PLAY_QUESTION) {
					this.correctAnswer = Number.parseInt(m.answer);
					break;
				}

				if (m.action != GameMasterAction.ANNOUNCE_WINNER) {
					break;
				}

				this.findWinner();
				break;
		}
	}

	private revealSchaetzungen(): void {
		const currentlyPlayingClients = this.playerManager
			.getPlayers()
			.filter((x) => x.status != MemberStatus.PLEITE)
			.map((x) => x.client);

		this.schaetzungen.forEach((schaetzung, clientId) => {
			this.connection.broadcastExcept(
				{ type: ServerEvents.MEMBER_ISSUED_SCHAETZUNG, id: clientId, schaetzung: schaetzung },
				...currentlyPlayingClients
			);
		});
	}

	private findWinner(): void {
		if (this.correctAnswer === null) {
			throw new Error('Keine Antwort um herauszufinden wer gewonnen hat!');
		}

		if (this.playerManager.getPlayingPlayers().length == 1) {
			this.eventBus.dispatch({
				event: {
					type: 'PLAYER-WON-ROUND',
					payload: this.playerManager.getPlayingPlayers().map((x) => x.client.uuid)
				}
			});
			return;
		}

		let winnerIds: string[] = [];
		let winnerNumber: number | null = null;

		Array.from(this.schaetzungen.entries()).forEach((x) => {
			if (this.playerManager.getPlayerByUuid(x[0]).status != MemberStatus.ON) {
				return;
			}

			if (winnerNumber == null) {
				winnerNumber = x[1];
				winnerIds = [x[0]];
				return;
			}

			let differenzeWinner = winnerNumber - this.correctAnswer!;
			let differenzeActualPlayer = x[1] - this.correctAnswer!;

			if (differenzeWinner < 0) {
				differenzeWinner *= -1;
			}

			if (differenzeActualPlayer < 0) {
				differenzeActualPlayer *= -1;
			}

			if (differenzeWinner == differenzeActualPlayer) {
				winnerIds.push(x[0]);
			} else if (differenzeWinner > differenzeActualPlayer) {
				winnerIds = [x[0]];
				winnerNumber = x[1];
			}
		});

		this.eventBus.dispatch({
			event: {
				type: 'PLAYER-WON-ROUND',
				payload: winnerIds
			}
		});
	}
}
