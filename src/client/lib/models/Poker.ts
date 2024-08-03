import type { FragenPhase } from '@poker-lib/message/ServerMessage';
import type { Frage } from './Frage';

export interface GameState {
	currentPhase: FragenPhase;
	currentFrage?: Frage;
}
