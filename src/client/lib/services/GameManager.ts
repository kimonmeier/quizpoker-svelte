import { FragenPhase, type ServerMessage } from '@poker-lib/message/ServerMessage';
import WebSocketClient from './WebSocketClient';
import type { ClientMessage } from '@poker-lib/message/ClientMessage';
import { goto } from '$app/navigation';
import { ClientEvents } from '@poker-lib/enums/ClientEvents';
import { ServerEvents } from '@poker-lib/enums/ServerEvents';
import { minimumBet, playerStore, playerWhichHasControl } from '../stores/PlayerStore';
import {
	currentPlayerId,
	gameMasterUrl,
	isGamemaster,
	isLoggedIn
} from '../stores/CredentialStore';
import { get } from 'svelte/store';
import { chipStore, gamePot, gameStateStore } from '../stores/GameStore';
import { schaetzungStore } from '../stores/SchaetzungenStore';
import { MemberStatus } from '@poker-lib/enums/MemberStatus';
import { toastStore } from '../stores/ToastStore';

export class App {
	private static instance: App;

	public static getInstance(): App {
		if (App.instance == undefined) {
			new App();
		}

		return App.instance;
	}

	private client!: WebSocketClient;

	private constructor() {
		App.instance = this;
	}

	public startApp(): void {
		//this.client = new WebSocketClient("wss://gameshow.k-meier.ch/brainbattle/socket");
		this.client = new WebSocketClient('ws://localhost:2224');

		this.client.recieve = (m: ServerMessage) => this.recieve(m);
	}

	public sendMessage(m: ClientMessage): void {
		this.client.send(m);
	}

	public stopApp(): void {
		this.client.send({
			type: ClientEvents.MEMBER_LEAVT
		});

		goto('/', {
			invalidateAll: true,
			replaceState: true
		});
	}

	public get isConnected(): boolean {
		return this.client?.isOpen;
	}

	public async awaitConnection(timeout: number): Promise<boolean> {
		console.log('await connection');
		let index = 0;
		while (!this.client.isOpen && index < timeout) {
			console.log('Checking', this.client.isOpen, index);
			await new Promise((r) => setTimeout(r, 50));
			index++;
		}

		console.log('No checking anymore');

		return this.client.isOpen;
	}

	private async recieve(m: ServerMessage): Promise<void> {
		console.log('Neue Nachricht vom Server');
		console.log(m);

		switch (m.type) {
			case ServerEvents.NEW_MITGLIED:
				playerStore.addPlayer({
					id: m.id,
					link: m.link,
					name: m.name,
					playerStatus: MemberStatus.ON
				});
				break;
			case ServerEvents.REMOVED_MITGLIED:
				playerStore.removePlayer(m.id);
				break;

			case ServerEvents.PING:
				console.log('PING');
				break;

			case ServerEvents.MITGLIED_SUCCESSFULL_LOGIN:
				currentPlayerId.set(m.id);
				isLoggedIn.set(true);

				if (get(isGamemaster)) {
					goto('gamemaster');
				} else {
					goto('play');
				}
				break;
			case ServerEvents.UPDATED_MITGLIED_VALUES:
				if (m.chips != undefined) {
					chipStore.setChips(m.id, m.chips);
				}

				if (m.einsatz != undefined) {
					chipStore.setBet(m.id, m.einsatz);
				}

				if (m.status != undefined) {
					playerStore.updatePlayer(m.id, m.status);
				}
				break;

			case ServerEvents.GAMEMASTER_LOGIN:
				gameMasterUrl.set(m.link);
				break;

			case ServerEvents.GIVE_PLAYER_CONTROLS:
				playerWhichHasControl.set(m.member_id);
				minimumBet.set(m.minimumBet);
				break;

			case ServerEvents.TAKE_PLAYER_CONTROLS:
				playerWhichHasControl.set(null);
				break;

			case ServerEvents.MEMBER_ISSUED_SCHAETZUNG:
				schaetzungStore.setSchaetzung(m.id, m.schaetzung);
				break;

			case ServerEvents.SHOW_TOAST:
				toastStore.addToast(m.playerId, m.action, m.value);
				break;

			case ServerEvents.NAECHSTE_PHASE:
				gameStateStore.update((gameState) => {
					gameState.currentPhase = m.phase;

					switch (m.phase) {
						case FragenPhase.PAUSE:
							gameState.currentFrage = undefined;
							break;
						case FragenPhase.RUNDE_1:
							gameState.currentFrage!.hinweis_1 = m.value!;
							break;
						case FragenPhase.RUNDE_2:
							gameState.currentFrage!.hinweis_2 = m.value!;
							break;
						case FragenPhase.ANTWORT:
							gameState.currentFrage!.answer = m.value!;
					}

					return gameState;
				});
				break;

			case ServerEvents.NAECHSTE_FRAGE:
				schaetzungStore.clearSchaetzungen();
				gameStateStore.update((gameState) => {
					gameState.currentPhase = m.phase;
					gameState.currentFrage = {
						id: crypto.randomUUID(),
						frage: m.frage,
						einheit: m.einheit
					};

					return gameState;
				});
				break;

			case ServerEvents.UPDATED_GAME_VALUES:
				gamePot.set(m.pot);
				break;
		}
	}
}
