import type { QuizPokerEventBus } from '@server/eventbus/Events.ts';
import type PlayerManager from './PlayerManager.ts';
import type { Frage } from '@server/entities/Frage.ts';
import type { HistoryManager } from './HistoryManager.ts';
import { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { BasicManager } from './BasicManager.ts';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppSocket } from './App.ts';

export class RoundManager implements BasicManager {
	private readonly eventBus: QuizPokerEventBus;
	private readonly historyManager: HistoryManager;

	private frage: Map<GameCode, Frage | null> = new Map();
	private currentPhase: Map<GameCode, FragenPhase | null> = new Map();
	private changeAutomaticPhase: Map<GameCode, boolean> = new Map();

	public constructor(historyManager: HistoryManager, eventBus: QuizPokerEventBus) {
		this.historyManager = historyManager;
		this.eventBus = eventBus;

		this.eventBus.registerToEvent({
			event: 'TRIGGER-NEXT-PHASE',
			listener: (data) => this.triggerNextPhase(data.payload)
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public registerSocket(socket: AppSocket, uuid: PlayerId): void {
		socket
			.on('PLAY_QUESTION', (roomCode, _, __, question, hinweis_1, hinweis_2, answer, einheit) =>
				this.constructNewQuestion(roomCode, question, hinweis_1, hinweis_2, answer, einheit)
			)
			.on('CHANGE_PHASE', (roomCode, phase) => this.changePhase(roomCode, phase))
			.on('CHANGE_AUTOMATIC_PHASE_CHANGING', (roomCode, activated) =>
				this.changeAutomaticPhase.set(roomCode, activated)
			);
	}

	private constructNewQuestion(
		roomCode: GameCode,
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

		this.playNewQuestion(roomCode, frage);
	}

	private changePhase(roomCode: GameCode, phase: FragenPhase): void {
		var currentFrage = this.frage.get(roomCode);

		if (currentFrage == null) {
			throw new Error('No Frage found for this room');
		}

		let value: string | null = null;
		switch (phase) {
			case FragenPhase.FRAGE:
				value = currentFrage.frage;
				break;
			case FragenPhase.RUNDE_1:
				value = currentFrage.hinweis1;
				break;
			case FragenPhase.RUNDE_2:
				value = currentFrage.hinweis2;
				break;
			case FragenPhase.ANTWORT:
				value = currentFrage.antwort;
				break;
			case FragenPhase.PAUSE:
				console.log('Pause was selected');
				value = null;
				break;
			default:
				throw new Error('No Phase found');
		}

		this.currentPhase.set(roomCode, phase);

		this.historyManager.SendAndSaveToHistory(roomCode, 'DISPLAY_NEXT_PHASE', phase, value);

		this.eventBus.dispatch({
			event: {
				type: 'PHASE-TRIGGERED',
				payload: {
					Phase: phase,
					Room: roomCode
				}
			}
		});
	}

	private playNewQuestion(roomCode: GameCode, frage: Frage): void {
		this.frage.set(roomCode, frage);
		this.currentPhase.set(roomCode, FragenPhase.FRAGE);

		this.historyManager.SendAndSaveToHistory(
			roomCode,
			'DISPLAY_NEXT_QUESTION',
			frage.frage,
			frage.einheit
		);

		this.eventBus.dispatch({
			event: {
				type: 'PHASE-TRIGGERED',
				payload: {
					Phase: FragenPhase.FRAGE,
					Room: roomCode
				}
			}
		});

		this.eventBus.dispatch({
			event: {
				type: 'NEXT-QUESTION',
				payload: {
					Question: frage.frage,
					Room: roomCode
				}
			}
		});
	}

	private triggerNextPhase(roomCode: GameCode): void {
		if (!(this.changeAutomaticPhase.get(roomCode) ?? false)) {
			console.log('Automatisches verändern wurde deaktiviert!');
			return;
		}

		let currentFrage = this.frage.get(roomCode);
		let currentPhase = this.currentPhase.get(roomCode);

		let nextPhase: FragenPhase;
		let value: string | undefined = undefined;

		if (!currentPhase || !currentFrage) {
			console.log('Nächste Phase wurde requested ohne aktuelle Frage');
			return;
		}

		switch (currentPhase) {
			case FragenPhase.FRAGE:
				nextPhase = FragenPhase.RUNDE_1;
				value = currentFrage.hinweis1;
				break;
			case FragenPhase.RUNDE_1:
				nextPhase = FragenPhase.RUNDE_2;
				value = currentFrage.hinweis2;
				break;
			case FragenPhase.RUNDE_2:
				nextPhase = FragenPhase.ANTWORT;
				value = currentFrage.antwort;
				break;
			default:
				throw new Error('No Phase found');
		}

		this.currentPhase.set(roomCode, nextPhase);

		this.historyManager.SendAndSaveToHistory(roomCode, 'DISPLAY_NEXT_PHASE', nextPhase, value);

		this.eventBus.dispatch({
			event: {
				type: 'PHASE-TRIGGERED',
				payload: {
					Phase: nextPhase,
					Room: roomCode
				}
			}
		});
	}
}
