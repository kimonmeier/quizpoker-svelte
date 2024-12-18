import type { Bet, SidePot } from '../entities/Bet.ts';
import type PlayerManager from './PlayerManager.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import { SidePotHelper } from '@server/utils/SidePotHelper.ts';
import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import { ArrayUtils } from '@poker-lib/utils/ArrayUtils.ts';
import type { HistoryManager } from './HistoryManager.ts';
import type { BasicManager } from './BasicManager.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppSocket } from './App.ts';
import { ToastType } from '@poker-lib/enums/ToastType.ts';
import { MemberAction } from '@poker-lib/enums/MemberAction.ts';

export default class BetManager implements BasicManager {
	private readonly playerManger: PlayerManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly historyManager: HistoryManager;

	private bets: Bet[] = [];
	private lastPlayer: PlayerId | null = null;

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
			listener: (event) => this.anounceWinner(...event.payload)
		});

		this.eventBus.registerToEvent({
			event: 'BIG-BLIND-SET',
			listener: (event) => (this.lastPlayer = event.payload)
		});
	}

	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		socket
			.on('disconnect', () => this.clearBetFromPlayer(uuid))
			.on('UPDATE_PLAYER_EINSATZ', (playerId, chips) =>
				this.addBet({ player_id: playerId, bet: chips - this.getBetValues(playerId) })
			)
			.on('FOLD', () => this.fold(uuid))
			.on('CHECK', () => this.check(uuid))
			.on('CALL', () => this.call(uuid))
			.on('RAISE', (valueRaisedTo) => this.raise(uuid, valueRaisedTo));
	}

	private fold(playerId: PlayerId): void {
		this.historyManager.SendAndSaveToHistory('SHOW_TOAST', playerId, MemberAction.FOLDED);

		this.lastPlayer = playerId;
	}

	private check(playerId: PlayerId): void {
		const betValues = this.getBetValues(playerId);

		if (betValues < this.getBetValues(this.lastPlayer!)) {
			this.call(playerId);
			return;
		}

		this.historyManager.SendAndSaveToHistory('SHOW_TOAST', playerId, MemberAction.CHECK);
		this.lastPlayer = playerId;
	}

	private call(playerId: PlayerId): void {
		const betValues = this.getBetValues(playerId);
		const lastPlayerbet = this.getBetValues(this.lastPlayer!);

		this.addBet({
			player_id: playerId,
			bet: lastPlayerbet - betValues
		});

		this.historyManager.SendAndSaveToHistory(
			'SHOW_TOAST',
			playerId,
			MemberAction.CALL,
			lastPlayerbet - betValues
		);

		this.lastPlayer = playerId;
	}

	private raise(playerId: PlayerId, valueRaisedTo: number): void {
		const betValues = this.getBetValues(playerId);
		const valueRaised = valueRaisedTo - betValues;

		this.addBet({ player_id: playerId, bet: valueRaised });

		this.historyManager.SendAndSaveToHistory(
			'SHOW_TOAST',
			playerId,
			MemberAction.RAISE,
			valueRaised
		);

		this.lastPlayer = playerId;
	}

	public getBetValues(userId: PlayerId): number {
		return ArrayUtils.sumField(
			this.bets.filter((x) => x.player_id == userId),
			'bet'
		);
	}

	public addBet(bet: Bet): void {
		const playerChips = this.playerManger.getChips(bet.player_id);
		if (playerChips <= bet.bet + this.getBetValues(bet.player_id)) {
			bet.bet = playerChips - this.getBetValues(bet.player_id);
		}

		this.bets.push(bet);

		this.historyManager.SendAndSaveToHistory(
			'BET_CHANGED',
			bet.player_id,
			this.getBetValues(bet.player_id)
		);
		this.historyManager.SendAndSaveToHistory('CHANGE_POT', this.getPot());
	}

	private clearBetFromPlayer(id: PlayerId): void {
		this.bets = this.bets.filter((x) => x.player_id != id);

		this.historyManager.SendAndSaveToHistory('BET_CHANGED', id, 0);
		this.historyManager.SendAndSaveToHistory('CHANGE_POT', this.getPot());
	}

	private getPot(): number {
		let pot = 0;

		this.bets.forEach((element) => {
			pot += element.bet;
		});

		return pot;
	}

	private anounceWinner(...wonPlayers: PlayerId[]): void {
		if (wonPlayers.length == 1) {
			this.playerManger.adjustChips(
				wonPlayers.at(0)!,
				this.playerManger.getChips(wonPlayers.at(0)!) + this.getPot()
			);
			this.flushChips();
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
			this.playerManger.getPlayingPlayers().map((x) => x.playerId)
		);

		result.forEach((result) => {
			this.playerManger.adjustChips(
				result.playerId,
				this.playerManger.getChips(result.playerId) + result.chipsWon
			);
		});

		this.flushChips();
	}

	private flushChips(): void {
		this.playerManger.getPlayers().forEach((player) => {
			const playerId = player.playerId;

			this.playerManger.adjustChips(
				playerId,
				this.playerManger.getChips(playerId) - this.getBetValues(playerId)
			);
			this.clearBetFromPlayer(playerId);
		});
	}
}
