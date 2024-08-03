import type { MemberStatus } from '@poker-lib/enums/MemberStatus';

export interface PlayerModel {
	id: string;
	name: string;
	link: string;
	playerStatus: MemberStatus;
}
