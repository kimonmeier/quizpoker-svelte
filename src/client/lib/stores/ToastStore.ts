import { writable, type Readable } from 'svelte/store';
import { parseToastType, type ToastModel } from '../models/Toast';
import type { MemberAction } from '@poker-lib/message/ClientMessage';

interface ToastStore extends Readable<ToastModel[]> {
	addToast: (playerId: string, type: MemberAction, value?: number) => void;
}

function createToastStore(): ToastStore {
	const { update, subscribe } = writable<ToastModel[]>([]);

	return {
		subscribe,
		addToast: (playerId: string, type: MemberAction, value?: number) =>
			update((toasts) => {
				// Create a unique ID so we can easily find/remove it
				// if it is dismissible/has a timeout.
				const id = crypto.randomUUID();

				setTimeout(() => {
					console.log('Delete Toast');
					update((toasts) => toasts.filter((x) => x.toastId != id));
				}, 10_000);

				toasts.push({
					toastId: id,
					playerId: playerId,
					type: parseToastType(type),
					chips: value ?? 0
				});

				return toasts;
			})
	};
}

export const toastStore = createToastStore();
