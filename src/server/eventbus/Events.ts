import type { EventBus } from '@danielemariani/ts-event-bus';
import type { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export type EventDeclaration = {
	'PHASE-TRIGGERED': FragenPhase;
	'NEXT-QUESTION': string;
	'PLAYER-WON-ROUND': PlayerId[];
	'TRIGGER-NEXT-PHASE': undefined;
	'BIG-BLIND-SET': PlayerId;
};

export type QuizPokerEventBus = EventBus<EventDeclaration>;
