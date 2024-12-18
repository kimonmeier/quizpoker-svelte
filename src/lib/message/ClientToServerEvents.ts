import type { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { PlayerId } from './OpaqueTypes.ts';

export interface ClientToServerEvents {
	/// This event describes when an client tries to connect to the server
	PLAYER_CONNECTING: (
		name: string,
		link: string,
		callback: (playerId: PlayerId | undefined) => void
	) => void;

	GAME_MASTER_CONNECTING: (
		link: string,
		callback: (playerId: PlayerId | undefined) => void
	) => void;

	SCHAETZUNG_ABGEBEN: (schaetzung: number) => void;

	RAISE: (bet: number) => void;

	CALL: () => void;

	FOLD: () => void;

	CHECK: () => void;

	GIVE_PLAYER_CONTROLS: (playerId: PlayerId) => void;

	PLAY_QUESTION: (
		question: string,
		hinweis_1: string,
		hinweis_2: string,
		answer: string,
		einheit?: string
	) => void;

	UPDATE_PLAYER_CHIPS: (playerId: PlayerId, chips: number) => void;

	UPDATE_PLAYER_EINSATZ: (playerId: PlayerId, einsatz: number) => void;

	START_GAME: () => void;

	DRAW_WINNER: () => void;

	CHANGE_PHASE: (phase: FragenPhase) => void;

	CHANGE_AUTOMATIC_PHASE_CHANGING: (activated: boolean) => void;
}
