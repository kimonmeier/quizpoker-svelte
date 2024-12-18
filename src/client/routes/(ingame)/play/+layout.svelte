<script lang="ts">
	import { CheatingDetector } from '@client/lib/services/CheatingManager';
	import { App } from '@client/lib/services/GameManager';

	function beforeUnload(eventargs: BeforeUnloadEvent) {
		App.getInstance().stopApp();
	}
</script>

<svelte:window on:beforeunload={beforeUnload} />
