<script lang="ts">
	import PlayerControlsModal from '@client/lib/components/controls/PlayerControlsModal.svelte';
	import GameBoard from '@client/lib/components/games/GameBoard.svelte';
	import PlayerCard from '@client/lib/components/player/PlayerCard.svelte';
	import { App } from '@client/lib/services/GameManager';
	import { isLoggedIn } from '@client/lib/stores/CredentialStore';
	import { playerStore } from '@client/lib/stores/PlayerStore';
	import Icon from '@iconify/svelte';
	import BackgroundVideo from '@client/lib/assets/background.mp4';
	import { onMount } from 'svelte';
	import { videoActivated } from '@client/lib/stores/SettingStore';

	let steuerungVisible = false;

	onMount(() => {
		document.body.requestFullscreen();
	});

	function beforeUnload(eventargs: BeforeUnloadEvent) {
		if ($isLoggedIn) {
			App.getInstance().stopApp();
		}
	}

	function getAnzCols(playerLength: number): number {
		if (playerLength > 5) {
			return 6;
		}

		return 5;
	}

	function getRowStart(playerLength: number): number {
		if (playerLength == 4) {
			return 2;
		}

		return 3;
	}

	function getRowSpan(playerLength: number): number {
		if (playerLength > 5) {
			return 4;
		}

		return 3;
	}

	$: playerLength = $playerStore.length;
</script>

<svelte:window on:beforeunload={beforeUnload} />

{#if $videoActivated}
	<video
		class="absolute top-0 left-0 w-full h-full -z-50 blur-md"
		autoplay
		muted
		loop
		preload="none"
	>
		<source src={BackgroundVideo} type="video/mp4" />
	</video>
{/if}
<button
	class="absolute z-0 w-12 h-12 top-0 left-0 hover:text-white text-transparent"
	on:click={() => (steuerungVisible = !steuerungVisible)}
>
	<Icon icon="mdi:cog" height="100%"></Icon>
</button>
<PlayerControlsModal bind:showModal={steuerungVisible} />
<div
	class="grid grid-cols-6 grid-rows-{getAnzCols(playerLength)} h-full w-full {$videoActivated
		? 'bg-transparent'
		: ''}"
>
	<div
		class="col-span-2 col-start-3 row-start-{getRowStart(playerLength)} row-span-{getRowSpan(
			playerLength
		)} h-full w-full from-neutral-900 to-neutral-900 bg-gradient-to-b {playerLength != 4
			? 'border-b-0 rounded-b-none'
			: ''}  border-8 border-indigo-600 px-3 shadow-xl shadow-black rounded-3xl"
	>
		<GameBoard />
	</div>
	{#each $playerStore as player (player.id)}
		<PlayerCard class="col-span-2 row-span-2" {player} />
	{/each}

	{#if $playerStore.length == 4}
		<div class="col-span-2 row-span-2 col-start-3 row-start-1"></div>
	{/if}
</div>
