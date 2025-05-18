import type { GameCode, PlayerId } from '@poker-lib/message/OpaqueTypes.ts';
import type { AppSocket } from './App.ts';

export interface BasicManager {
	registerSocket: (socket: AppSocket, uuid: PlayerId) => void;
}
