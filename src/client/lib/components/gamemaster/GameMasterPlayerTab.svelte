<script lang="ts">
	import { playerStore } from '@client/lib/stores/PlayerStore';
	import GameMasterPlayerTabPlayer from './GameMasterPlayerTabPlayer.svelte';
	import { gameCode } from '@client/lib/stores/GameStore';
</script>

<h3>GameCode: {$gameCode}</h3>
<div class="flex flex-col">
	{#each $playerStore as player}
		<GameMasterPlayerTabPlayer playerId={player.id} />
	{/each}
</div>
