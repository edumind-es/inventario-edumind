<script lang="ts">
	import DeviceForm from '$lib/components/DeviceForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Nuevo equipo · Inventario EDUmind</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<nav class="mb-4 text-sm text-slate-500">
		<a href="/devices" class="hover:underline">Equipos</a> · <span>Nuevo equipo</span>
	</nav>
	<h1 class="mb-6 text-2xl font-bold text-slate-900">Nuevo equipo</h1>
	<DeviceForm categories={data.categories} values={form?.values} error={form?.error} submitLabel="Crear equipo" />
</div>
