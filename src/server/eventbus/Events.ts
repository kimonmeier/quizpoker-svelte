import type { EventBus } from '@danielemariani/ts-event-bus';
import type { FragenPhase } from '@poker-lib/message/ServerMessage.ts';

export type EventDeclaration = {
	'PHASE-TRIGGERED': FragenPhase;
	'NEXT-QUESTION': string;
	'PLAYER-WON-ROUND': string[];
	'TRIGGER-NEXT-PHASE': undefined;
	'BIG-BLIND-SET': string;
};

export type QuizPokerEventBus = EventBus<EventDeclaration>;
