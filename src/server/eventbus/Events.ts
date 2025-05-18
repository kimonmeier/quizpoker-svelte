import type { EventBus } from '@danielemariani/ts-event-bus';
import type { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppSocket } from '@server/core/App';

export type EventDeclaration = {
	'PHASE-TRIGGERED': { Phase: FragenPhase; Room: GameCode };
	'GAME-MASTER-CONNECTING': { Room: GameCode; PlayerId: PlayerId; Socket: AppSocket };
	'NEXT-QUESTION': { Question: string; Room: GameCode };
	'PLAYER-WON-ROUND': { Players: PlayerId[]; Room: GameCode };
	'TRIGGER-NEXT-PHASE': GameCode;
	'BIG-BLIND-SET': { BigBlind: PlayerId; Room: GameCode };
};

export type QuizPokerEventBus = EventBus<EventDeclaration>;
