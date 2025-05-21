import type PlayerManager from './PlayerManager.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type BetManager from './BetManager.ts';
import type { BlindManager } from './BlindManager.ts';
import type { HistoryManager } from './HistoryManager.ts';
import { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { BasicManager } from './BasicManager.ts';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppServer, AppSocket } from './App.ts';

export class ControlsManager implements BasicManager {
	private readonly historyManager: HistoryManager;
	private readonly server: AppServer;
	private readonly playerManager: PlayerManager;
	private readonly betManager: BetManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly blindManager: BlindManager;

	private currentPlayerInControl: Map<GameCode, PlayerId | null> = new Map();
	private lastPlayerToBet: Map<GameCode, PlayerId | null> = new Map();
	private bigBlindId: Map<GameCode, PlayerId | null> = new Map();

	public constructor(
		historyManager: HistoryManager,
		eventBus: QuizPokerEventBus,
		betManager: BetManager,
		playerManager: PlayerManager,
		blindManager: BlindManager,
		appServer: AppServer
	) {
		this.historyManager = historyManager;
		this.eventBus = eventBus;
		this.betManager = betManager;
		this.playerManager = playerManager;
		this.blindManager = blindManager;
		this.server = appServer;

		this.eventBus.registerToEvent({
			event: 'BIG-BLIND-SET',
			listener: (event) => {
				this.bigBlindId.set(event.payload.Room, event.payload.BigBlind);

				this.takePlayerControls(event.payload.Room);

				this.lastPlayerToBet.set(
					event.payload.Room,
					this.findNextPlayerId(event.payload.Room, this.bigBlindId.get(event.payload.Room)!)!
				);
			}
		});

		this.eventBus.registerToEvent({
			event: 'PHASE-TRIGGERED',
			listener: (event) => {
				if (event.payload.Phase == FragenPhase.FRAGE || event.payload.Phase == FragenPhase.PAUSE) {
					return;
				}

				if (this.lastPlayerToBet == null) {
					return;
				}

				this.givePlayerControls(
					event.payload.Room,
					this.lastPlayerToBet.get(event.payload.Room)!,
					this.lastPlayerToBet.get(event.payload.Room)!
				);
				this.lastPlayerToBet.set(
					event.payload.Room,
					this.currentPlayerInControl.get(event.payload.Room)!
				);
			}
		});
	}

	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		socket
			.on('GIVE_PLAYER_CONTROLS', (roomCode, playerId) =>
				this.givePlayerControlsByGameMaster(roomCode, playerId)
			)
			.on('CHANGE_PHASE', (roomCode, phase) => this.changePhase(roomCode, phase))
			.on('RAISE', () => this.raise(this.playerManager.getRoomCodeByPlayerId(uuid), uuid))
			.on('FOLD', () => this.fold(this.playerManager.getRoomCodeByPlayerId(uuid)))
			.on('CHECK', () => this.moveControlsForward(this.playerManager.getRoomCodeByPlayerId(uuid)))
			.on('CALL', () => this.moveControlsForward(this.playerManager.getRoomCodeByPlayerId(uuid)))
			.on('REPORT_VISIBILITY_CHANGED', (visible) => {
				this.server
					.to('game-master-' + this.playerManager.getRoomCodeByPlayerId(uuid))
					.emit('REPORT_VISIBILITY_CHANGED', uuid, visible);
			});
	}

	private givePlayerControlsByGameMaster(roomCode: GameCode, playerId: PlayerId): void {
		console.log('Controls SELECTED');
		const lastPlayerId = this.currentPlayerInControl.get(roomCode);
		this.takePlayerControls(roomCode);

		if (lastPlayerId == null) {
			this.givePlayerControls(roomCode, playerId, this.bigBlindId.get(roomCode) ?? null);
		} else if (lastPlayerId != playerId) {
			this.givePlayerControls(roomCode, playerId, lastPlayerId);
		}
	}

	private changePhase(roomCode: GameCode, phase: FragenPhase): void {
		this.takePlayerControls(roomCode);

		if (phase == FragenPhase.PAUSE) {
			return;
		}

		if (this.playerManager.getPlayingPlayers(roomCode).length == 1) {
			return;
		}

		this.givePlayerControls(
			roomCode,
			this.lastPlayerToBet.get(roomCode)!,
			this.lastPlayerToBet.get(roomCode)!
		);
		this.lastPlayerToBet.set(roomCode, this.currentPlayerInControl.get(roomCode)!);
	}

	private raise(roomCode: GameCode, playerId: PlayerId): void {
		this.lastPlayerToBet.set(roomCode, playerId);
		this.moveControlsForward(roomCode);
	}

	private fold(roomCode: GameCode): void {
		setTimeout(() => {
			if (this.playerManager.getPlayingPlayers(roomCode).length == 1) {
				this.takePlayerControls(roomCode);
			} else {
				this.moveControlsForward(roomCode);
			}
		}, 500);
	}

	private givePlayerControls(
		room: GameCode,
		playerId: PlayerId,
		lastPlayerId: PlayerId | null
	): void {
		this.currentPlayerInControl.set(room, playerId);

		this.historyManager.SendAndSaveToHistory(
			room,
			'GIVE_PLAYER_CONTROLS',
			playerId,
			this.betManager.getBetValues(lastPlayerId ?? this.blindManager.getLastBigBlind(room)!) + 50
		);
	}

	private takePlayerControls(room: GameCode): void {
		if (this.currentPlayerInControl == null) {
			return;
		}

		this.historyManager.SendAndSaveToHistory(
			room,
			'TAKE_PLAYER_CONTROLS',
			this.currentPlayerInControl
		);

		this.currentPlayerInControl.set(room, null);
	}

	private moveControlsForward(room: GameCode): void {
		let moveControlsForward = true;
		const lastPlayerBetId = this.lastPlayerToBet.get(room);
		const currentPlayerId = this.currentPlayerInControl.get(room);
		if (lastPlayerBetId && lastPlayerBetId == this.findNextPlayerId(room, currentPlayerId!)) {
			moveControlsForward = false;
		}

		const lastPlayerId = this.currentPlayerInControl.get(room);
		this.takePlayerControls(room);

		if (!moveControlsForward) {
			this.eventBus.dispatch({
				event: {
					type: 'TRIGGER-NEXT-PHASE',
					payload: room
				}
			});
			return;
		}

		if (this.playerManager.getPlayingPlayers(room).length == 1) {
			return;
		}

		const nextPlayerId = this.findNextPlayerId(room, lastPlayerId ?? this.bigBlindId.get(room)!);

		if (!nextPlayerId) {
			return;
		}

		this.givePlayerControls(room, nextPlayerId, this.lastPlayerToBet.get(room)!);
	}

	private findNextPlayerId(room: GameCode, startId: PlayerId): PlayerId | undefined {
		const playingPlayers = this.playerManager.getPlayingPlayers(room);

		let count = 0;
		let playerId: PlayerId | undefined | null = startId;
		do {
			let indexLastPlayer = playingPlayers.findIndex((x) => x.playerId == playerId) + 1;
			if (indexLastPlayer >= playingPlayers.length) {
				indexLastPlayer = 0;
			}

			playerId = playingPlayers.at(indexLastPlayer)?.playerId;

			if (!playerId) {
				console.log('Something went wrong, no player found');
				return undefined;
			}

			count++;

			if (count >= 30) {
				return undefined;
			}
		} while (this.betManager.getBetValues(playerId) === this.playerManager.getChips(playerId));

		return playerId;
	}
}
