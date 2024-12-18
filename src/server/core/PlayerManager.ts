import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import StringHelper from '@poker-lib/utils/StringUtils.ts';
import type { Player } from '@server/entities/Player.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type { HistoryManager } from './HistoryManager.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { BasicManager } from './BasicManager.ts';
import type { AppSocket } from './App.ts';

export default class PlayerManager implements BasicManager {
	private readonly historyManager: HistoryManager;
	private readonly eventBus: QuizPokerEventBus;

	private players: Map<PlayerId, Player> = new Map();
	private chips: Map<string, number> = new Map();

	public constructor(historyManager: HistoryManager, eventBus: QuizPokerEventBus) {
		this.historyManager = historyManager;
		this.eventBus = eventBus;

		this.eventBus.registerToEvent({
			event: 'NEXT-QUESTION',
			listener: () => {
				const foldedPlayers = this.getPlayers();

				foldedPlayers.forEach((player) => {
					if (player.status == MemberStatus.PLEITE) {
						return;
					}

					const chips = this.getChips(player.playerId);
					if (chips == 0) {
						player.status = MemberStatus.PLEITE;
					} else {
						player.status = MemberStatus.ON;
					}

					this.players.set(player.playerId, player);

					this.historyManager.SendAndSaveToHistory(
						'STATUS_CHANGED',
						player.playerId,
						player.status
					);
				});
			}
		});
	}

	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		socket
			.on('disconnect', () => this.disconnectPlayer(uuid))
			.on('PLAYER_CONNECTING', (name, link, callback) =>
				callback(this.connectPlayer(uuid, name, link))
			)
			.on('FOLD', () => this.fold(uuid))
			.on('UPDATE_PLAYER_CHIPS', (playerId, chips) => this.adjustChips(playerId, chips))
			.on('GAME_MASTER_CONNECTING', (link, callback) => {
				this.historyManager.SendAndSaveToHistory('GAMEMASTER_LOGIN', link);
				callback(uuid);
			});
	}

	private connectPlayer(playerId: PlayerId, name: string, link: string): PlayerId {
		this.players.set(playerId, {
			playerId: playerId,
			name: name,
			link: link,
			status: MemberStatus.ON
		});

		this.chips.set(playerId, 10_000);
		this.historyManager.SendAndSaveToHistory('PLAYER_JOINED', playerId, name, link);

		return playerId;
	}

	private disconnectPlayer(playerId: PlayerId): void {
		this.chips.delete(playerId);

		this.players.delete(playerId);

		this.historyManager.SendAndSaveToHistory('PLAYER_LEFT', playerId);
	}

	private fold(playerId: PlayerId): void {
		const player = this.getPlayerByUuid(playerId);
		player.status = MemberStatus.FOLDED;
		this.players.set(playerId, player);

		this.historyManager.SendAndSaveToHistory('STATUS_CHANGED', playerId, MemberStatus.FOLDED);
	}

	public getPlayerByUuid(uuid: PlayerId): Player {
		return this.players.get(uuid)!;
	}

	public getPlayers(): Player[] {
		return Array.from(this.players.values());
	}

	public getPlayingPlayers(): Player[] {
		return Array.from(this.players.values())
			.filter((x) => x.status == MemberStatus.ON)
			.sort(this.comparePlayerFn);
	}

	public resetFoldedPlayer(): void {}

	private comparePlayerFn(player1: Player, player2: Player): number {
		return StringHelper.hashCode(player1.playerId) - StringHelper.hashCode(player2.playerId);
	}

	public getChips(playerId: string): number {
		return this.chips.get(playerId) ?? 0;
	}

	public adjustChips(playerId: PlayerId, chipsAmount: number): void {
		this.chips.set(playerId, chipsAmount);

		this.historyManager.SendAndSaveToHistory('CHIPS_CHANGED', playerId, chipsAmount);
	}
}
