<script lang="ts">
	import type { Schaetzung } from '@client/lib/models/Schaetzung';

	let cssClass = '';
	export { cssClass as class };
	export let schaetzung: Schaetzung | undefined;
</script>

<div
	class="{cssClass} bg-blue-400 h-full flex rounded-lg text-center justify-center items-center shadow-sm shadow-black"
>
	{schaetzung?.schaetzung ?? 'Schätzung'}
</div>
