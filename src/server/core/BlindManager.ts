import type PlayerManager from './PlayerManager.ts';
import type BetManager from './BetManager.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export class BlindManager {
	private static readonly BLIND_AMOUNT_INCREASE = 100;

	private readonly playerManager: PlayerManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly betManager: BetManager;

	private bigBlindPlayerId: PlayerId | null = null;
	private smallBlindPlayerId: PlayerId | null = null;
	private blindAmount: number = 0;

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
				if (event.payload != FragenPhase.FRAGE) {
					return;
				}

				this.shuffleBlinds();
			}
		});
	}

	private shuffleBlinds(): void {
		this.blindAmount += BlindManager.BLIND_AMOUNT_INCREASE;

		const playingPlayers = this.playerManager.getPlayingPlayers();
		if (this.bigBlindPlayerId == null && this.smallBlindPlayerId == null) {
			this.bigBlindPlayerId = playingPlayers.at(1)!.playerId;
			this.smallBlindPlayerId = playingPlayers.at(0)!.playerId;
		} else {
			const bigBlindIndex = playingPlayers.findIndex((x) => x.playerId == this.bigBlindPlayerId);
			this.smallBlindPlayerId = this.bigBlindPlayerId!;

			this.bigBlindPlayerId = (
				playingPlayers.at(bigBlindIndex + 1) ?? playingPlayers.at(0)!
			).playerId;
		}

		this.betManager.addBet({
			bet: this.blindAmount / 2,
			player_id: this.smallBlindPlayerId!
		});

		this.betManager.addBet({
			bet: this.blindAmount,
			player_id: this.bigBlindPlayerId!
		});

		this.eventBus.dispatch({
			event: {
				type: 'BIG-BLIND-SET',
				payload: this.bigBlindPlayerId!
			}
		});
	}

	public getBigBlind(): PlayerId {
		return this.bigBlindPlayerId ?? this.playerManager.getPlayingPlayers().at(1)!.playerId;
	}

	public getSmallBlind(): PlayerId {
		return this.smallBlindPlayerId ?? this.playerManager.getPlayingPlayers().at(0)!.playerId;
	}
}
