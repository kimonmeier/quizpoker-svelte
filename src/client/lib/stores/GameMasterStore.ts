import { writable } from 'svelte/store';
import type { Frage } from '../models/Frage';

export const gameMasterFrage = writable<Frage[]>([]);
export const gameMasterAutoChangePhase = writable<boolean>(true);
