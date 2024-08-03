import type WebSocketConnection from '@server/connection/WebSocketConnection.ts';
import type PlayerManager from './PlayerManager.ts';
import type BetManager from './BetManager.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import { FragenPhase } from '@poker-lib/message/ServerMessage.ts';

export class BlindManager {
	private static readonly BLIND_AMOUNT_INCREASE = 200;

	private readonly connection: WebSocketConnection;
	private readonly playerManager: PlayerManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly betManager: BetManager;

	private bigBlindPlayerId: string | null = null;
	private smallBlindPlayerId: string | null = null;
	private blindAmount: number = 0;

	public constructor(
		connection: WebSocketConnection,
		eventBus: QuizPokerEventBus,
		playerManager: PlayerManager,
		betManager: BetManager
	) {
		this.connection = connection;
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
			this.bigBlindPlayerId = playingPlayers.at(1)!.client.uuid;
			this.smallBlindPlayerId = playingPlayers.at(0)!.client.uuid;
		} else {
			const smallBlindIndex = playingPlayers.findIndex(
				(x) => x.client.uuid == this.smallBlindPlayerId
			);

			this.bigBlindPlayerId = this.smallBlindPlayerId!;
			this.smallBlindPlayerId = (
				playingPlayers.at(smallBlindIndex + 1) ?? playingPlayers.at(0)!
			).client.uuid;
		}

		this.betManager.addBet({
			bet: this.blindAmount / 2,
			player_id: this.smallBlindPlayerId
		});

		this.betManager.addBet({
			bet: this.blindAmount,
			player_id: this.bigBlindPlayerId
		});

		this.eventBus.dispatch({
			event: {
				type: 'BIG-BLIND-SET',
				payload: this.bigBlindPlayerId
			}
		});
	}

	public getBigBlind(): string {
		return this.bigBlindPlayerId ?? this.playerManager.getPlayingPlayers().at(0)!.client.uuid;
	}

	public getSmallBlind(): string {
		return this.smallBlindPlayerId ?? this.playerManager.getPlayingPlayers().at(1)!.client.uuid;
	}
}
