import type PlayerManager from './PlayerManager.ts';
import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type { HistoryManager } from './HistoryManager.ts';
import { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { BasicManager } from './BasicManager.ts';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppServer, AppSocket } from './App.ts';
import { PUBLIC_ROOM_CODE } from './Konst.ts';

export default class SchaetzungManager implements BasicManager {
	private readonly historyManager: HistoryManager;
	private readonly server: AppServer;
	private readonly eventBus: QuizPokerEventBus;
	private readonly playerManager: PlayerManager;

	private schaetzungen: Map<GameCode, Map<PlayerId, number>> = new Map();
	private correctAnswer: Map<GameCode, number | null> = new Map();

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
			listener: (data) => {
				if (data.payload.Phase == FragenPhase.RUNDE_1) {
					this.revealSchaetzungen(data.payload.Room);
				} else if (data.payload.Phase == FragenPhase.PAUSE) {
					this.schaetzungen.clear();
				}
			}
		});
	}

	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		socket
			.on('SCHAETZUNG_ABGEBEN', (schaetzung) => this.schaetzungAbgeben(uuid, schaetzung))
			.on(
				'PLAY_QUESTION',
				(roomCode, bigBlindPlayerId, bigBlindAmount, question, hinweis_1, hinweis_2, answer) =>
					this.correctAnswer.set(roomCode, Number.parseInt(answer))
			)
			.on('DRAW_WINNER', (roomCode) => this.findWinner(roomCode))
			.on('GAME_MASTER_REVEAL_SCHAETZUNGEN_TO_CROWD', (roomCode) =>
				this.revealSchaetzungen(roomCode)
			)
			.on('GAME_MASTER_REVEAL_SCHAETZUNGEN_TO_PLAYERS', (roomCode, playerId) =>
				this.revealSchaetzungenToPlayers(roomCode, playerId)
			);
	}

	private schaetzungAbgeben(playerId: PlayerId, schaetzung: number): void {
		const roomCode = this.playerManager.getRoomCodeByPlayerId(playerId);

		const map = this.schaetzungen.get(roomCode) ?? new Map();
		map.set(playerId, schaetzung);

		this.schaetzungen.set(roomCode, map);

		console.log('Schaetzung recieved:', schaetzung, playerId, roomCode);

		this.server
			.to('game-master-' + roomCode)
			.emit('MEMBER_ISSUED_SCHAETZUNG', playerId, schaetzung);
	}

	private revealSchaetzungen(roomCode: GameCode): void {
		this.schaetzungen.get(roomCode)!.forEach((schaetzung, clientId) => {
			this.server
				.to(roomCode)
				.to(PUBLIC_ROOM_CODE)
				.emit('MEMBER_ISSUED_SCHAETZUNG', clientId, schaetzung);
		});
	}

	private revealSchaetzungenToPlayers(roomCode: GameCode, playerId: PlayerId): void {
		const schaetzung = this.schaetzungen.get(roomCode)!.get(playerId);

		if (schaetzung == null) {
			throw new Error('No schaetzung found for player: ' + playerId);
		}

		this.server.to(roomCode).emit('MEMBER_ISSUED_SCHAETZUNG', playerId, schaetzung);
	}

	private findWinner(roomCode: GameCode): void {
		if (this.correctAnswer === null) {
			throw new Error('Keine Antwort um herauszufinden wer gewonnen hat!');
		}

		if (this.playerManager.getPlayingPlayers(roomCode).length == 1) {
			this.eventBus.dispatch({
				event: {
					type: 'PLAYER-WON-ROUND',
					payload: {
						Room: roomCode,
						Players: this.playerManager.getPlayingPlayers(roomCode).map((x) => x.playerId)
					}
				}
			});
			return;
		}

		let winnerIds: PlayerId[] = [];
		let winnerNumber: number | null = null;

		Array.from((this.schaetzungen.get(roomCode) ?? new Map()).entries()).forEach((x) => {
			if (this.playerManager.getPlayerByUuid(x[0]) == null) {
				return;
			}

			if (this.playerManager.getPlayerByUuid(x[0]).status != MemberStatus.ON) {
				return;
			}

			if (winnerNumber == null) {
				winnerNumber = x[1];
				winnerIds = [x[0]];
				return;
			}

			const correctAnswer = this.correctAnswer.get(roomCode);

			let differenzeWinner = winnerNumber - correctAnswer!;
			let differenzeActualPlayer = x[1] - correctAnswer!;

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
				payload: { Room: roomCode, Players: winnerIds }
			}
		});
	}
}
