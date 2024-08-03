<script lang="ts">
	import { gameMasterUrl } from '@client/lib/stores/CredentialStore';
	import VodNinjaWrapper from '../cam/VodNinjaWrapper.svelte';
	import { gamePot, gameStateStore } from '@client/lib/stores/GameStore';
	import Frage from './Frage.svelte';
</script>

<div class="w-full h-full grid grid-cols-3 grid-rows-5 gap-y-5 overflow-hidden py-5">
	<VodNinjaWrapper url={$gameMasterUrl} class="m-auto" />
	<div
		class="rounded-3xl bg-zinc-800 flex col-span-2 text-lg justify-center items-center shadow-lg shadow-black"
	>
		Aktuell sind <span class="font-bold text-3xl mx-3">{$gamePot}</span> im Pot
	</div>

	{#if $gameStateStore.currentFrage}
		<Frage title="Frage">
			{$gameStateStore.currentFrage.frage}
			{#if $gameStateStore.currentFrage.einheit}
				<div class="text-sm text-gray-400 font-bold">
					Antwort in {$gameStateStore.currentFrage.einheit}
				</div>
			{/if}
		</Frage>
		{#if $gameStateStore.currentFrage.hinweis_1}
			<Frage title="Hinweis 1">
				{$gameStateStore.currentFrage.hinweis_1}
			</Frage>
		{/if}
		{#if $gameStateStore.currentFrage.hinweis_2}
			<Frage title="Hinweis 2">
				{$gameStateStore.currentFrage.hinweis_2}
			</Frage>
		{/if}
		{#if $gameStateStore.currentFrage.answer}
			<Frage title="Antwort">
				{$gameStateStore.currentFrage.answer}
			</Frage>
		{/if}
	{:else}
		<div class="col-span-3 row-span-4 mx-5">
			<iframe
				src="https://twitch-chat-psi.vercel.app/?channels=soxeer"
				class="w-full h-full rounded-t-3xl"
				title="Chat"
			/>
		</div>
	{/if}
</div>
