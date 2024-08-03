import type { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import type { ServerEvents } from '@poker-lib/enums/ServerEvents.ts';
import type { MemberAction } from './ClientMessage';

interface PingServerEvent {
	type: ServerEvents.PING;
	ms: number;
}

interface NewMemberEvent {
	type: ServerEvents.NEW_MITGLIED;
	name: string;
	id: string;
	link: string;
}

interface RemoveMemberEvent {
	type: ServerEvents.REMOVED_MITGLIED;
	id: string;
}

interface MemberUpdateValuesEvent {
	type: ServerEvents.UPDATED_MITGLIED_VALUES;
	id: string;
	chips?: number;
	einsatz?: number;
	status?: MemberStatus;
}

interface ShowToastEvent {
	type: ServerEvents.SHOW_TOAST;
	playerId: string;
	action: MemberAction;
	value?: number;
}

interface GameUpdatedValuesEvent {
	type: ServerEvents.UPDATED_GAME_VALUES;
	pot: number;
}

interface NextQuestionEvent {
	type: ServerEvents.NAECHSTE_FRAGE;
	phase: FragenPhase.FRAGE;
	frage: string;
	einheit?: string;
}

interface NextPhaseEvent {
	type: ServerEvents.NAECHSTE_PHASE;
	phase: FragenPhase;
	value?: string;
}

interface SuccesFullLoginEvent {
	type: ServerEvents.MITGLIED_SUCCESSFULL_LOGIN;
	id: string;
}

interface MemberIssuedSchaetzungEvent {
	type: ServerEvents.MEMBER_ISSUED_SCHAETZUNG;
	id: string;
	schaetzung: number;
}

interface GivePlayerControlEvent {
	type: ServerEvents.GIVE_PLAYER_CONTROLS;
	member_id: string;
	minimumBet: number;
}

interface TakePlayerControlEvent {
	type: ServerEvents.TAKE_PLAYER_CONTROLS;
	member_id: string;
}

interface PlayerRolesSelectedEvent {
	type: ServerEvents.ROLES_SELECTED;
	small_blind: number;
	big_blind: number;
}

interface GameMasterLoginEvent {
	type: ServerEvents.GAMEMASTER_LOGIN;
	link: string;
}

export enum FragenPhase {
	FRAGE = 'Frage',
	RUNDE_1 = 'Hinweis_1',
	RUNDE_2 = 'Hinweis_2',
	ANTWORT = 'Antwort',
	PAUSE = 'Pause'
}

enum GamePhase {
	ROUND,
	PAUSE
}

export type ServerMessage =
	| GivePlayerControlEvent
	| TakePlayerControlEvent
	| MemberIssuedSchaetzungEvent
	| PingServerEvent
	| NewMemberEvent
	| RemoveMemberEvent
	| MemberUpdateValuesEvent
	| GameUpdatedValuesEvent
	| NextQuestionEvent
	| NextPhaseEvent
	| SuccesFullLoginEvent
	| PlayerRolesSelectedEvent
	| ShowToastEvent
	| GameMasterLoginEvent;
