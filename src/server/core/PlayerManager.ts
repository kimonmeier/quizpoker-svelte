import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import StringHelper from '@poker-lib/utils/StringUtils.ts';
import type { Player } from '@server/entities/Player.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type { HistoryManager } from './HistoryManager.ts';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { BasicManager } from './BasicManager.ts';
import type { AppSocket } from './App.ts';

export default class PlayerManager implements BasicManager {
	private readonly historyManager: HistoryManager;
	private readonly eventBus: QuizPokerEventBus;

	private players: Map<PlayerId, Player> = new Map();
	private rooms: Map<GameCode, PlayerId[]> = new Map();
	private chips: Map<string, number> = new Map();

	public constructor(historyManager: HistoryManager, eventBus: QuizPokerEventBus) {
		this.historyManager = historyManager;
		this.eventBus = eventBus;

		this.eventBus.registerToEvent({
			event: 'NEXT-QUESTION',
			listener: (data) => {
				const roomCode = data.payload.Room;
				const foldedPlayers = this.getPlayersByRoom(roomCode);

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
						roomCode,
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
			.on('PLAYER_CONNECTING', (name, link, room, callback) =>
				callback(this.connectPlayer(socket, uuid, room, name, link))
			)
			.on('PUBLIC_CONNECTING', (roomCode) => {
				this.rooms.set(roomCode, [...(this.rooms.get(roomCode) ?? []), uuid]);
				socket.join(roomCode);
				this.historyManager.PublishHistory(socket, roomCode);
			})
			.on('FOLD', () => this.fold(uuid))
			.on('UPDATE_PLAYER_CHIPS', (roomCode, playerId, chips) =>
				this.adjustChips(roomCode, playerId, chips)
			)
			.on('GAME_MASTER_CONNECTING', (link, callback) => {
				const roomCode = StringHelper.generateRandomString(12) as GameCode;

				this.rooms.set(roomCode, [...(this.rooms.get(roomCode) ?? []), uuid]);
				this.historyManager.SendAndSaveToHistory(roomCode, 'GAMEMASTER_LOGIN', link);

				socket.join(roomCode);
				socket.join('game-master-' + roomCode);

				callback(uuid, roomCode);
			});
	}

	private connectPlayer(
		socket: AppSocket,
		playerId: PlayerId,
		roomCode: GameCode,
		name: string,
		link: string
	): PlayerId {
		this.players.set(playerId, {
			playerId: playerId,
			name: name,
			link: link,
			roomCode: roomCode,
			status: MemberStatus.ON
		});

		socket.join(roomCode);

		this.rooms.set(roomCode, [...(this.rooms.get(roomCode) ?? []), playerId]);

		this.historyManager.PublishHistory(socket, roomCode);

		this.chips.set(playerId, 10_000);
		this.historyManager.SendAndSaveToHistory(roomCode, 'PLAYER_JOINED', playerId, name, link);

		console.log('Player connected', playerId, roomCode, name);

		return playerId;
	}

	private disconnectPlayer(playerId: PlayerId): void {
		var gameRoomCode: GameCode;
		this.rooms.forEach((playerIds, roomCode) => {
			if (playerIds.includes(playerId)) {
				this.rooms.set(
					roomCode,
					playerIds.filter((id) => id !== playerId)
				);
				gameRoomCode = roomCode;
			}
		});

		this.chips.delete(playerId);

		this.players.delete(playerId);

		this.historyManager.SendAndSaveToHistory(gameRoomCode!, 'PLAYER_LEFT', playerId);
	}

	private fold(playerId: PlayerId): void {
		const player = this.getPlayerByUuid(playerId);
		player.status = MemberStatus.FOLDED;
		this.players.set(playerId, player);

		this.historyManager.SendAndSaveToHistory(
			player.roomCode,
			'STATUS_CHANGED',
			playerId,
			MemberStatus.FOLDED
		);
	}

	public getPlayerByUuid(uuid: PlayerId): Player {
		return this.players.get(uuid)!;
	}

	public getPlayers(): Player[] {
		return Array.from(this.players.values());
	}

	public getPlayersByRoom(roomCode: GameCode): Player[] {
		const playerIds = this.rooms.get(roomCode) ?? [];
		return playerIds.map((playerId) => this.players.get(playerId)!).filter((x) => x != null);
	}

	public getPlayingPlayers(roomCode: GameCode): Player[] {
		return Array.from(this.getPlayersByRoom(roomCode))
			.filter((x) => x.status == MemberStatus.ON)
			.sort(this.comparePlayerFn);
	}

	public getRoomCodeByPlayerId(playerId: PlayerId): GameCode {
		for (const [roomCode, playerIds] of this.rooms.entries()) {
			if (playerIds.includes(playerId)) {
				return roomCode;
			}
		}
		console.error('Player not found in any room, room "NO_ROOM" returned');
		return 'NO_ROOM' as GameCode;
	}

	public resetFoldedPlayer(): void {}

	private comparePlayerFn(player1: Player, player2: Player): number {
		return StringHelper.hashCode(player1.playerId) - StringHelper.hashCode(player2.playerId);
	}

	public getChips(playerId: string): number {
		return this.chips.get(playerId) ?? 0;
	}

	public adjustChips(roomCode: GameCode, playerId: PlayerId, chipsAmount: number): void {
		this.chips.set(playerId, chipsAmount);

		this.historyManager.SendAndSaveToHistory(roomCode, 'CHIPS_CHANGED', playerId, chipsAmount);
	}
}
