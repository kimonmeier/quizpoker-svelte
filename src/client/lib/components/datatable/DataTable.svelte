<script lang="ts" generics="T extends { id: string }">
	import { ConfigType, type DataTableConfig } from './DataTable.types';

	export let configs: DataTableConfig<T>[] = [];
	export let data: T[] = [];

	let newData: T = { id: crypto.randomUUID().toString() } as T;

	function addRow() {
		data = [...data, newData as T];

		newData = { id: crypto.randomUUID().toString() } as T;
	}

	function deleteRow(rowToBeDeleted: T) {
		data = data.filter((row) => row.id != rowToBeDeleted.id);
	}
</script>

<table>
	<tr>
		{#each configs as column}
			<th>{column.title}</th>
		{/each}
	</tr>

	{#each data as row}
		<tr>
			{#each configs as column}
				{#if column.type == ConfigType.Data}
					<td contenteditable="true" class={column.class} bind:innerHTML={row[column.column]} />
				{:else}
					<button class="{column.class} rounded-3xl m-2" on:click={() => column.onClick(row)}
						>{column.value}</button
					>
				{/if}
			{/each}
			<button on:click={() => deleteRow(row)}>X</button>
		</tr>
	{/each}
	<tr style="color: grey">
		{#each configs as column}
			{#if column.type == ConfigType.Data}
				<td contenteditable="true" class={column.class} bind:innerHTML={newData[column.column]} />
			{:else}
				<button class="{column.class} rounded-3xl m-2">{column.value}</button>
			{/if}
		{/each}
		<button on:click={addRow}>add</button>
	</tr>
</table>
