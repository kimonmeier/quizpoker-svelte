import type WebSocketConnection from '@server/connection/WebSocketConnection.ts';
import type { Bet, SidePot } from '../entities/Bet.ts';
import type PlayerManager from './PlayerManager.ts';
import { ServerEvents } from '@poker-lib/enums/ServerEvents.ts';
import type WebSocketClient from '@server/connection/WebSocketClient.ts';
import {
	GameMasterAction,
	MemberAction,
	type ClientMessage
} from '@poker-lib/message/ClientMessage.ts';
import { ClientEvents } from '@poker-lib/enums/ClientEvents.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import { SidePotHelper } from '@server/utils/SidePotHelper.ts';
import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import { ArrayUtils } from '@poker-lib/utils/ArrayUtils.ts';

export default class BetManager {
	private readonly playerManger: PlayerManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly connection: WebSocketConnection;

	private bets: Bet[] = [];
	private lastPlayer: string | null = null;

	public constructor(
		connection: WebSocketConnection,
		eventBus: QuizPokerEventBus,
		playerManager: PlayerManager
	) {
		this.connection = connection;
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

	public handleInputs(client: WebSocketClient, m: ClientMessage): void {
		switch (m.type) {
			case ClientEvents.GAME_MASTER_ACTION:
				if (m.action != GameMasterAction.UPDATE_MEMBER) {
					break;
				}

				if (m.einsatz == null) {
					break;
				}

				console.log('Einsatz ', m.einsatz);
				console.log('Bet Values ', this.getBetValues(m.memberId));
				console.log('Value ', m.einsatz - this.getBetValues(m.memberId));

				this.addBet({ player_id: m.memberId, bet: m.einsatz - this.getBetValues(m.memberId) });
				break;
			case ClientEvents.MITGLIED_ACTION:
				if (m.action == MemberAction.CHECK || m.action == MemberAction.FOLD) {
					this.connection.broadcast({
						type: ServerEvents.SHOW_TOAST,
						playerId: client.uuid,
						action: m.action
					});
					break;
				}

				const betValues = this.getBetValues(client.uuid);

				if (m.action == MemberAction.RAISE) {
					this.addBet({ player_id: client.uuid, bet: m.valueTo - betValues });

					this.connection.broadcast({
						type: ServerEvents.SHOW_TOAST,
						playerId: client.uuid,
						action: m.action,
						value: m.valueTo - betValues
					});
				} else {
					const lastPlayerbet = this.getBetValues(this.lastPlayer!);

					this.addBet({
						player_id: client.uuid,
						bet: lastPlayerbet - betValues
					});

					this.connection.broadcast({
						type: ServerEvents.SHOW_TOAST,
						playerId: client.uuid,
						action: m.action,
						value: lastPlayerbet - betValues
					});
				}

				this.lastPlayer = client.uuid;

				break;
		}
	}

	public getBetValues(userId: string): number {
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

		this.connection.broadcast({
			type: ServerEvents.UPDATED_MITGLIED_VALUES,
			id: bet.player_id,
			einsatz: this.getBetValues(bet.player_id)
		});

		this.connection.broadcast({
			type: ServerEvents.UPDATED_GAME_VALUES,
			pot: this.getPot()
		});
	}

	private clearBetFromPlayer(id: string): void {
		this.bets = this.bets.filter((x) => x.player_id != id);

		this.connection.broadcast({
			type: ServerEvents.UPDATED_MITGLIED_VALUES,
			id,
			einsatz: 0
		});

		this.connection.broadcast({
			type: ServerEvents.UPDATED_GAME_VALUES,
			pot: this.getPot()
		});
	}

	private getPot(): number {
		var pot = 0;

		this.bets.forEach((element) => {
			pot += element.bet;
		});

		return pot;
	}

	private anounceWinner(...wonPlayers: string[]): void {
		if (wonPlayers.length == 1) {
			this.playerManger.adjustChips(wonPlayers.at(0)!, this.getPot());
			this.flushChips();
			return;
		}

		const players = this.playerManger
			.getPlayers()
			.filter((x) => x.status !== MemberStatus.PLEITE)
			.map((player) => ({
				playerId: player.client.uuid,
				bet: this.getBetValues(player.client.uuid),
				chips: this.playerManger.getChips(player.client.uuid)
			}));

		const sidePots: SidePot[] = SidePotHelper.calculateSidePots(players);
		const result = SidePotHelper.distributeChips(sidePots, wonPlayers);

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
			const playerId = player.client.uuid;

			this.playerManger.adjustChips(
				playerId,
				this.playerManger.getChips(playerId) - this.getBetValues(playerId)
			);
			this.clearBetFromPlayer(playerId);
		});
	}
}
