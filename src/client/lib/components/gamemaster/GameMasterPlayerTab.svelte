<script lang="ts">
	import { playerStore } from '@client/lib/stores/PlayerStore';
	import GameMasterPlayerTabPlayer from './GameMasterPlayerTabPlayer.svelte';
	import { gameCode } from '@client/lib/stores/GameStore';

	function copyPublicUrl() {
		navigator.clipboard.writeText(window.location.host + '/?public=true&roomCode=' + $gameCode);
	}
</script>

<h3 on:dblclick={copyPublicUrl}>GameCode: {$gameCode}</h3>
<div class="flex flex-col">
	{#each $playerStore as player}
		<GameMasterPlayerTabPlayer playerId={player.id} />
	{/each}
</div>
