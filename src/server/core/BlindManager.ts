import type PlayerManager from './PlayerManager.ts';
import type BetManager from './BetManager.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export class BlindManager {
	private static readonly BLIND_AMOUNT_INCREASE = 100;

	private readonly playerManager: PlayerManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly betManager: BetManager;

	private bigBlindPlayerId: Map<GameCode, PlayerId | null> = new Map();
	private smallBlindPlayerId: Map<GameCode, PlayerId | null> = new Map();
	private blindAmount: Map<GameCode, number> = new Map();

	public constructor(
		eventBus: QuizPokerEventBus,
		playerManager: PlayerManager,
		betManager: BetManager
	) {
		this.eventBus = eventBus;
		this.playerManager = playerManager;
		this.betManager = betManager;

		this.eventBus.registerToEvent({
			event: 'PHASE-TRIGGERED',
			listener: (event) => {
				if (event.payload.Phase != FragenPhase.FRAGE) {
					return;
				}

				this.shuffleBlinds(event.payload.Room);
			}
		});
	}

	private shuffleBlinds(room: GameCode): void {
		this.blindAmount.set(
			room,
			this.blindAmount.get(room) ??
				BlindManager.BLIND_AMOUNT_INCREASE + BlindManager.BLIND_AMOUNT_INCREASE
		);

		const playingPlayers = this.playerManager.getPlayingPlayers(room);
		const bigBlindId = this.bigBlindPlayerId.get(room);
		const smallBlindId = this.smallBlindPlayerId.get(room);

		if (bigBlindId == null && smallBlindId == null) {
			this.bigBlindPlayerId.set(room, playingPlayers.at(1)!.playerId);
			this.smallBlindPlayerId.set(room, playingPlayers.at(0)!.playerId);
		} else {
			const bigBlindIndex = playingPlayers.findIndex((x) => x.playerId == bigBlindId);
			this.smallBlindPlayerId.set(room, bigBlindId ?? null);

			this.bigBlindPlayerId.set(
				room,
				(playingPlayers.at(bigBlindIndex + 1) ?? playingPlayers.at(0)!).playerId
			);
		}

		this.betManager.addBet(room, {
			bet: this.blindAmount.get(room) ?? 250 / 2,
			player_id: this.smallBlindPlayerId.get(room)!
		});

		this.betManager.addBet(room, {
			bet: this.blindAmount.get(room) ?? 500,
			player_id: this.bigBlindPlayerId.get(room)!
		});

		this.eventBus.dispatch({
			event: {
				type: 'BIG-BLIND-SET',
				payload: {
					BigBlind: this.bigBlindPlayerId.get(room)!,
					Room: room
				}
			}
		});
	}

	public getBigBlind(room: GameCode): PlayerId {
		return (
			this.bigBlindPlayerId.get(room) ?? this.playerManager.getPlayingPlayers(room).at(1)!.playerId
		);
	}

	public getSmallBlind(room: GameCode): PlayerId {
		return (
			this.smallBlindPlayerId.get(room) ??
			this.playerManager.getPlayingPlayers(room).at(0)!.playerId
		);
	}
}
