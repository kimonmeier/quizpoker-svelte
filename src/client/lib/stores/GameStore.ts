import { writable, type Readable } from 'svelte/store';
import type { ChipsModel } from '../models/Chips';
import type { GameState } from '../models/Poker';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes';
import { FragenPhase } from '@poker-lib/enums/FragenPhase';

interface ChipsStore extends Readable<ChipsModel[]> {
	setChips: (playerId: PlayerId, chips: number) => void;
	setBet: (playerId: PlayerId, bet: number) => void;
	addPlayer: (playerId: PlayerId) => void;
	removePlayer: (playerId: PlayerId) => void;
}

function createChipsStore(): ChipsStore {
	const { update, subscribe } = writable<ChipsModel[]>([]);

	return {
		subscribe,
		setChips: (playerId: PlayerId, chips: number) => {
			update((x) => {
				const playerEntry = x.find((z) => z.playerId == playerId);

				if (!playerEntry) {
					return x;
				}

				playerEntry.chips = chips;

				return x;
			});
		},
		setBet: (playerId: PlayerId, bet?: number) => {
			update((x) => {
				const playerEntry = x.find((z) => z.playerId == playerId);

				if (!playerEntry) {
					return x;
				}

				playerEntry.bet = bet;

				return x;
			});
		},
		addPlayer: (playerId: PlayerId) => {
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
	currentPhase: FragenPhase.PAUSE,
	currentFrage: null
});
export const gamePot = writable<number>(0);
export const gameCode = writable<GameCode | null>(null);
