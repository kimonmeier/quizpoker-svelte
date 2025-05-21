import type PlayerManager from './PlayerManager.ts';
import type BetManager from './BetManager.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { BasicManager } from './BasicManager.ts';
import type { AppSocket } from './App.ts';

export class BlindManager implements BasicManager {
	private static readonly BLIND_AMOUNT_INCREASE = 100;

	private readonly playerManager: PlayerManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly betManager: BetManager;

	private blindAmount: Map<GameCode, number> = new Map();
	private lastBigBlind: Map<GameCode, PlayerId | null> = new Map();

	public constructor(
		eventBus: QuizPokerEventBus,
		playerManager: PlayerManager,
		betManager: BetManager
	) {
		this.eventBus = eventBus;
		this.playerManager = playerManager;
		this.betManager = betManager;
	}

	public registerSocket(socket: AppSocket, uuid: PlayerId) {
		socket.on('PLAY_QUESTION', (roomCode, bigBlindPlayerId, bigBlindAmount) =>
			this.setBlinds(bigBlindPlayerId, bigBlindAmount, roomCode)
		);
	}

	private setBlinds(bigBlindPlayerId: PlayerId, bigBlindAmount: number, room: GameCode): void {
		console.log('Setting blinds', bigBlindPlayerId, bigBlindAmount, room);
		this.blindAmount.set(room, bigBlindAmount);
		const playingPlayers = this.playerManager.getPlayingPlayers(room);
		console.log('Playing players', playingPlayers);

		const bigBlindPlayer = playingPlayers.find((player) => player.playerId === bigBlindPlayerId);
		const bigBlindPlayerIndex = playingPlayers.indexOf(bigBlindPlayer!);

		let smallBlindPlayerIndex = bigBlindPlayerIndex - 1;
		if (smallBlindPlayerIndex < 0) {
			smallBlindPlayerIndex = playingPlayers.length - 1;
		}
		const smallBlindPlayer = playingPlayers[smallBlindPlayerIndex];

		console.log('Small blind', smallBlindPlayer, this.blindAmount.get(room)! / 2);
		console.log('Big blind', bigBlindPlayer, this.blindAmount.get(room)!);

		this.betManager.addBet(room, {
			bet: this.blindAmount.get(room)! / 2,
			player_id: smallBlindPlayer.playerId
		});

		this.betManager.addBet(room, {
			bet: this.blindAmount.get(room)!,
			player_id: bigBlindPlayerId
		});

		this.lastBigBlind.set(room, bigBlindPlayerId);

		this.eventBus.dispatch({
			event: {
				type: 'BIG-BLIND-SET',
				payload: {
					BigBlind: bigBlindPlayerId,
					Room: room
				}
			}
		});
	}

	public getLastBigBlind(room: GameCode): PlayerId | null {
		return this.lastBigBlind.get(room) ?? null;
	}
}
