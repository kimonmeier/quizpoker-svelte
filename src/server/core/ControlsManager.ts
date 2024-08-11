import type WebSocketConnection from '@server/connection/WebSocketConnection.ts';
import type PlayerManager from './PlayerManager.ts';
import type WebSocketClient from '@server/connection/WebSocketClient.ts';
import {
	GameMasterAction,
	MemberAction,
	type ClientMessage
} from '@poker-lib/message/ClientMessage.ts';
import { ClientEvents } from '@poker-lib/enums/ClientEvents.ts';
import { ServerEvents } from '@poker-lib/enums/ServerEvents.ts';
import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type BetManager from './BetManager.ts';
import type { BlindManager } from './BlindManager.ts';
import { FragenPhase } from '@poker-lib/message/ServerMessage.ts';

export class ControlsManager {
	private readonly connection: WebSocketConnection;
	private readonly playerManager: PlayerManager;
	private readonly betManager: BetManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly blindManager: BlindManager;

	private currentPlayerInControl: string | null = null;
	private players: Map<string, number> = new Map();
	private lastPlayerToBet: string | null = null;
	private bigBlindId: string | null = null;

	public constructor(
		connection: WebSocketConnection,
		eventBus: QuizPokerEventBus,
		betManager: BetManager,
		playerManager: PlayerManager,
		blindManager: BlindManager
	) {
		this.connection = connection;
		this.eventBus = eventBus;
		this.betManager = betManager;
		this.playerManager = playerManager;
		this.blindManager = blindManager;

		this.eventBus.registerToEvent({
			event: 'BIG-BLIND-SET',
			listener: (event) => {
				this.bigBlindId = event.payload;

				this.takePlayerControls();

				this.lastPlayerToBet = this.bigBlindId;
			}
		});

		this.eventBus.registerToEvent({
			event: 'PHASE-TRIGGERED',
			listener: (event) => {
				if (event.payload == FragenPhase.FRAGE) {
					return;
				}

				if (event.payload == FragenPhase.PAUSE) {
					return;
				}

				const nextPlayerId = this.findNextPlayerId(this.lastPlayerToBet ?? this.bigBlindId!);

				if (!nextPlayerId) {
					return;
				}

				this.givePlayerControls(nextPlayerId, this.lastPlayerToBet);
			}
		});
	}

	public handleInputs(client: WebSocketClient, m: ClientMessage): void {
		switch (m.type) {
			case ClientEvents.MEMBER_LOGIN:
				this.players.set(client.uuid, 0);
				break;
			case ClientEvents.MEMBER_LEAVT:
				this.players.delete(client.uuid);
				break;
			case ClientEvents.GAME_MASTER_ACTION:
				switch (m.action) {
					case GameMasterAction.CONTROLS_SELECTED:
						console.log('Controls SELECTED');
						const lastPlayerId = this.currentPlayerInControl;
						this.takePlayerControls();
						if (lastPlayerId != m.member_id) {
							this.givePlayerControls(m.member_id, lastPlayerId);
						}
						break;
					case GameMasterAction.CHANGE_PHASE:
						this.takePlayerControls();

						if (m.phase == FragenPhase.PAUSE) {
							break;
						}

						if (this.playerManager.getPlayingPlayers().length == 1) {
							break;
						}

						this.givePlayerControls(this.getPlayerAfterBigBlind(), this.bigBlindId);
				}
				break;
			case ClientEvents.MITGLIED_ACTION:
				this.moveControlsForward();

				if (m.action == MemberAction.RAISE) {
					this.lastPlayerToBet = client.uuid;
				}
				break;
		}
	}

	private givePlayerControls(playerId: string, lastPlayerId: string | null): void {
		this.currentPlayerInControl = playerId;
		this.players.set(playerId, Date.now());

		this.connection.broadcast({
			type: ServerEvents.GIVE_PLAYER_CONTROLS,
			member_id: playerId,
			minimumBet: this.betManager.getBetValues(lastPlayerId ?? this.blindManager.getBigBlind()) + 50
		});
	}

	private takePlayerControls(): void {
		if (this.currentPlayerInControl == null) {
			return;
		}

		this.connection.broadcast({
			type: ServerEvents.TAKE_PLAYER_CONTROLS,
			member_id: this.currentPlayerInControl
		});

		this.currentPlayerInControl = null;
	}

	private moveControlsForward(): void {
		let moveControlsForward = true;
		if (this.lastPlayerToBet && this.lastPlayerToBet == this.currentPlayerInControl) {
			moveControlsForward = false;
		}

		const lastPlayerId = this.currentPlayerInControl;
		this.takePlayerControls();

		if (!moveControlsForward) {
			this.eventBus.dispatch({
				event: {
					type: 'TRIGGER-NEXT-PHASE',
					payload: undefined
				}
			});
			return;
		}

		if (this.playerManager.getPlayingPlayers().length == 1) {
			return;
		}

		const nextPlayerId = this.findNextPlayerId(lastPlayerId ?? this.bigBlindId!);

		if (!nextPlayerId) {
			return;
		}

		this.givePlayerControls(nextPlayerId, this.lastPlayerToBet);
	}

	private getPlayerAfterBigBlind(): string {
		const playingPlayers = this.playerManager.getPlayingPlayers();
		let index = playingPlayers.findIndex((x) => x.client.uuid == this.bigBlindId) + 1;

		if (!playingPlayers.at(index)) {
			index = 0;
		}

		return playingPlayers.at(index)!.client.uuid;
	}

	private findNextPlayerId(startId: string): string | undefined {
		const playingPlayers = this.playerManager.getPlayingPlayers();

		let count = 0;
		let playerId: string | undefined | null = startId;
		do {
			let indexLastPlayer = playingPlayers.findIndex((x) => x.client.uuid == playerId) + 1;
			if (indexLastPlayer >= playingPlayers.length) {
				indexLastPlayer = 0;
			}

			playerId = playingPlayers.at(indexLastPlayer)?.client.uuid;

			if (!playerId) {
				console.log('Something went wrong, no player found');
				return undefined;
			}

			count++;

			if (count >= 30) {
				return undefined;
			}
		} while (this.betManager.getBetValues(playerId) === this.playerManager.getChips(playerId));

		return playerId;
	}
}
