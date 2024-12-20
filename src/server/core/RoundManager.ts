import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type PlayerManager from './PlayerManager.ts';
import type { Frage } from '@server/entities/Frage.ts';
import type { HistoryManager } from './HistoryManager.ts';
import { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { BasicManager } from './BasicManager.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppSocket } from './App.ts';

export class RoundManager implements BasicManager {
	private readonly playerManager: PlayerManager;
	private readonly eventBus: QuizPokerEventBus;
	private readonly historyManager: HistoryManager;

	private frage: Frage | null = null;
	private currentPhase: FragenPhase | null = null;
	private changeAutomaticPhase: boolean = true;

	public constructor(
		historyManager: HistoryManager,
		eventBus: QuizPokerEventBus,
		playerManger: PlayerManager
	) {
		this.historyManager = historyManager;
		this.eventBus = eventBus;
		this.playerManager = playerManger;

		this.eventBus.registerToEvent({
			event: 'TRIGGER-NEXT-PHASE',
			listener: () => this.triggerNextPhase()
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		socket
			.on('PLAY_QUESTION', (question, hinweis_1, hinweis_2, answer, einheit) =>
				this.constructNewQuestion(question, hinweis_1, hinweis_2, answer, einheit)
			)
			.on('CHANGE_PHASE', (phase) => this.changePhase(phase))
			.on(
				'CHANGE_AUTOMATIC_PHASE_CHANGING',
				(activated) => (this.changeAutomaticPhase = activated)
			);
	}

	private constructNewQuestion(
		question: string,
		hinweis_1: string,
		hinweis_2: string,
		answer: string,
		einheit?: string
	): void {
		const frage: Frage = {
			frage: question,
			hinweis1: hinweis_1,
			hinweis2: hinweis_2,
			einheit: einheit,
			antwort: answer
		};

		this.playNewQuestion(frage);
	}

	private changePhase(phase: FragenPhase): void {
		let value: string | undefined = undefined;
		switch (phase) {
			case FragenPhase.FRAGE:
				value = this.frage!.frage;
				break;
			case FragenPhase.RUNDE_1:
				value = this.frage!.hinweis1;
				break;
			case FragenPhase.RUNDE_2:
				value = this.frage!.hinweis2;
				break;
			case FragenPhase.ANTWORT:
				value = this.frage!.antwort;
				break;
			default:
				throw new Error('No Phase found');
		}

		this.currentPhase = phase;

		this.historyManager.SendAndSaveToHistory('DISPLAY_NEXT_PHASE', phase, value);

		this.eventBus.dispatch({
			event: {
				type: 'PHASE-TRIGGERED',
				payload: phase
			}
		});
	}

	private playNewQuestion(frage: Frage): void {
		this.frage = frage;
		this.currentPhase = FragenPhase.FRAGE;

		this.historyManager.SendAndSaveToHistory('DISPLAY_NEXT_QUESTION', frage.frage, frage.einheit);

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

		this.historyManager.SendAndSaveToHistory('DISPLAY_NEXT_PHASE', nextPhase, value);

		this.eventBus.dispatch({
			event: {
				type: 'PHASE-TRIGGERED',
				payload: nextPhase
			}
		});
	}
}
