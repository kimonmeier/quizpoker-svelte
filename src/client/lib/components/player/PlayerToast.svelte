<script lang="ts">
	import { ToastType, type ToastModel } from '@client/lib/models/Toast';
	import { fly } from 'svelte/transition';

	export let toast: ToastModel | undefined;

	function getBackgroundColor(): string {
		if (!toast) {
			throw new Error('Toast is Empty');
		}

		switch (toast.type) {
			case ToastType.FOLD:
				return 'bg-red-400';
			case ToastType.CHECK:
				return 'bg-yellow-400';
			case ToastType.RAISE:
				return 'bg-purple-400';
			case ToastType.CALL:
				return 'bg-green-400';
		}
	}

	function getTitleText(): string {
		if (!toast) {
			throw new Error('Toast is Empty');
		}

		switch (toast.type) {
			case ToastType.FOLD:
				return 'Fold';
			case ToastType.CHECK:
				return 'Check';
			case ToastType.RAISE:
				return 'Raise';
			case ToastType.CALL:
				return 'Call';
		}
	}

	function getSubTitleText(): string | undefined {
		if (!toast) {
			throw new Error('Toast is Empty');
		}

		switch (toast.type) {
			case ToastType.FOLD:
			case ToastType.CHECK:
				return undefined;
			case ToastType.RAISE:
			case ToastType.CALL:
				return toast.chips.toLocaleString();
		}
	}
</script>

{#if toast}
	<div class="absolute w-32 h-16 rounded-tl-2xl rounded-none overflow-hidden">
		<div
			in:fly={{ duration: 750, opacity: 0, x: 0, y: -100 }}
			out:fly={{ duration: 750, opacity: 0, x: 0, y: -100 }}
			class="{getBackgroundColor()} w-full h-full flex flex-col justify-center items-center rounded-br-3xl rounded-tl-2xl"
		>
			<div class="text-xl">
				{getTitleText()}
			</div>

			{#if getSubTitleText()}
				<div class="text-lg">
					+{getSubTitleText()}
				</div>
			{/if}
		</div>
	</div>
{/if}
