import type { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { GameCode, PlayerId } from './OpaqueTypes.ts';

export interface ClientToServerEvents {
	/// This event describes when an client tries to connect to the server
	PLAYER_CONNECTING: (
		name: string,
		link: string,
		gameCode: GameCode,
		callback: (playerId: PlayerId | undefined) => void
	) => void;

	GAME_MASTER_CONNECTING: (
		link: string,
		callback: (playerId: PlayerId | undefined, gameCode: GameCode) => void
	) => void;

	SCHAETZUNG_ABGEBEN: (schaetzung: number) => void;

	RAISE: (bet: number) => void;

	CALL: () => void;

	FOLD: () => void;

	CHECK: () => void;

	GIVE_PLAYER_CONTROLS: (roomCode: GameCode, playerId: PlayerId) => void;

	PLAY_QUESTION: (
		roomCode: GameCode,
		question: string,
		hinweis_1: string,
		hinweis_2: string,
		answer: string,
		einheit?: string
	) => void;

	UPDATE_PLAYER_CHIPS: (roomCode: GameCode, playerId: PlayerId, chips: number) => void;

	UPDATE_PLAYER_EINSATZ: (roomCode: GameCode, playerId: PlayerId, einsatz: number) => void;

	START_GAME: (roomCode: GameCode) => void;

	DRAW_WINNER: (roomCode: GameCode) => void;

	CHANGE_PHASE: (roomCode: GameCode, phase: FragenPhase) => void;

	CHANGE_AUTOMATIC_PHASE_CHANGING: (roomCode: GameCode, activated: boolean) => void;

	REPORT_VISIBILITY_CHANGED: (visible: boolean) => void;
}
