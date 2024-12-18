import type { FragenPhase } from '@poker-lib/enums/FragenPhase.ts';
import type { GamePhase } from '@poker-lib/enums/GamePhase.ts';
import type { MemberAction } from '@poker-lib/enums/MemberAction.ts';
import type { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import type { PlayerId } from './OpaqueTypes.ts';

export interface ServerToClientEvents {
	PLAYER_JOINED: (playerId: PlayerId, name: string, link: string) => void;

	PLAYER_LEFT: (playerId: PlayerId) => void;

	CHIPS_CHANGED: (playerId: PlayerId, chips: number) => void;

	BET_CHANGED: (playerId: PlayerId, bet: number) => void;

	STATUS_CHANGED: (playerId: PlayerId, status: MemberStatus) => void;

	SHOW_TOAST: (playerId: PlayerId, action: MemberAction, value?: number) => void;

	CHANGE_POT: (pot: number) => void;

	DISPLAY_NEXT_QUESTION: (question: string, einheit?: string) => void;

	DISPLAY_NEXT_PHASE: (phase: FragenPhase, value?: string) => void;

	MEMBER_ISSUED_SCHAETZUNG: (playerId: PlayerId, schaetzung: number) => void;

	GIVE_PLAYER_CONTROLS: (playerId: PlayerId, minimumBet: number) => void;

	TAKE_PLAYER_CONTROLS: (playerId: PlayerId) => void;

	GAMEMASTER_LOGIN: (link: string) => void;

	CHANGE_GAME_PHASE: (phase: GamePhase) => void;
}
