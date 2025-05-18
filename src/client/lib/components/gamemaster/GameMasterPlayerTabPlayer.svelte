<script lang="ts">
	import { App } from '@client/lib/services/GameManager';
	import { chipStore, gameCode } from '@client/lib/stores/GameStore';
	import { playerStore, playerWhichHasControl } from '@client/lib/stores/PlayerStore';
	import { schaetzungStore } from '@client/lib/stores/SchaetzungenStore';
	import type { PlayerId } from '@poker-lib/message/OpaqueTypes';

	export let playerId: PlayerId;

	let currentChips = 0;
	let currentBet = 0;

	function betChanged(): void {
		App.getInstance().Socket.emit('UPDATE_PLAYER_EINSATZ', $gameCode!, playerId, currentBet);
	}

	function chipsChanged(): void {
		App.getInstance().Socket.emit('UPDATE_PLAYER_CHIPS', $gameCode!, playerId, currentChips);
	}

	function toggleControl(): void {
		App.getInstance().Socket.emit('GIVE_PLAYER_CONTROLS', $gameCode!, playerId);
	}

	$: currentPlayer = $playerStore.find((x) => x.id == playerId);
	$: playerHasControl = $playerWhichHasControl == playerId;
	$: schaetzung = $schaetzungStore.find((x) => x.playerId == playerId);

	chipStore.subscribe((x) => {
		const chip = x.find((x) => x.playerId == playerId)!;

		currentChips = chip.chips;
		currentBet = chip.bet ?? 0;
	});
</script>

<div class="flex flex-row h-10 gap-5 items-center">
	<button
		class="w-10 h-10 rounded-full border border-black {playerHasControl
			? 'bg-green-400'
			: 'bg-gray-400'}"
		on:click={toggleControl}
	></button>
	<div class="flex-grow font-bold">{currentPlayer?.name ?? 'Spieler'}</div>
	<div class="flex-grow font-bold">{schaetzung?.schaetzung?.toLocaleString() ?? 'Schätzung'}</div>
	<button class="w-10 h-10 {currentPlayer?.isOnPage ? 'bg-green-500' : 'bg-red-500'} rounded-3xl"
	></button>
	<div>Chips</div>
	<input
		type="number"
		class="bg-neutral-700 min-w-10 font-bold"
		bind:value={currentChips}
		on:blur={chipsChanged}
	/>
	<div>Bet:</div>
	<input
		type="number"
		class="bg-neutral-700 min-w-10 font-bold"
		bind:value={currentBet}
		on:blur={betChanged}
	/>
</div>
