import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export interface Bet {
	player_id: PlayerId;
	bet: number;
}

export interface SidePot {
	totalAmount: number;
	players: PlayerId[];
}

export interface SidePotPlayer {
	playerId: PlayerId;
	bet: number;
	chips: number;
}

export interface SidePotWinnerResult {
	playerId: PlayerId;
	chipsWon: number;
}
