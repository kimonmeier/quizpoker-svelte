import type { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { Frage } from './Frage.ts';

export interface GameState {
	currentPhase: FragenPhase;
	currentFrage?: Frage;
}
