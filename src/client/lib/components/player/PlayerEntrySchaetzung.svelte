<script lang="ts">
	import type { Schaetzung } from '@client/lib/models/Schaetzung';
	import { currentGameMasterFrage } from '@client/lib/stores/GameMasterStore';
	import { gameStateStore } from '@client/lib/stores/GameStore';
	import { playerStore } from '@client/lib/stores/PlayerStore';
	import { schaetzungStore } from '@client/lib/stores/SchaetzungenStore';
	import { MemberStatus } from '@poker-lib/enums/MemberStatus';

	let cssClass = '';
	export { cssClass as class };
	export let schaetzung: Schaetzung | undefined;

	function isClosestToAnswer(): boolean {
		if (!schaetzung?.schaetzung || !$gameStateStore.currentFrage?.answer || !$schaetzungStore) {
			return false;
		}

		const correctAnswer = Number.parseInt($gameStateStore.currentFrage.answer);

		const allSchaetzungen = $schaetzungStore;

		if (allSchaetzungen.length === 0) {
			return false;
		}

		const myDifference = Math.abs(schaetzung.schaetzung - correctAnswer);

		const differences = allSchaetzungen
			.filter((x) => $playerStore.find((z) => z.id == x.playerId)?.playerStatus == MemberStatus.ON)
			.map((s) => Math.abs((s.schaetzung ?? -1000000) - correctAnswer));
		const minDifference = Math.min(...differences);

		return myDifference === minDifference || myDifference < minDifference;
	}
</script>

<div
	class="{cssClass} {isClosestToAnswer()
		? 'pulse'
		: ''} bg-blue-400 h-full flex rounded-lg text-center justify-center items-center shadow-sm shadow-black"
>
	{schaetzung?.schaetzung ?? 'Schätzung'}
</div>

<style>
	.pulse {
		animation: pulse-animation 2s infinite linear;
	}

	@keyframes pulse-animation {
		0% {
			box-shadow: 0px 0px 30px 7.5px rgba(255, 255, 0, 0.6);
		}
		50% {
			box-shadow: 0px 0px 30px 15px rgba(255, 255, 0, 1);
		}
		100% {
			box-shadow: 0px 0px 30px 7.5px rgba(255, 255, 0, 0.6);
		}
	}
</style>
