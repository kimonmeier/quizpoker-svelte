<script lang="ts">
	import { App } from '@client/lib/services/GameManager';
	import Modal from '../modal/Modal.svelte';
	import { minimumBet, playerWhichHasControl } from '@client/lib/stores/PlayerStore';
	import { currentPlayerId } from '@client/lib/stores/CredentialStore';
	import { chipStore } from '@client/lib/stores/GameStore';
	import GroupBox from '../groupBox/GroupBox.svelte';
	import { schaetzungAbgegeben } from '@client/lib/stores/SchaetzungenStore';
	import { onDestroy, onMount } from 'svelte';
	import type { Unsubscriber } from 'svelte/store';
	import {
		backgroundMusicIntenseVolume,
		backgroundMusicVolume,
		soundEffectsVolume
	} from '@client/lib/stores/SoundStore';
	import { videoActivated } from '@client/lib/stores/SettingStore';

	export let showModal: boolean;

	function fold() {
		if (!hasControl) {
			throw new Error('Not allowed');
		}

		App.getInstance().Socket.emit('FOLD');

		close();
	}

	function check() {
		if (!hasControl) {
			throw new Error('Not allowed');
		}

		if ((currentChips?.bet ?? 0) != $minimumBet - 50) {
			throw new Error('Ungültige Eingabe');
		}

		App.getInstance().Socket.emit('CHECK');

		close();
	}

	function call() {
		if (!hasControl) {
			throw new Error('Not allowed');
		}
		if ((currentChips?.bet ?? 0) == $minimumBet - 50) {
			throw new Error('Ungültige Eingabe');
		}

		App.getInstance().Socket.emit('CALL');

		close();
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

		close();
	}

	function submitSchaetzung(): void {
		if ($schaetzungAbgegeben) {
			return;
		}

		if (
			!confirm(
				'Sicher das du deine Schätzung abgeben möchtest? Dieser Schritt kann nicht rückgänig gemacht werden'
			)
		) {
			return;
		}

		App.getInstance().Socket.emit('SCHAETZUNG_ABGEBEN', Math.floor(schaetzung));

		$schaetzungAbgegeben = true;
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
	let schaetzung = 0;
	let minimumBetSubscriber: Unsubscriber | undefined = undefined;

	onMount(() => {
		minimumBetSubscriber = minimumBet.subscribe((bet) => (raiseTo = bet));
	});

	onDestroy(() => {
		if (minimumBetSubscriber) {
			minimumBetSubscriber();
		}
	});

	$: currentChips = $chipStore.find((x) => x.playerId == $currentPlayerId);
	$: hasControl = $playerWhichHasControl == $currentPlayerId;
</script>

<Modal bind:showModal>
	<GroupBox title="Schätzung">
		<input type="number" class="bg-zinc-700 rounded-3xl text-right" bind:value={schaetzung} />
		<button
			disabled={$schaetzungAbgegeben}
			class="bg-green-400 disabled:bg-gray-700 rounded-3xl"
			on:click={submitSchaetzung}>Schätzung abgeben</button
		>
	</GroupBox>
	<GroupBox title="Einstellungen">
		<div class="flex flex-col w-full gap-5">
			<div class="flex flex-row">
				<div>Video-Hintergrund aktivieren:</div>

				<input type="checkbox" bind:checked={$videoActivated} />
			</div>
		</div>
	</GroupBox>
	<GroupBox title="Chips">
		<div class="flex flex-col">
			<h2>Deine Chips: {currentChips?.chips ?? 0}</h2>
			<h2>Dein Einsatz: {currentChips?.bet ?? 0}</h2>
			<h3>Mindesteinsatz: {$minimumBet}</h3>
		</div>
		<div class="flex flex-row w-full gap-5">
			<button
				class="disabled:bg-gray-700 bg-yellow-400 rounded-2xl flex-grow p-2"
				disabled={(currentChips?.bet ?? 0) != $minimumBet - 50 || !hasControl}
				on:click={check}
			>
				Check
			</button>
			<button
				class="disabled:bg-gray-700 bg-green-400 rounded-2xl flex-grow"
				disabled={(currentChips?.bet ?? 0) == $minimumBet - 50 || !hasControl}
				on:click={call}
			>
				Call
			</button>
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
		<div class="flex flex-row">
			<div>Neuer Einsatz:</div>
			<input
				type="range"
				bind:value={raiseTo}
				min={$minimumBet}
				max={currentChips?.chips ?? 0}
				step="50"
			/>
			<input
				type="number"
				class="font-bold bg-neutral-700 rounded-xl"
				bind:value={raiseTo}
				on:blur={validateBet}
			/>
		</div>
	</GroupBox>
	<GroupBox title="Game Einstellungen">
		<div class="flex flex-col w-full gap-5">
			<div class="flex flex-row">
				<div>Lautstärke normale Musik:</div>

				<input type="range" bind:value={$backgroundMusicVolume} min={0} max={1} step="0.005" />
			</div>
			<div class="flex flex-row">
				<div>Lautstärke intensive Musik:</div>

				<input
					type="range"
					bind:value={$backgroundMusicIntenseVolume}
					min={0}
					max={1}
					step="0.005"
				/>
			</div>
			<div class="flex flex-row">
				<div>Lautstärke Soundeffekte:</div>

				<input type="range" bind:value={$soundEffectsVolume} min={0} max={1} step="0.005" />
			</div>
		</div>
	</GroupBox>
</Modal>
