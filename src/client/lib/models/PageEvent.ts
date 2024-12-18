import type { PlayerId } from '@poker-lib/message/OpaqueTypes';

export interface PageEvent {
	playerId: PlayerId;
	date: number;
	onPage: boolean;
}
