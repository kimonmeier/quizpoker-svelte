import type PlayerManager from './PlayerManager.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type BetManager from './BetManager.ts';
import type { BlindManager } from './BlindManager.ts';
import type { HistoryManager } from './HistoryManager.ts';
import { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { BasicManager } from './BasicManager.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppServer, AppSocket } from './App.ts';

export class ControlsManager implements BasicManager {
	private readonly historyManager: HistoryManager;
	private readonly server: AppServer;
	private readonly playerManager: PlayerManager;
	private readonly betManager: BetManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly blindManager: BlindManager;

	private currentPlayerInControl: PlayerId | null = null;
	private players: Map<string, number> = new Map();
	private lastPlayerToBet: PlayerId | null = null;
	private bigBlindId: PlayerId | null = null;

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
				this.bigBlindId = event.payload;

				this.takePlayerControls();

				this.lastPlayerToBet = this.findNextPlayerId(this.bigBlindId!)!;
			}
		});

		this.eventBus.registerToEvent({
			event: 'PHASE-TRIGGERED',
			listener: (event) => {
				if (event.payload == FragenPhase.FRAGE || event.payload == FragenPhase.PAUSE) {
					return;
				}

				if (this.lastPlayerToBet == null) {
					return;
				}

				this.givePlayerControls(this.lastPlayerToBet, this.lastPlayerToBet);
				this.lastPlayerToBet = this.currentPlayerInControl!;
			}
		});
	}

	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		socket
			.on('disconnect', () => this.players.delete(uuid))
			.on('PLAYER_CONNECTING', () => this.players.set(uuid, 0))
			.on('GIVE_PLAYER_CONTROLS', (playerId) => this.givePlayerControlsByGameMaster(playerId))
			.on('CHANGE_PHASE', (phase) => this.changePhase(phase))
			.on('RAISE', () => this.raise(uuid))
			.on('FOLD', () => this.fold())
			.on('CHECK', () => this.moveControlsForward())
			.on('CALL', () => this.moveControlsForward())
			.on('REPORT_VISIBILITY_CHANGED', (visible) =>
				this.server.to('game-master').emit('REPORT_VISIBILITY_CHANGED', uuid, visible)
			);
	}

	private givePlayerControlsByGameMaster(playerId: PlayerId): void {
		console.log('Controls SELECTED');
		const lastPlayerId = this.currentPlayerInControl;
		this.takePlayerControls();

		if (lastPlayerId == null) {
			this.givePlayerControls(playerId, this.bigBlindId);
		} else if (lastPlayerId != playerId) {
			this.givePlayerControls(playerId, lastPlayerId);
		}
	}

	private changePhase(phase: FragenPhase): void {
		this.takePlayerControls();

		if (phase == FragenPhase.PAUSE) {
			return;
		}

		if (this.playerManager.getPlayingPlayers().length == 1) {
			return;
		}

		this.givePlayerControls(this.lastPlayerToBet!, this.lastPlayerToBet!);
		this.lastPlayerToBet = this.currentPlayerInControl!;
	}

	private raise(playerId: PlayerId): void {
		this.lastPlayerToBet = playerId;
		this.moveControlsForward();
	}

	private fold(): void {
		setTimeout(() => {
			if (this.playerManager.getPlayingPlayers().length == 1) {
				this.takePlayerControls();
			} else {
				this.moveControlsForward();
			}
		}, 500);
	}

	private givePlayerControls(playerId: PlayerId, lastPlayerId: PlayerId | null): void {
		this.currentPlayerInControl = playerId;
		this.players.set(playerId, Date.now());

		this.historyManager.SendAndSaveToHistory(
			'GIVE_PLAYER_CONTROLS',
			playerId,
			this.betManager.getBetValues(lastPlayerId ?? this.blindManager.getBigBlind()) + 50
		);
	}

	private takePlayerControls(): void {
		if (this.currentPlayerInControl == null) {
			return;
		}

		this.historyManager.SendAndSaveToHistory('TAKE_PLAYER_CONTROLS', this.currentPlayerInControl);

		this.currentPlayerInControl = null;
	}

	private moveControlsForward(): void {
		let moveControlsForward = true;
		if (
			this.lastPlayerToBet &&
			this.lastPlayerToBet == this.findNextPlayerId(this.currentPlayerInControl!)
		) {
			moveControlsForward = false;
		}

		const lastPlayerId = this.currentPlayerInControl;
		this.takePlayerControls();

		if (!moveControlsForward) {
			this.eventBus.dispatch({
				event: {
					type: 'TRIGGER-NEXT-PHASE',
					payload: undefined
				}
			});
			return;
		}

		if (this.playerManager.getPlayingPlayers().length == 1) {
			return;
		}

		const nextPlayerId = this.findNextPlayerId(lastPlayerId ?? this.bigBlindId!);

		if (!nextPlayerId) {
			return;
		}

		this.givePlayerControls(nextPlayerId, this.lastPlayerToBet);
	}

	private findNextPlayerId(startId: PlayerId): PlayerId | undefined {
		const playingPlayers = this.playerManager.getPlayingPlayers();

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
