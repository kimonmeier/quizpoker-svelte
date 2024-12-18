import type PlayerManager from './PlayerManager.ts';
import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type { HistoryManager } from './HistoryManager.ts';
import { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { BasicManager } from './BasicManager.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppServer, AppSocket } from './App.ts';

export default class SchaetzungManager implements BasicManager {
	private readonly historyManager: HistoryManager;
	private readonly server: AppServer;
	private readonly eventBus: QuizPokerEventBus;
	private readonly playerManager: PlayerManager;

	private schaetzungen: Map<PlayerId, number> = new Map();
	private gameMasterId: string | null = null;
	private correctAnswer: number | null = null;

	public constructor(
		historyManager: HistoryManager,
		eventBus: QuizPokerEventBus,
		playerManager: PlayerManager,
		server: AppServer
	) {
		this.historyManager = historyManager;
		this.eventBus = eventBus;
		this.playerManager = playerManager;
		this.server = server;

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

	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		socket
			.on('GAME_MASTER_CONNECTING', () => this.gameMasterConnecting(socket, uuid))
			.on('SCHAETZUNG_ABGEBEN', (schaetzung) => this.schaetzungAbgeben(uuid, schaetzung))
			.on(
				'PLAY_QUESTION',
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				(question, hinweis_1, hinweis_2, answer, einheit) =>
					(this.correctAnswer = Number.parseInt(answer))
			)
			.on('DRAW_WINNER', () => this.findWinner());
	}

	private gameMasterConnecting(socket: AppSocket, playerId: PlayerId): void {
		this.gameMasterId = playerId;

		socket.join('game-master');
	}

	private schaetzungAbgeben(playerId: PlayerId, schaetzung: number): void {
		this.schaetzungen.set(playerId, schaetzung);

		this.server.to('game-master').emit('MEMBER_ISSUED_SCHAETZUNG', playerId, schaetzung);
	}

	private revealSchaetzungen(): void {
		const currentlyPlayingClients = this.playerManager
			.getPlayers()
			.filter((x) => x.status != MemberStatus.PLEITE)
			.map((x) => x.playerId);

		this.schaetzungen.forEach((schaetzung, clientId) => {
			this.server
				.except(currentlyPlayingClients)
				.emit('MEMBER_ISSUED_SCHAETZUNG', clientId, schaetzung);
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
					payload: this.playerManager.getPlayingPlayers().map((x) => x.playerId)
				}
			});
			return;
		}

		let winnerIds: PlayerId[] = [];
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
