import { goto, invalidateAll } from '$app/navigation';
import { minimumBet, playerStore, playerWhichHasControl } from '../stores/PlayerStore';
import { gameMasterUrl } from '../stores/CredentialStore';
import { get } from 'svelte/store';
import { chipStore, gamePot, gameStateStore } from '../stores/GameStore';
import { schaetzungStore } from '../stores/SchaetzungenStore';
import { MemberStatus } from '@poker-lib/enums/MemberStatus';
import { toastStore } from '../stores/ToastStore';
import {
	backgroundMusicStore,
	backgroundMusicStoreIntense,
	soundEffectsStore
} from '../stores/SoundStore';
import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents } from '@poker-lib/message/ServerToClientEvents';
import type { ClientToServerEvents } from '@poker-lib/message/ClientToServerEvents';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes';
import type { MemberAction } from '@poker-lib/enums/MemberAction';
import { FragenPhase } from '@poker-lib/enums/FragenPhase';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class App {
	private static instance: App;

	public static getInstance(): App {
		if (App.instance == undefined) {
			new App();
		}

		return App.instance;
	}

	private client!: AppSocket;

	private constructor() {
		App.instance = this;
	}

	public startApp(): void {
		this.client = io({
			autoConnect: true,
			reconnection: true,
			reconnectionAttempts: 10000
		});
		this.registerHandlers(this.client);

		this.client.connect();
	}

	public get IsConnected() {
		return this.client?.connected ?? false;
	}

	public get Socket() {
		return this.client;
	}

	public stopApp(): void {
		this.client.disconnect();

		invalidateAll().then(() => {
			console.log('Successfully invalidated all');
			goto('').then(() => {
				console.log('Rerouted to login!');
			});
		});
	}

	public async awaitConnection(timeout: number): Promise<boolean> {
		console.log('await connection');
		let index = 0;
		while (!this.client.connected && index < timeout) {
			console.log('Checking', this.client.connected, index);
			await new Promise((r) => setTimeout(r, 250));
			index++;
		}

		console.log('No checking anymore');

		return this.client.connected;
	}

	private registerHandlers(socket: AppSocket) {
		socket
			.on('PLAYER_JOINED', (id, name, link) => this.playerJoined(id, name, link))
			.on('PLAYER_LEFT', (id) => this.playerLeft(id))
			.on('GAMEMASTER_LOGIN', (url) => this.gameMasterLogin(url))
			.on('CHIPS_CHANGED', (id, chips) => this.changeChips(id, chips))
			.on('BET_CHANGED', (id, bet) => this.changeBet(id, bet))
			.on('STATUS_CHANGED', (id, status) => this.changePlayerStatus(id, status))
			.on('GIVE_PLAYER_CONTROLS', (id, minimumBet) => this.givePlayerControl(id, minimumBet))
			.on('TAKE_PLAYER_CONTROLS', () => this.takePlayerControl())
			.on('MEMBER_ISSUED_SCHAETZUNG', (id, schaetzung) =>
				this.memberIssuedSchaetzung(id, schaetzung)
			)
			.on('SHOW_TOAST', (playerId, action, value) => this.showToast(playerId, action, value))
			.on('CHANGE_POT', (pot) => gamePot.set(pot))
			.on('DISPLAY_NEXT_QUESTION', (frage, einheit) => this.displayNextQuestion(frage, einheit))
			.on('DISPLAY_NEXT_PHASE', (phase, value) => this.displayNextPhase(phase, value))
			.on('REPORT_VISIBILITY_CHANGED', (playerId, visible) =>
				playerStore.playerChangePage(playerId, visible)
			);

		socket.io.on('reconnect', (attempt) =>
			console.log(`Attempt to reconnect for the ${attempt} time!`)
		);
		socket.io.on('error', (err) => console.log('Error occured', err));
	}

	private playerJoined(playerId: PlayerId, name: string, link: string): void {
		playerStore.addPlayer({
			id: playerId,
			name: name,
			link: link,
			playerStatus: MemberStatus.ON,
			isOnPage: true
		});
	}

	private playerLeft(playerId: PlayerId): void {
		playerStore.removePlayer(playerId);
	}

	private gameMasterLogin(url: string): void {
		gameMasterUrl.set(url);
	}

	private changeChips(playerId: PlayerId, chips: number): void {
		chipStore.setChips(playerId, chips);
	}

	private changeBet(playerId: PlayerId, bet: number): void {
		chipStore.setBet(playerId, bet);
	}

	private changePlayerStatus(playerId: PlayerId, status: MemberStatus): void {
		playerStore.updatePlayer(playerId, status);
	}

	private givePlayerControl(playerId: PlayerId, minimumBets: number): void {
		playerWhichHasControl.set(playerId);
		minimumBet.set(minimumBets);
	}

	private takePlayerControl(): void {
		playerWhichHasControl.set(null);
	}

	private memberIssuedSchaetzung(playerId: PlayerId, schaetzung: number): void {
		schaetzungStore.setSchaetzung(playerId, schaetzung);
	}

	private showToast(playerId: PlayerId, action: MemberAction, value?: number): void {
		toastStore.addToast(playerId, action, value);
	}

	private displayNextQuestion(frage: string, einheit?: string): void {
		schaetzungStore.clearSchaetzungen();
		gameStateStore.update((gameState) => {
			gameState.currentPhase = FragenPhase.FRAGE;
			gameState.currentFrage = {
				id: crypto.randomUUID(),
				frage: frage,
				einheit: einheit
			};

			return gameState;
		});
		get(backgroundMusicStore).stop();
		get(backgroundMusicStoreIntense).stop();

		get(backgroundMusicStore).play();
		get(backgroundMusicStoreIntense).stop();
	}

	private displayNextPhase(phase: FragenPhase, value?: string): void {
		gameStateStore.update((gameState) => {
			gameState.currentPhase = phase;

			switch (phase) {
				case FragenPhase.PAUSE:
					gameState.currentFrage = null;
					break;
				case FragenPhase.RUNDE_1:
					gameState.currentFrage!.hinweis_1 = value!;
					break;
				case FragenPhase.RUNDE_2:
					gameState.currentFrage!.hinweis_2 = value!;
					break;
				case FragenPhase.ANTWORT:
					gameState.currentFrage!.answer = value!;
			}

			return gameState;
		});

		get(soundEffectsStore).play();

		if (phase == FragenPhase.ANTWORT) {
			get(backgroundMusicStore).stop();
			get(backgroundMusicStoreIntense).play();
		}

		if (phase == FragenPhase.PAUSE) {
			get(backgroundMusicStore).stop();
			get(backgroundMusicStoreIntense).stop();
		}
	}
}
