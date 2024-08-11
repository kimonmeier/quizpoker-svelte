<script lang="ts">
	import Icon from '@iconify/svelte';

	let className = '';
	export { className as class };
	export let url: string | null | undefined;
</script>

{#if url}
	<iframe
		allow="autoplay;fullscreen;"
		class="rounded-t-2xl aspect-video {className}"
		src="{url}&cleanoutput&transparent&as&videobitrate=6000&deafen&noaudioprocessing"
		title="Kamera"
	/>
{:else}
	<div class="rounded-t-3xl aspect-video flex items-center justify-center h-full w-full">
		<Icon icon="mdi:camera-off" height="80px" />
	</div>
{/if}
