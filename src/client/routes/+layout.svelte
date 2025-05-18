<script lang="ts">
	import { App } from '@client/lib/services/GameManager';
	import { isLoggedIn } from '@client/lib/stores/CredentialStore';
	import '../app.css';
	import {
		backgroundMusicIntenseVolume,
		backgroundMusicStore,
		backgroundMusicStoreIntense,
		backgroundMusicVolume,
		soundEffectsStore,
		soundEffectsVolume
	} from '@client/lib/stores/SoundStore';
	import { Sound } from '@client/lib/components/sounds/Sound';
	import backgroundMusic from '$lib/assets/background_music.mp3';
	import backgroundMusicIntense from '$lib/assets/answer_music.mp3';
	import soundEffectMusic from '$lib/assets/sound_effect.mp3';

	$backgroundMusicStore = new Sound(backgroundMusic, backgroundMusicVolume, {
		loop: true
	});
	$backgroundMusicStoreIntense = new Sound(backgroundMusicIntense, backgroundMusicIntenseVolume, {
		loop: true
	});
	$soundEffectsStore = new Sound(soundEffectMusic, soundEffectsVolume, {
		loop: false
	});

	function beforeUnload(eventargs: BeforeUnloadEvent) {
		if ($isLoggedIn) {
			App.getInstance().stopApp();
		}
	}
</script>

<svelte:window on:beforeunload={beforeUnload} />

<slot></slot>
