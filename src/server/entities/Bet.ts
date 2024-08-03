export interface Bet {
	player_id: string;
	bet: number;
}

export interface SidePot {
	totalAmount: number;
	players: string[];
}

export interface SidePotPlayer {
	playerId: string;
	bet: number;
	chips: number;
}

export interface SidePotWinnerResult {
	playerId: string;
	chipsWon: number;
}
