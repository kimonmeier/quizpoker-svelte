import { writable, type Readable } from 'svelte/store';
import type { Schaetzung } from '../models/Schaetzung';

interface SchaetzungStore extends Readable<Schaetzung[]> {
	setSchaetzung: (playerId: string, schaetzung: number) => void;
	clearSchaetzungen: () => void;
	addPlayer: (playerId: string) => void;
	removePlayer: (playerId: string) => void;
}

function createSchaetzungStore(): SchaetzungStore {
	const { update, subscribe } = writable<Schaetzung[]>([]);

	return {
		subscribe,
		clearSchaetzungen: () => {
			update((x) => {
				x.forEach((schaetzung) => (schaetzung.schaetzung = undefined));

				return x;
			});
			schaetzungAbgegeben.set(false);
		},
		setSchaetzung: (playerId: string, schaetzung: number) =>
			update((x) => {
				x.find((z) => z.playerId == playerId)!.schaetzung = schaetzung;

				return x;
			}),
		addPlayer: (playerId: string) => {
			update((x) => {
				x.push({ playerId });
				return x;
			});
		},
		removePlayer: (playerId: string) => {
			update((x) => x.filter((z) => z.playerId != playerId));
		}
	};
}

export const schaetzungStore = createSchaetzungStore();
export const schaetzungAbgegeben = writable<boolean>(true);
