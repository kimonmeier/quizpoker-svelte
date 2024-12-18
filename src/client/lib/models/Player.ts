import type { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

export interface PlayerModel {
	id: PlayerId;
	name: string;
	link: string;
	playerStatus: MemberStatus;
	isOnPage: boolean;
}
