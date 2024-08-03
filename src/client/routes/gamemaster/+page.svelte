<script lang="ts">
	import GameMasterFragenTab from '@client/lib/components/gamemaster/GameMasterFragenTab.svelte';
	import GameMasterGameTab from '@client/lib/components/gamemaster/GameMasterGameTab.svelte';
	import GameMasterPlayerTab from '@client/lib/components/gamemaster/GameMasterPlayerTab.svelte';
	import Tabs from '@client/lib/components/tabs/Tabs.svelte';
	import type { TabInfo } from '@client/lib/components/tabs/Tabs.types';
	import { GameMasterTabPages } from '@client/lib/models/GameMasterTabs';

	let tabs: TabInfo<GameMasterTabPages>[] = [
		{
			label: 'Spieler',
			value: GameMasterTabPages.Player,
			component: GameMasterPlayerTab
		},
		{
			label: 'Fragen',
			value: GameMasterTabPages.Fragen,
			component: GameMasterFragenTab
		},
		{
			label: 'Spiel',
			value: GameMasterTabPages.Game,
			component: GameMasterGameTab
		}
	];
</script>

<Tabs items={tabs} activeTabValue={GameMasterTabPages.Player}></Tabs>
