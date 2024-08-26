import { writable } from 'svelte/store';
import type { Sound } from '../components/sounds/Sound';

export const backgroundMusicStore = writable<Sound>();
export const backgroundMusicStoreIntense = writable<Sound>();
export const backgroundMusicVolume = writable<number>(0.3);
export const backgroundMusicIntenseVolume = writable<number>(0.1);
