import { writable, type Readable } from 'svelte/store';
import type { Schaetzung } from '../models/Schaetzung';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes';

interface SchaetzungStore extends Readable<Schaetzung[]> {
	setSchaetzung: (playerId: PlayerId, schaetzung: number) => void;
	clearSchaetzungen: () => void;
	addPlayer: (playerId: PlayerId) => void;
	removePlayer: (playerId: PlayerId) => void;
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
		setSchaetzung: (playerId: PlayerId, schaetzung: number) =>
			update((x) => {
				x.find((z) => z.playerId == playerId)!.schaetzung = schaetzung;

				return x;
			}),
		addPlayer: (playerId: PlayerId) => {
			update((x) => {
				x.push({ playerId });
				return x;
			});
		},
		removePlayer: (playerId: PlayerId) => {
			update((x) => x.filter((z) => z.playerId != playerId));
		}
	};
}

export const schaetzungStore = createSchaetzungStore();
export const schaetzungAbgegeben = writable<boolean>(true);
