import { MemberAction } from '@poker-lib/enums/MemberAction.ts';
import { ToastType } from '@poker-lib/enums/ToastType';
import type { PlayerId } from '@poker-lib/message/OpaqueTypes.ts';

interface ToastModelNoValue {
	toastId: string;
	playerId: PlayerId;
	type: ToastType.FOLD | ToastType.CHECK;
}

interface ToastModelWithValue {
	toastId: string;
	playerId: string;
	type: ToastType.RAISE | ToastType.CALL;
	chips: number;
}

export type ToastModel = ToastModelNoValue | ToastModelWithValue;

export function parseToastType(nemberAction: MemberAction): ToastType {
	switch (nemberAction) {
		case MemberAction.CALL:
			return ToastType.CALL;
		case MemberAction.CHECK:
			return ToastType.CHECK;
		case MemberAction.RAISE:
			return ToastType.RAISE;
		case MemberAction.FOLDED:
			return ToastType.FOLD;
	}
}
