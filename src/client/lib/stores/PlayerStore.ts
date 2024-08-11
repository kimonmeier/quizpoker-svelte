import { writable, type Readable } from 'svelte/store';
import type { PlayerModel } from '../models/Player';
import { schaetzungStore } from './SchaetzungenStore';
import { chipStore } from './GameStore';
import type { MemberStatus } from '@poker-lib/enums/MemberStatus';
import StringHelper from '@poker-lib/utils/StringUtils';

interface PlayerStore extends Readable<PlayerModel[]> {
	addPlayer: (player: PlayerModel) => void;
	removePlayer: (playerId: string) => void;
	updatePlayer: (playerId: string, status: MemberStatus) => void;
	reset: () => void;
}

function createPlayerStore(): PlayerStore {
	const { subscribe, set, update } = writable<PlayerModel[]>([]);

	return {
		subscribe,
		addPlayer: (player: PlayerModel) => {
			update((x) => {
				x.push(player);
				return x.sort((x) => StringHelper.hashCode(x.id));
			});

			schaetzungStore.addPlayer(player.id);
			chipStore.addPlayer(player.id);
		},
		removePlayer: (playerId: string) => {
			update((x) => {
				return x.filter((x) => x.id != playerId).sort((x) => StringHelper.hashCode(x.id));
			});

			schaetzungStore.removePlayer(playerId);
			chipStore.removePlayer(playerId);
		},
		updatePlayer: (playerId: string, status: MemberStatus) =>
			update((x) => {
				console.log('UPDATE PLAYER');
				x.find((z) => z.id == playerId)!.playerStatus = status;
				return x;
			}),
		reset: () => set([])
	};
}

export const playerStore = createPlayerStore();
export const playerWhichHasControl = writable<string | null>(null);
export const minimumBet = writable<number>(0);
