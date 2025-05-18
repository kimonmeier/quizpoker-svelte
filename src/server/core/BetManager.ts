import type { Bet, SidePot } from '../entities/Bet.ts';
import type PlayerManager from './PlayerManager.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import { SidePotHelper } from '@server/utils/SidePotHelper.ts';
import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import { ArrayUtils } from '@poker-lib/utils/ArrayUtils.ts';
import type { HistoryManager } from './HistoryManager.ts';
import type { BasicManager } from './BasicManager.ts';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppSocket } from './App.ts';
import { ToastType } from '@poker-lib/enums/ToastType.ts';
import { MemberAction } from '@poker-lib/enums/MemberAction.ts';

export default class BetManager implements BasicManager {
	private readonly playerManger: PlayerManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly historyManager: HistoryManager;

	private bets: Map<GameCode, Bet[]> = new Map();
	private lastPlayer: Map<GameCode, PlayerId | null> = new Map();

	public constructor(
		historyManager: HistoryManager,
		eventBus: QuizPokerEventBus,
		playerManager: PlayerManager
	) {
		this.historyManager = historyManager;
		this.eventBus = eventBus;
		this.playerManger = playerManager;

		this.eventBus.registerToEvent({
			event: 'PLAYER-WON-ROUND',
			listener: (event) => this.anounceWinner(event.payload.Room, ...event.payload.Players)
		});

		this.eventBus.registerToEvent({
			event: 'BIG-BLIND-SET',
			listener: (event) => this.lastPlayer.set(event.payload.Room, event.payload.BigBlind)
		});
	}

	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		socket
			.on('disconnect', () =>
				this.clearBetFromPlayer(this.playerManger.getRoomCodeByPlayerId(uuid), uuid)
			)
			.on('UPDATE_PLAYER_EINSATZ', (room, playerId, chips) =>
				this.addBet(room, { player_id: playerId, bet: chips - this.getBetValues(playerId) })
			)
			.on('FOLD', () => this.fold(uuid))
			.on('CHECK', () => this.check(uuid))
			.on('CALL', () => this.call(uuid))
			.on('RAISE', (valueRaisedTo) => this.raise(uuid, valueRaisedTo));
	}

	private fold(playerId: PlayerId): void {
		const roomCode = this.playerManger.getRoomCodeByPlayerId(playerId);

		this.historyManager.SendAndSaveToHistory(roomCode, 'SHOW_TOAST', playerId, MemberAction.FOLDED);

		this.lastPlayer.set(roomCode, playerId);
	}

	private check(playerId: PlayerId): void {
		const betValues = this.getBetValues(playerId);
		const roomCode = this.playerManger.getRoomCodeByPlayerId(playerId);
		const lastPlayerbetId = this.lastPlayer.get(roomCode)!;

		if (betValues < this.getBetValues(lastPlayerbetId)) {
			this.call(playerId);
			return;
		}

		this.historyManager.SendAndSaveToHistory(roomCode, 'SHOW_TOAST', playerId, MemberAction.CHECK);
		this.lastPlayer.set(roomCode, playerId);
	}

	private call(playerId: PlayerId): void {
		const betValues = this.getBetValues(playerId);
		const roomCode = this.playerManger.getRoomCodeByPlayerId(playerId);
		const lastPlayerbetId = this.lastPlayer.get(roomCode)!;
		const lastPlayerbet = this.getBetValues(lastPlayerbetId);

		this.addBet(roomCode, {
			player_id: playerId,
			bet: lastPlayerbet - betValues
		});

		this.historyManager.SendAndSaveToHistory(
			roomCode,
			'SHOW_TOAST',
			playerId,
			MemberAction.CALL,
			lastPlayerbet - betValues
		);

		this.lastPlayer.set(roomCode, playerId);
	}

	private raise(playerId: PlayerId, valueRaisedTo: number): void {
		const betValues = this.getBetValues(playerId);
		const valueRaised = valueRaisedTo - betValues;
		const roomCode = this.playerManger.getRoomCodeByPlayerId(playerId);

		this.addBet(roomCode, { player_id: playerId, bet: valueRaised });

		this.historyManager.SendAndSaveToHistory(
			roomCode,
			'SHOW_TOAST',
			playerId,
			MemberAction.RAISE,
			valueRaised
		);

		this.lastPlayer.set(roomCode, playerId);
	}

	public getBetValues(userId: PlayerId): number {
		const roomCode = this.playerManger.getRoomCodeByPlayerId(userId);
		const bets = this.bets.get(roomCode);
		if (!bets) {
			return 0;
		}

		return ArrayUtils.sumField(
			bets.filter((x) => x.player_id == userId),
			'bet'
		);
	}

	public addBet(roomCode: GameCode, bet: Bet): void {
		const playerChips = this.playerManger.getChips(bet.player_id);
		if (playerChips <= bet.bet + this.getBetValues(bet.player_id)) {
			bet.bet = playerChips - this.getBetValues(bet.player_id);
		}

		if (!this.bets.get(roomCode)) {
			this.bets.set(roomCode, []);
			return;
		}

		this.bets.get(roomCode)!.push(bet);

		this.historyManager.SendAndSaveToHistory(
			roomCode,
			'BET_CHANGED',
			bet.player_id,
			this.getBetValues(bet.player_id)
		);
		this.historyManager.SendAndSaveToHistory(roomCode, 'CHANGE_POT', this.getPot(roomCode));
	}

	private clearBetFromPlayer(roomCode: GameCode, id: PlayerId): void {
		this.bets.set(
			roomCode,
			(this.bets.get(roomCode) ?? []).filter((x) => x.player_id != id)
		);

		this.historyManager.SendAndSaveToHistory(roomCode, 'BET_CHANGED', id, 0);
		this.historyManager.SendAndSaveToHistory(roomCode, 'CHANGE_POT', this.getPot(roomCode));
	}

	private getPot(roomCode: GameCode): number {
		let pot = 0;

		if (!this.bets.get(roomCode)) {
			this.bets.set(roomCode, []);
		}

		this.bets.get(roomCode)!.forEach((element) => {
			pot += element.bet;
		});

		return pot;
	}

	private anounceWinner(roomCode: GameCode, ...wonPlayers: PlayerId[]): void {
		if (wonPlayers.length == 1) {
			this.playerManger.adjustChips(
				roomCode,
				wonPlayers.at(0)!,
				this.playerManger.getChips(wonPlayers.at(0)!) + this.getPot(roomCode)
			);
			this.flushChips(roomCode);
			return;
		}

		const players = this.playerManger
			.getPlayers()
			.filter((x) => x.status !== MemberStatus.PLEITE)
			.map((player) => ({
				playerId: player.playerId,
				bet: this.getBetValues(player.playerId),
				chips: this.playerManger.getChips(player.playerId)
			}));

		const sidePots: SidePot[] = SidePotHelper.calculateSidePots(players);
		const result = SidePotHelper.distributeChips(
			sidePots,
			wonPlayers,
			this.playerManger.getPlayingPlayers(roomCode).map((x) => x.playerId)
		);

		result.forEach((result) => {
			this.playerManger.adjustChips(
				roomCode,
				result.playerId,
				this.playerManger.getChips(result.playerId) + result.chipsWon
			);
		});

		this.flushChips(roomCode);
	}

	private flushChips(roomCode: GameCode): void {
		this.playerManger.getPlayersByRoom(roomCode)?.forEach((player) => {
			this.playerManger.adjustChips(
				roomCode,
				player.playerId,
				this.playerManger.getChips(player.playerId) - this.getBetValues(player.playerId)
			);
			this.clearBetFromPlayer(roomCode, player.playerId);
		});
	}
}
