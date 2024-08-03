import type { SidePot, SidePotPlayer, SidePotWinnerResult } from '@server/entities/Bet.ts';

export abstract class SidePotHelper {
	public static calculateSidePots(players: SidePotPlayer[]): SidePot[] {
		// Sort players by their bets (ascending)
		players.sort((playerA, playerB) => playerA.bet - playerB.bet);

		const sidePots: SidePot[] = [];
		let currentBet = 0;

		for (let i = 0; i < players.length; i++) {
			const player = players[i];
			const betDifference = player.bet - currentBet;

			// Get all players who share this bet amount (from current player onwards)
			const participatingPlayers = players.slice(i).map((p) => p.playerId);

			if (betDifference > 0) {
				const sidePotAmount = betDifference * participatingPlayers.length;
				sidePots.push({ totalAmount: sidePotAmount, players: participatingPlayers });
				currentBet = player.bet;
			}
		}

		return sidePots;
	}

	public static distributeChips(
		sidePots: SidePot[],
		winningPlayerIds: string[]
	): SidePotWinnerResult[] {
		const results: { [playerId: string]: number } = {};

		for (const sidePot of sidePots) {
			// Filter winning players for this specific side pot
			const potWinners = winningPlayerIds.filter((playerId) => sidePot.players.includes(playerId));

			if (potWinners.length > 0) {
				const chipsPerWinner = sidePot.totalAmount / potWinners.length;

				for (const winner of potWinners) {
					results[winner] = (results[winner] || 0) + chipsPerWinner;
				}
			} else {
				// Handle side pots with no winners (distribute among all winners)
				const chipsPerWinner = sidePot.totalAmount / winningPlayerIds.length;
				for (const winner of winningPlayerIds) {
					results[winner] = (results[winner] || 0) + chipsPerWinner;
				}
			}
		}

		return Object.entries(results).map(([playerId, chipsWon]) => ({
			playerId,
			chipsWon
		}));
	}
}
