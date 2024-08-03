<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { App } from '$lib/services/GameManager';
	import { ClientEvents } from '@poker-lib/enums/ClientEvents';
	import { isGamemaster, isLoggedIn } from '$lib/stores/CredentialStore';
	import ErrorMessage from '$lib/components/alerts/ErrorMessage.svelte';

	let errors: string | undefined;
	let link: string;
	let username: string;
	let isLoading: boolean;

	async function login() {
		if (isLoading) {
			return;
		}

		isLoading = true;

		await tick();

		const connected = await openConnection();

		if (!connected) {
			errors =
				'Beim Verbinden mit dem Server ist ein Fehler aufgetreten, bitte versuche es erneut!';
		} else {
			errors = undefined;
			if ($page.url.searchParams.has('gamemaster')) {
				App.getInstance().sendMessage({
					type: ClientEvents.GAMEMASTER_LOGIN,
					link: link
				});
			} else {
				App.getInstance().sendMessage({
					type: ClientEvents.MEMBER_LOGIN,
					name: username,
					link: link
				});
			}
		}

		isLoading = false;
	}

	async function openConnection(): Promise<boolean> {
		App.getInstance().startApp();
		const connected = await App.getInstance().awaitConnection(10);
		console.log('IsConnected:', connected);

		return App.getInstance().isConnected;
	}

	onMount(() => {
		if ($isLoggedIn) {
			goto('/play');
		}

		if ($page.url.searchParams.has('public')) {
			openConnection().then((isConnected) => {
				if (!isConnected) {
					return;
				}

				$isLoggedIn = true;

				tick().then(() => {
					goto('/public');
				});
			});
		} else if ($page.url.searchParams.has('gamemaster')) {
			$isGamemaster = true;
		}
	});
</script>

<div class="flex flex-col items-center justify-center m-auto h-full w-full">
	<div class="border rounded-xl w-1/3 p-10">
		<h1>Gameshow Login!</h1>
		<div class="mt-5">
			<div class="flex flex-col px-2 py-1">
				<label class="font-bold mb-2" for="usernameInput">Name:</label>
				<input
					class="rounded bg-gray-600"
					id="usernameInput"
					disabled={isLoading}
					bind:value={username}
					type="text"
				/>
			</div>
			<div class="flex flex-col px-2 py-1">
				<label class="font-bold mb-2" for="usernameInput">Webcam Link:</label>
				<input
					class="rounded bg-gray-600"
					id="usernameInput"
					disabled={isLoading}
					bind:value={link}
					type="text"
				/>
			</div>
			<div class="flex flex-col px-2 py-1">
				<button
					class="rounded p-2 font-bold bg-blue-600"
					disabled={isLoading || $isLoggedIn}
					on:click={login}
				>
					Login
				</button>
			</div>
		</div>
	</div>

	<ErrorMessage message={errors} />
</div>
