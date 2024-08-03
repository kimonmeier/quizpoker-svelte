<script lang="ts">
	import { App } from '@client/lib/services/GameManager';
	import { isLoggedIn } from '@client/lib/stores/CredentialStore';
	import '../app.css';

	function beforeUnload(eventargs: BeforeUnloadEvent) {
		if ($isLoggedIn) {
			App.getInstance().stopApp();
		}
	}
</script>

<svelte:window on:beforeunload={beforeUnload} />

<slot></slot>
