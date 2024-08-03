<script lang="ts">
	import { App } from '@client/lib/services/GameManager';
	import { chipStore } from '@client/lib/stores/GameStore';
	import { playerStore, playerWhichHasControl } from '@client/lib/stores/PlayerStore';
	import { schaetzungStore } from '@client/lib/stores/SchaetzungenStore';
	import { ClientEvents } from '@poker-lib/enums/ClientEvents';
	import { GameMasterAction } from '@poker-lib/message/ClientMessage';

	export let playerId: string;

	let currentChips = 0;
	let currentBet = 0;

	function betChanged(): void {
		App.getInstance().sendMessage({
			type: ClientEvents.GAME_MASTER_ACTION,
			action: GameMasterAction.UPDATE_MEMBER,
			memberId: playerId,
			einsatz: currentBet
		});
	}

	function chipsChanged(): void {
		App.getInstance().sendMessage({
			type: ClientEvents.GAME_MASTER_ACTION,
			action: GameMasterAction.UPDATE_MEMBER,
			memberId: playerId,
			chips: currentChips
		});
	}

	function toggleControl(): void {
		App.getInstance().sendMessage({
			type: ClientEvents.GAME_MASTER_ACTION,
			action: GameMasterAction.CONTROLS_SELECTED,
			member_id: playerId
		});
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
