import type { ComponentType } from 'svelte';

export interface TabInfo<T> {
	label: string;
	value: T;
	component: ComponentType;
}
