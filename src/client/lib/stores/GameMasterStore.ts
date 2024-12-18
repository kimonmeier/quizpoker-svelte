import { writable } from 'svelte/store';
import type { Frage } from '../models/Frage';
import type { PageEvent } from '../models/PageEvent';

export const gameMasterFrage = writable<Frage[]>([]);
export const gameMasterAutoChangePhase = writable<boolean>(true);
export const playerPageEvents = writable<PageEvent[]>([]);
