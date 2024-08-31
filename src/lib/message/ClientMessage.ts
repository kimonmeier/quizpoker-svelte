import type { ClientEvents } from '@poker-lib/enums/ClientEvents.ts';
import type { FragenPhase } from './ServerMessage.ts';

interface ConnectionSuccessEvent {
	type: ClientEvents.CONNECTION_SUCCESS;
	uuid: string;
}

interface MemberLoginEvent {
	type: ClientEvents.MEMBER_LOGIN;
	link: string;
	name: string;
}

interface GameMasterLoginEvent {
	type: ClientEvents.GAMEMASTER_LOGIN;
	link: string;
}

interface MemberLeftEvent {
	type: ClientEvents.MEMBER_LEAVT;
}

interface SchaetzungAbgegebenEvent {
	type: ClientEvents.SCHAETZUNG_ABGEBEN;
	schaetzung: number;
}

interface MemberActionRaiseEvent {
	type: ClientEvents.MITGLIED_ACTION;
	action: MemberAction.RAISE;
	valueTo: number;
}

interface MemberActionNoValueEvent {
	type: ClientEvents.MITGLIED_ACTION;
	action: MemberAction.CALL | MemberAction.FOLD | MemberAction.CHECK;
}

interface GameMasterActionControlsSelectedEvent {
	type: ClientEvents.GAME_MASTER_ACTION;
	action: GameMasterAction.CONTROLS_SELECTED;
	member_id: string;
}

interface GameMasterActionPlayQuestionEvent {
	type: ClientEvents.GAME_MASTER_ACTION;
	action: GameMasterAction.PLAY_QUESTION;
	einheit?: string;
	question: string;
	hinweis_1: string;
	hinweis_2: string;
	answer: string;
}

interface GameMasterActionUpdateMemberAction {
	type: ClientEvents.GAME_MASTER_ACTION;
	action: GameMasterAction.UPDATE_MEMBER;
	memberId: string;
	chips?: number;
	einsatz?: number;
}

interface GameMasterActionStartGameAction {
	type: ClientEvents.GAME_MASTER_ACTION;
	action: GameMasterAction.START_GAME;
}

interface GameMasterActionWonGame {
	type: ClientEvents.GAME_MASTER_ACTION;
	action: GameMasterAction.WON_GAME;
}

interface GameMasterChangePhase {
	type: ClientEvents.GAME_MASTER_ACTION;
	action: GameMasterAction.CHANGE_PHASE;
	phase: FragenPhase;
}

interface GameMasterAnnounceWinner {
	type: ClientEvents.GAME_MASTER_ACTION;
	action: GameMasterAction.ANNOUNCE_WINNER;
}

interface GameMasterAutomaticPhaseChanging {
	type: ClientEvents.GAME_MASTER_ACTION;
	action: GameMasterAction.CHANGE_AUTOMATIC_PHASE_CHANGING;
	activated: boolean;
}

interface PingMessage {
	type: ClientEvents.SERVER_PING,
	date: number
}

export enum GameMasterAction {
	CONTROLS_SELECTED,
	START_GAME,
	WON_GAME,
	UPDATE_MEMBER,
	PLAY_QUESTION,
	CHANGE_PHASE,
	ANNOUNCE_WINNER,
	CHANGE_AUTOMATIC_PHASE_CHANGING
}

export enum MemberAction {
	CALL,
	RAISE,
	FOLD,
	CHECK
}

type GameMasterActionEvent =
	| GameMasterActionControlsSelectedEvent
	| GameMasterActionUpdateMemberAction
	| GameMasterActionStartGameAction
	| GameMasterActionWonGame
	| GameMasterActionPlayQuestionEvent
	| GameMasterChangePhase
	| GameMasterAnnounceWinner
	| GameMasterAutomaticPhaseChanging;
type MemberActionEvent = MemberActionRaiseEvent | MemberActionNoValueEvent;

export type ClientMessage =
	| GameMasterActionEvent
	| MemberActionEvent
	| SchaetzungAbgegebenEvent
	| ConnectionSuccessEvent
	| MemberLoginEvent
	| MemberLeftEvent
	| GameMasterLoginEvent
	| PingMessage;
