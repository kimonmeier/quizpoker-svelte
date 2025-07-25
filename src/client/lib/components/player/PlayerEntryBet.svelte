<script lang="ts">
	import type { ChipsModel } from '@client/lib/models/Chips';
	import Icon from '@iconify/svelte';
	import { MemberStatus } from '@poker-lib/enums/MemberStatus';

	export let chipEntry: ChipsModel | undefined;
	export let memberStatus: MemberStatus;
</script>

<div
	class="flex flex-row rounded-lg h-full text-white {memberStatus == MemberStatus.ON
		? 'bg-pink-500'
		: 'bg-red-500'} items-center pr-2 justify-center shadow-md shadow-slate-700"
>
	<div class="flex-grow text-center">
		{#if memberStatus == MemberStatus.ON}
			{chipEntry?.bet?.toLocaleString() ?? 0}
		{:else}
			Folded
		{/if}
	</div>
	<Icon icon="mdi:poker-chip" />
</div>
