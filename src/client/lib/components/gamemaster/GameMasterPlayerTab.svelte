<script lang="ts">
	import { playerStore } from '@client/lib/stores/PlayerStore';
	import GameMasterPlayerTabPlayer from './GameMasterPlayerTabPlayer.svelte';
</script>

<div class="flex flex-col">
	{#each $playerStore as player}
		<GameMasterPlayerTabPlayer playerId={player.id} />
	{/each}
</div>
