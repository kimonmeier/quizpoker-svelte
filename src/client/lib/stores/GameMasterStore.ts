import { writable } from 'svelte/store';
import type { Frage } from '../models/Frage';
import type { PageEvent } from '../models/PageEvent';
import type { PlayerModel } from '../models/Player';

export const gameMasterFrage = writable<Frage[]>([]);
export const gameMasterAutoChangePhase = writable<boolean>(true);
export const playerPageEvents = writable<PageEvent[]>([]);
export const bigBlindPlayer = writable<PlayerModel | null>(null);
export const bigBlindAmount = writable<number>(0);
export const streamerName = writable<string | null>(null);
