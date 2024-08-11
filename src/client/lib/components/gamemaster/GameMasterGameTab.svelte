<script lang="ts">
	import { chipStore, gamePot, gameStateStore } from '@client/lib/stores/GameStore';
	import GroupBox from '../groupBox/GroupBox.svelte';
	import { ArrayUtils } from '@poker-lib/utils/ArrayUtils';
	import Select from '../select/Select.svelte';
	import { FragenPhase } from '@poker-lib/message/ServerMessage';
	import { App } from '@client/lib/services/GameManager';
	import { ClientEvents } from '@poker-lib/enums/ClientEvents';
	import { GameMasterAction } from '@poker-lib/message/ClientMessage';
	import { gameMasterAutoChangePhase } from '@client/lib/stores/GameMasterStore';

	function updatePhase() {
		App.getInstance().sendMessage({
			type: ClientEvents.GAME_MASTER_ACTION,
			action: GameMasterAction.CHANGE_PHASE,
			phase: $gameStateStore.currentPhase
		});
	}

	function announeWinner() {
		if ($gameStateStore.currentPhase != FragenPhase.ANTWORT) {
			throw new Error('Nur während der Antwort kann ein Gewinner verkündet werden!');
		}

		App.getInstance().sendMessage({
			type: ClientEvents.GAME_MASTER_ACTION,
			action: GameMasterAction.ANNOUNCE_WINNER
		});
	}

	function toggelAutomaticPhaseChanging() {
		App.getInstance().sendMessage({
			type: ClientEvents.GAME_MASTER_ACTION,
			action: GameMasterAction.CHANGE_AUTOMATIC_PHASE_CHANGING,
			activated: $gameMasterAutoChangePhase
		});
	}
</script>

<div class="flex flex-col">
	<GroupBox title="Aktuelle Werte">
		<h2>Pot: {$gamePot.toLocaleString()}</h2>
		<h2>Alle Chips: {ArrayUtils.sumField($chipStore, 'chips').toLocaleString()}</h2>
		<h2>
			Differenz: {(
				ArrayUtils.sumField($chipStore, 'chips') - ArrayUtils.sumField($chipStore, 'bet')
			).toLocaleString()}
		</h2>
	</GroupBox>
	<GroupBox title="Phase">
		<Select
			class="bg-zinc-700 rounded-3xl p-2"
			bind:value={$gameStateStore.currentPhase}
			items={[
				FragenPhase.FRAGE,
				FragenPhase.RUNDE_1,
				FragenPhase.RUNDE_2,
				FragenPhase.ANTWORT,
				FragenPhase.PAUSE
			]}
			on:blur={updatePhase}
		></Select>
		<button
			class="rounded-full border border-black bg-green-400 disabled:bg-gray-700"
			disabled={$gameStateStore.currentPhase != FragenPhase.ANTWORT}
			on:click={announeWinner}
		>
			Gewinner ziehen!
		</button>
		<br />
		<label for="automaticPhaseChangeInput">Automatisches Wechseln der Phase</label>
		<input
			id="automaticPhaseChangeInput"
			type="checkbox"
			bind:checked={$gameMasterAutoChangePhase}
			on:blur={toggelAutomaticPhaseChanging}
		/>
	</GroupBox>
</div>
