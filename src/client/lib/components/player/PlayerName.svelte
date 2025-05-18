<script lang="ts">
	export let name: string;
</script>

<div class="content w-full">
	<div class="text-white text-center text-4xl font-bold p-2 text-pretty shadow-sm">
		{name}
	</div>
</div>

<style>
	.content {
		position: absolute;
		left: 50%;
		top: -1%;
		transform: translate(-50%, -50%);
		box-shadow: none;
	}
</style>
