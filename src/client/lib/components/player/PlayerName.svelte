<script lang="ts">
	export let name: string;
</script>

<div class="content w-full">
	<div class="text-white text-center text-4xl font-bold p-2 italic font-serif text-pretty">
		{name}
	</div>
</div>

<style>
	.content {
		position: absolute;
		left: 50%;
		top: -1%;
		transform: translate(-50%, -50%);
		text-shadow: black 5px 5px;
	}
</style>
