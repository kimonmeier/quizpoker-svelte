import { writable, type Readable } from 'svelte/store';
import type { ChipsModel } from '../models/Chips';
import type { GameState } from '../models/Poker';
import { FragenPhase } from '@poker-lib/message/ServerMessage';

interface ChipsStore extends Readable<ChipsModel[]> {
	setChips: (playerId: string, chips: number) => void;
	setBet: (playerId: string, bet: number) => void;
	addPlayer: (playerId: string) => void;
	removePlayer: (playerId: string) => void;
}

function createChipsStore(): ChipsStore {
	const { update, subscribe } = writable<ChipsModel[]>([]);

	return {
		subscribe,
		setChips: (playerId: string, chips: number) => {
			update((x) => {
				const playerEntry = x.find((z) => z.playerId == playerId);

				if (!playerEntry) {
					return x;
				}

				playerEntry.chips = chips;

				return x;
			});
		},
		setBet: (playerId: string, bet?: number) => {
			update((x) => {
				const playerEntry = x.find((z) => z.playerId == playerId);

				if (!playerEntry) {
					return x;
				}

				playerEntry.bet = bet;

				return x;
			});
		},
		addPlayer: (playerId: string) => {
			update((x) => {
				x.push({ playerId, chips: 10_000 });
				return x;
			});
		},
		removePlayer: (playerId: string) => {
			update((x) => x.filter((z) => z.playerId != playerId));
		}
	};
}

export const chipStore = createChipsStore();

export const gameStarted = writable<boolean>(false);
export const gameStateStore = writable<GameState>({
	currentPhase: FragenPhase.PAUSE
});
export const gamePot = writable<number>(0);
