import { ClientEvents } from '@poker-lib/enums/ClientEvents.ts';
import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import { ServerEvents } from '@poker-lib/enums/ServerEvents.ts';
import {
	GameMasterAction,
	MemberAction,
	type ClientMessage
} from '@poker-lib/message/ClientMessage.ts';
import StringHelper from '@poker-lib/utils/StringUtils.ts';
import type WebSocketClient from '@server/connection/WebSocketClient.ts';
import type WebSocketConnection from '@server/connection/WebSocketConnection.ts';
import type { Player } from '@server/entities/Player.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';

export default class PlayerManager {
	private readonly connection: WebSocketConnection;
	private readonly eventBus: QuizPokerEventBus;

	private players: Map<WebSocketClient, Player> = new Map();
	private chips: Map<string, number> = new Map();

	public constructor(connection: WebSocketConnection, eventBus: QuizPokerEventBus) {
		this.connection = connection;
		this.eventBus = eventBus;

		this.eventBus.registerToEvent({
			event: 'NEXT-QUESTION',
			listener: () => {
				const foldedPlayers = this.getPlayers().filter((x) => x.status == MemberStatus.FOLDED);

				foldedPlayers.forEach((player) => {
					const chips = this.getChips(player.client.uuid);
					if (chips == 0) {
						player.status = MemberStatus.PLEITE;
					} else {
						player.status = MemberStatus.ON;
					}
					this.connection.broadcast({
						type: ServerEvents.UPDATED_MITGLIED_VALUES,
						id: player.client.uuid,
						status: player.status
					});
				});
			}
		});
	}

	public handleInputs(client: WebSocketClient, m: ClientMessage): void {
		switch (m.type) {
			case ClientEvents.MEMBER_LOGIN:
				this.players.set(client, {
					client,
					name: m.name,
					link: m.link,
					status: MemberStatus.ON
				});

				this.chips.set(client.uuid, 10_000);

				this.connection.broadcast({
					type: ServerEvents.NEW_MITGLIED,
					id: client.uuid,
					name: m.name,
					link: m.link
				});

				client.send({
					type: ServerEvents.MITGLIED_SUCCESSFULL_LOGIN,
					id: client.uuid
				});
				break;
			case ClientEvents.MEMBER_LEAVT:
				this.chips.delete(client.uuid);

				this.players.delete(client);

				this.connection.broadcast({
					type: ServerEvents.REMOVED_MITGLIED,
					id: client.uuid
				});
				break;
			case ClientEvents.MITGLIED_ACTION:
				if (m.action != MemberAction.FOLD) {
					break;
				}
				const player = this.getPlayerByUuid(client.uuid);
				player.status = MemberStatus.FOLDED;
				this.players.set(client, player);

				this.connection.broadcast({
					type: ServerEvents.UPDATED_MITGLIED_VALUES,
					id: client.uuid,
					status: MemberStatus.FOLDED
				});
				break;

			case ClientEvents.GAME_MASTER_ACTION:
				if (m.action != GameMasterAction.UPDATE_MEMBER) {
					break;
				}

				if (m.chips == null) {
					break;
				}

				this.adjustChips(m.memberId, m.chips);
				break;

			case ClientEvents.GAMEMASTER_LOGIN:
				this.connection.broadcast({
					type: ServerEvents.GAMEMASTER_LOGIN,
					link: m.link
				});

				client.send({
					type: ServerEvents.MITGLIED_SUCCESSFULL_LOGIN,
					id: client.uuid
				});
				break;
		}
	}

	public getPlayerByUuid(uuid: string): Player {
		return this.players.get(
			this.connection.clients.find((x) => x.uuid == uuid) as WebSocketClient
		)!;
	}

	public getPlayers(): Player[] {
		return Array.from(this.players.values());
	}

	public getPlayingPlayers(): Player[] {
		return Array.from(this.players.values())
			.filter((x) => x.status == MemberStatus.ON)
			.sort(this.comparePlayerFn);
	}

	private comparePlayerFn(player1: Player, player2: Player): number {
		return StringHelper.hashCode(player1.client.uuid) - StringHelper.hashCode(player2.client.uuid);
	}

	public getChips(playerId: string): number {
		return this.chips.get(playerId) ?? 0;
	}

	public adjustChips(playerId: string, chipsAmount: number): void {
		this.chips.set(playerId, chipsAmount);

		this.connection.broadcast({
			type: ServerEvents.UPDATED_MITGLIED_VALUES,
			id: playerId,
			chips: chipsAmount
		});
	}
}
