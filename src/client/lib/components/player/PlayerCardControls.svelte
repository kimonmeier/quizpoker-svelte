<script lang="ts">
	import { App } from '@client/lib/services/GameManager';
	import { chipStore } from '@client/lib/stores/GameStore';
	import { minimumBet, playerWhichHasControl } from '@client/lib/stores/PlayerStore';
	import type { PlayerId } from '@poker-lib/message/OpaqueTypes';
	import { onDestroy, onMount } from 'svelte';
	import type { Unsubscriber } from 'svelte/store';

	export let playerId: PlayerId;
	function fold() {
		if (!hasControl) {
			throw new Error('Not allowed');
		}

		App.getInstance().Socket.emit('FOLD');
	}

	function check() {
		if (!hasControl) {
			throw new Error('Not allowed');
		}

		if ((currentChips?.bet ?? 0) != $minimumBet - 50) {
			throw new Error('Ungültige Eingabe');
		}

		App.getInstance().Socket.emit('CHECK');
	}

	function call() {
		if (!hasControl) {
			throw new Error('Not allowed');
		}
		if ((currentChips?.bet ?? 0) == $minimumBet - 50) {
			throw new Error('Ungültige Eingabe');
		}

		App.getInstance().Socket.emit('CALL');
	}

	function raise() {
		if (!hasControl) {
			throw new Error('Not allowed');
		}

		if (raiseTo > currentChips!.chips) {
			raiseTo = currentChips!.chips;
		} else if (raiseTo <= $minimumBet) {
			raiseTo = $minimumBet;
		} else if (raiseTo == currentChips!.bet) {
			raiseTo = currentChips!.chips + 50;
		}

		App.getInstance().Socket.emit('RAISE', raiseTo);
	}

	function validateBet() {
		if (raiseTo % 50 != 0) {
			raiseTo = Math.floor(raiseTo / 50) * 50;
		}

		if (raiseTo < $minimumBet) {
			raiseTo = $minimumBet;
		} else if (raiseTo > currentChips!.chips) {
			raiseTo = currentChips!.chips;
		}
	}

	let raiseTo = $minimumBet;
	let minimumBetSubscriber: Unsubscriber | undefined = undefined;

	onMount(() => {
		minimumBetSubscriber = minimumBet.subscribe((bet) => {
			if (raiseTo >= bet) {
				return;
			}
			raiseTo = bet;
		});
	});

	onDestroy(() => {
		if (minimumBetSubscriber) {
			minimumBetSubscriber();
		}
	});

	$: currentChips = $chipStore.find((x) => x.playerId == playerId);
	$: hasControl = $playerWhichHasControl == playerId;
</script>

<div class="absolute top-1 left-1">
	<div class="flex flex-col gap-2">
		<h2>Deine Chips: {currentChips?.chips ?? 0}</h2>
		<h2>Dein Einsatz: {currentChips?.bet ?? 0}</h2>
		<h3>Mindesteinsatz: {$minimumBet}</h3>
	</div>
</div>
<div class="flex flex-row w-full gap-5 col-span-3">
	<button
		class="disabled:bg-gray-700 bg-yellow-400 rounded-2xl flex-grow p-2"
		disabled={(currentChips?.bet ?? 0) != $minimumBet - 50 || !hasControl}
		on:click={check}
	>
		Check
	</button>
	<button
		class="disabled:bg-gray-700 bg-green-400 rounded-2xl flex-grow p-2"
		disabled={(currentChips?.bet ?? 0) == $minimumBet - 50 || !hasControl}
		on:click={call}
	>
		Call
	</button>
	<input
		type="number"
		class="bg-neutral-700 rounded-2xl max-w-40 text-right p-2"
		bind:value={raiseTo}
		on:blur={validateBet}
		disabled={!hasControl}
	/>
	<button
		class="disabled:bg-gray-700 bg-blue-400 rounded-2xl flex-grow p-2"
		disabled={!hasControl}
		on:click={raise}
	>
		Raise
	</button>
	<button
		class="disabled:bg-gray-700 bg-red-400 rounded-2xl flex-grow p-2"
		on:click={fold}
		disabled={!hasControl}
	>
		Fold
	</button>
</div>
