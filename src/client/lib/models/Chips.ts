import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export interface ChipsModel {
	playerId: PlayerId;
	chips: number;
	bet?: number;
}
