import type { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export interface Player {
	playerId: PlayerId;
	name: string;
	link: string;
	roomCode: GameCode;
	status: MemberStatus;
}
