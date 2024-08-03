<script lang="ts">
	import { fly } from 'svelte/transition';

	export let title: string;
</script>

<div
	transition:fly={{ duration: 1_000, x: 1000, opacity: 1.0 }}
	class="bg-zinc-800 rounded-3xl w-full col-span-3 flex flex-row text-xl shadow-lg shadow-black"
>
	<div
		class="w-10 bg-zinc-900 shadowRight shadow-black rounded-l-3xl vertical flex h-full justify-center items-center"
	>
		{title}
	</div>
	<div class="flex-grow flex flex-col justify-center items-center">
		<slot />
	</div>
</div>

<style>
	.vertical {
		writing-mode: vertical-lr;
	}

	.shadowRight {
		box-shadow: 10px 0px 20px 0px rgb(0 0 0 / 20%);
	}
</style>
