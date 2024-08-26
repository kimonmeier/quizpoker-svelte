<script lang="ts">
	import type { PlayerModel } from '@client/lib/models/Player';
	import VodNinjaWrapper from '../cam/VodNinjaWrapper.svelte';
	import PlayerEntry from './PlayerEntry.svelte';
	import { playerWhichHasControl } from '@client/lib/stores/PlayerStore';
	import { toastStore } from '@client/lib/stores/ToastStore';
	import PlayerToast from './PlayerToast.svelte';

	let className = '';

	export { className as class };

	export let player: PlayerModel;
	$: hasControl = $playerWhichHasControl == player.id;
	$: toast = $toastStore.filter((x) => x.playerId == player.id).at(0);
</script>

<div
	class="{className} {hasControl
		? 'pulseCam'
		: ''} flex flex-col rounded-3xl rounded-b-2xl border-8 border-[#1e699c] m-24 my-auto shadow-lg shadow-black text-lg"
>
	<PlayerToast {toast} />
	<VodNinjaWrapper url={player.link} />
	<PlayerEntry class="thickBorder" {player} />
</div>

<style>
	@keyframes pulse-animation {
		0% {
			box-shadow: 0px 0px 30px 1px rgba(255, 0, 0, 0.4);
		}
		50% {
			box-shadow: 0px 0px 30px 10px rgba(255, 0, 0, 0.8);
		}
		100% {
			box-shadow: 0px 0px 30px 1px rgba(255, 0, 0, 0.4);
		}
	}

	.pulseCam {
		animation: pulse-animation 5s infinite linear;
	}
</style>
