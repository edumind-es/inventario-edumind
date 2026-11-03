<script lang="ts">
	import DeviceForm from '$lib/components/DeviceForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Editar {data.device.code} · Inventario EDUmind</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<nav class="mb-4 text-sm text-slate-500">
		<a href="/devices" class="hover:underline">Equipos</a> ·
		<a href="/devices/{data.device.id}" class="font-mono hover:underline">{data.device.code}</a> ·
		<span>Editar</span>
	</nav>
	<h1 class="mb-6 text-2xl font-bold text-slate-900">Editar equipo</h1>
	<DeviceForm
		categories={data.categories}
		device={data.device}
		values={form?.values}
		error={form?.error}
		submitLabel="Guardar cambios"
	/>
</div>
