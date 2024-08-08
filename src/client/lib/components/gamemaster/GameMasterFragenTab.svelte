<script lang="ts">
	import { gameMasterFrage } from '@client/lib/stores/GameMasterStore';
	import DataTable from '../datatable/DataTable.svelte';
	import { ConfigType, type DataTableConfig } from '../datatable/DataTable.types';
	import type { Frage } from '@client/lib/models/Frage';
	import { App } from '@client/lib/services/GameManager';
	import { ClientEvents } from '@poker-lib/enums/ClientEvents';
	import { GameMasterAction } from '@poker-lib/message/ClientMessage';

	const config: DataTableConfig<Frage>[] = [
		{
			column: 'frage',
			type: ConfigType.Data,
			title: 'Frage'
		},
		{
			column: 'einheit',
			type: ConfigType.Data,
			title: 'Einheit',
			class: 'w-12'
		},
		{
			column: 'hinweis_1',
			type: ConfigType.Data,
			title: 'Hinweis 1'
		},
		{
			column: 'hinweis_2',
			type: ConfigType.Data,
			title: 'Hinweis 2'
		},
		{
			column: 'answer',
			type: ConfigType.Data,
			title: 'Antwort'
		},
		{
			type: ConfigType.Button,
			onClick: (frage: Frage) => {
				if (!frage.answer) {
					throw new Error('Antwort fehlt');
				}

				if (!frage.hinweis_1) {
					throw new Error('Hinweis 1 fehlt');
				}

				if (!frage.hinweis_2) {
					throw new Error('Hinweis 1 fehlt');
				}

				App.getInstance().sendMessage({
					type: ClientEvents.GAME_MASTER_ACTION,
					action: GameMasterAction.PLAY_QUESTION,
					question: frage.frage,
					einheit: frage.einheit,
					answer: frage.answer,
					hinweis_1: frage.hinweis_1,
					hinweis_2: frage.hinweis_2
				});
			},
			title: 'Auswahl',
			value: 'Spielen'
		}
	];
</script>

<div class="w-full flex flex-row">
	<div class="flex gap-5">
		<button
			class="bg-green-400 border-black rounded-3xl p-3"
			on:click={() => navigator.clipboard.writeText(JSON.stringify($gameMasterFrage))}
		>
			Exportieren
		</button>
		<button
			class="bg-blue-400 border-black rounded-3xl p-3"
			on:click={() =>
				navigator.clipboard.readText().then((json) => ($gameMasterFrage = JSON.parse(json)))}
		>
			Importieren
		</button>
	</div>
</div>

<DataTable bind:data={$gameMasterFrage} configs={config} />
