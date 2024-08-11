import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type PlayerManager from './PlayerManager.ts';
import type WebSocketConnection from '@server/connection/WebSocketConnection.ts';
import { GameMasterAction, type ClientMessage } from '@poker-lib/message/ClientMessage.ts';
import type WebSocketClient from '@server/connection/WebSocketClient.ts';
import type { Frage } from '@server/entities/Frage.ts';
import { ClientEvents } from '@poker-lib/enums/ClientEvents.ts';
import { ServerEvents } from '@poker-lib/enums/ServerEvents.ts';
import { FragenPhase } from '@poker-lib/message/ServerMessage.ts';
import { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';

export class RoundManager {
	private readonly playerManager: PlayerManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly connection: WebSocketConnection;

	private frage: Frage | null = null;
	private currentPhase: FragenPhase | null = null;
	private changeAutomaticPhase: boolean = true;

	public constructor(
		connection: WebSocketConnection,
		eventBus: QuizPokerEventBus,
		playerManger: PlayerManager
	) {
		this.connection = connection;
		this.eventBus = eventBus;
		this.playerManager = playerManger;

		this.eventBus.registerToEvent({
			event: 'TRIGGER-NEXT-PHASE',
			listener: () => this.triggerNextPhase()
		});
	}

	public handleInputs(client: WebSocketClient, m: ClientMessage): void {
		if (m.type == ClientEvents.GAME_MASTER_ACTION) {
			switch (m.action) {
				case GameMasterAction.PLAY_QUESTION:
					const frage: Frage = {
						frage: m.question,
						hinweis1: m.hinweis_1,
						hinweis2: m.hinweis_2,
						einheit: m.einheit,
						antwort: m.answer
					};

					this.playNewQuestion(frage);
					break;
				case GameMasterAction.CHANGE_PHASE:
					this.currentPhase = m.phase;

					this.connection.broadcast({
						type: ServerEvents.NAECHSTE_PHASE,
						phase: m.phase,
						value: this.getTextByPhase(m.phase)
					});

					this.eventBus.dispatch({
						event: {
							type: 'PHASE-TRIGGERED',
							payload: m.phase
						}
					});
					break;
				case GameMasterAction.CHANGE_AUTOMATIC_PHASE_CHANGING:
					this.changeAutomaticPhase = m.activated;
					break;
			}
		}
	}

	private playNewQuestion(frage: Frage): void {
		this.frage = frage;
		this.currentPhase = FragenPhase.FRAGE;

		this.connection.broadcast({
			type: ServerEvents.NAECHSTE_FRAGE,
			einheit: frage.einheit,
			frage: frage.frage,
			phase: FragenPhase.FRAGE
		});

		this.eventBus.dispatch({
			event: {
				type: 'PHASE-TRIGGERED',
				payload: FragenPhase.FRAGE
			}
		});

		this.eventBus.dispatch({
			event: {
				type: 'NEXT-QUESTION',
				payload: frage.frage
			}
		});
	}

	private triggerNextPhase(): void {
		if (!this.changeAutomaticPhase) {
			console.log('Automatisches verändern wurde deaktiviert!');
			return;
		}

		let nextPhase: FragenPhase;
		let value: string | undefined = undefined;

		if (!this.currentPhase || !this.frage) {
			console.log('Nächste Phase wurde requested ohne aktuelle Frage');
			return;
		}

		switch (this.currentPhase) {
			case FragenPhase.FRAGE:
				nextPhase = FragenPhase.RUNDE_1;
				value = this.frage.hinweis1;
				break;
			case FragenPhase.RUNDE_1:
				nextPhase = FragenPhase.RUNDE_2;
				value = this.frage.hinweis2;
				break;
			case FragenPhase.RUNDE_2:
				nextPhase = FragenPhase.ANTWORT;
				value = this.frage.antwort;
				break;
			default:
				throw new Error('No Phase found');
		}

		this.currentPhase = nextPhase;

		this.connection.broadcast({
			type: ServerEvents.NAECHSTE_PHASE,
			phase: nextPhase,
			value
		});

		this.eventBus.dispatch({
			event: {
				type: 'PHASE-TRIGGERED',
				payload: nextPhase
			}
		});
	}

	private getTextByPhase(fragenPhase: FragenPhase): string | undefined {
		if (!this.frage) {
			return undefined;
		}

		switch (fragenPhase) {
			case FragenPhase.FRAGE:
				return this.frage.frage;
			case FragenPhase.RUNDE_1:
				return this.frage.hinweis1;
			case FragenPhase.RUNDE_2:
				return this.frage.hinweis2;
			case FragenPhase.ANTWORT:
				return this.frage.antwort;
			default:
				return undefined;
		}
	}
}
