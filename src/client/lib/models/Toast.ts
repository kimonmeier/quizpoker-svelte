import { MemberAction } from '@poker-lib/message/ClientMessage';

interface ToastModelNoValue {
	toastId: string;
	playerId: string;
	type: ToastType.FOLD | ToastType.CHECK;
}

interface ToastModelWithValue {
	toastId: string;
	playerId: string;
	type: ToastType.RAISE | ToastType.CALL;
	chips: number;
}

export enum ToastType {
	FOLD,
	CHECK,
	RAISE,
	CALL
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
		case MemberAction.FOLD:
			return ToastType.FOLD;
	}
}
