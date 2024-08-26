<script lang="ts">
	import { App } from '@client/lib/services/GameManager';
	import { isLoggedIn } from '@client/lib/stores/CredentialStore';
	import '../app.css';
	import {
		backgroundMusicIntenseVolume,
		backgroundMusicStore,
		backgroundMusicStoreIntense,
		backgroundMusicVolume
	} from '@client/lib/stores/SoundStore';
	import { Sound } from '@client/lib/components/sounds/Sound';
	import backgroundMusic from '$lib/assets/ingame_track_1.mp3';
	import backgroundMusicIntense from '$lib/assets/ingame_track_3.mp3';

	$backgroundMusicStore = new Sound(backgroundMusic, backgroundMusicVolume, {
		loop: true
	});
	$backgroundMusicStoreIntense = new Sound(backgroundMusicIntense, backgroundMusicIntenseVolume, {
		loop: true
	});

	function beforeUnload(eventargs: BeforeUnloadEvent) {
		if ($isLoggedIn) {
			App.getInstance().stopApp();
		}
	}
</script>

<svelte:window on:beforeunload={beforeUnload} />

<slot></slot>
