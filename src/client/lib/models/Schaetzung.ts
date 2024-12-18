import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export interface Schaetzung {
	playerId: PlayerId;
	schaetzung?: number;
}
