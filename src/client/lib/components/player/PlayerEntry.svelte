<script lang="ts">
	import PlayerEntryChips from './PlayerEntryChips.svelte';
	import PlayerEntrySchaetzung from './PlayerEntrySchaetzung.svelte';
	import PlayerEntryBet from './PlayerEntryBet.svelte';
	import type { PlayerModel } from '@client/lib/models/Player';
	import { schaetzungStore } from '@client/lib/stores/SchaetzungenStore';
	import { chipStore } from '@client/lib/stores/GameStore';
	import { MemberStatus } from '@poker-lib/enums/MemberStatus';

	let cssClass: string = '';
	export { cssClass as class };

	export let player: PlayerModel;

	$: chips = $chipStore.find((x) => x.playerId == player.id);
	$: schaetzung = $schaetzungStore.find((x) => x.playerId == player.id);
</script>

<div
	class="{cssClass} grid grid-cols-3 gap-3 justify-center items-center rounded-b-md h-14 bg-[#1e699c]"
>
	{#key player.playerStatus}
		<PlayerEntryChips
			{chips}
			class="flex-grow {player.playerStatus === MemberStatus.PLEITE
				? 'rounded-none'
				: 'rounded-r-lg'}"
		/>
		{#if player.playerStatus !== MemberStatus.PLEITE}
			<PlayerEntrySchaetzung {schaetzung} />
			<PlayerEntryBet chipEntry={chips} memberStatus={player.playerStatus} />
		{/if}
	{/key}
</div>

<style>
	.thickBorder {
		border-top: 8px solid #1e699c;
	}
</style>
