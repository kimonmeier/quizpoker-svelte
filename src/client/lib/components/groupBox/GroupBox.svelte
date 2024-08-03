<script lang="ts">
	let cssClass: string = '';
	export let title: string = '';

	export { cssClass as class };
</script>

<div class="flex flex-col border rounded-xl {cssClass} min-h-[10vh] p-4 mt-2">
	<p class="text-white relative top-[-13px] left-[7.5px] w-fit font-bold text-xl">
		{title}
	</p>
	<div class="w-full">
		<slot />
	</div>	
</div>
