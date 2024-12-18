import type { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export interface Player {
	playerId: PlayerId;
	name: string;
	link: string;
	status: MemberStatus;
}
