<script lang="ts">
	import PlayerEntryChips from './PlayerEntryChips.svelte';
	import PlayerEntrySchaetzung from './PlayerEntrySchaetzung.svelte';
	import PlayerEntryBet from './PlayerEntryBet.svelte';
	import type { PlayerModel } from '@client/lib/models/Player';
	import { schaetzungStore } from '@client/lib/stores/SchaetzungenStore';
	import { chipStore } from '@client/lib/stores/GameStore';
	import { MemberStatus } from '@poker-lib/enums/MemberStatus';
	import { currentPlayerId } from '@client/lib/stores/CredentialStore';
	import PlayerCardControls from './PlayerCardControls.svelte';

	let cssClass: string = '';
	export { cssClass as class };

	export let player: PlayerModel;

	let isHovering: boolean = false;

	$: chips = $chipStore.find((x) => x.playerId == player.id);
	$: schaetzung = $schaetzungStore.find((x) => x.playerId == player.id);
</script>

<div
	class="{cssClass} grid grid-cols-3 gap-3 justify-center items-center rounded-b-md h-14 bg-[#1e699c]"
	on:mouseover={() => (isHovering = true && player.id == $currentPlayerId)}
	on:mouseleave={() => (isHovering = false)}
	on:focus={() => (isHovering = true && player.id == $currentPlayerId)}
>
	{#if isHovering}
		<PlayerCardControls playerId={player.id} />
	{:else}
		<PlayerEntryChips
			{chips}
			class="flex-grow {player.playerStatus === MemberStatus.PLEITE
				? 'rounded-none'
				: 'rounded-r-lg'}"
		/>
		{#if player.playerStatus != MemberStatus.PLEITE && chips?.chips != 0}
			<PlayerEntrySchaetzung {schaetzung} />
			<PlayerEntryBet chipEntry={chips} memberStatus={player.playerStatus} />
		{/if}
	{/if}
</div>

<style>
	.thickBorder {
		border-top: 8px solid #1e699c;
	}
</style>
