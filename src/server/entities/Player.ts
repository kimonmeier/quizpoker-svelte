import type { MemberStatus } from '@poker-lib/enums/MemberStatus.ts';
import type WebSocketClient from '@server/connection/WebSocketClient.ts';

export interface Player {
	client: WebSocketClient;
	name: string;
	link: string;
	status: MemberStatus;
}
