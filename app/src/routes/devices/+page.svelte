<script lang="ts">
	import StatusBadge, { DEVICE_STATUS_LABEL } from '$lib/components/StatusBadge.svelte';
	import { roleAtLeast } from '$lib/roles';
	import type { DeviceStatus } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const canManage = $derived(roleAtLeast(data.user?.role, 'gestor'));
	const statuses: DeviceStatus[] = ['disponible', 'prestado', 'mantenimiento', 'baja'];
</script>

<svelte:head>
	<title>Equipos · Inventario EDUmind</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-slate-900">Equipos</h1>
		<p class="text-slate-600">{data.devices.length} equipo(s) en el inventario.</p>
	</div>
	<div class="flex gap-2">
		{#if canManage}
			<a class="btn-secondary" href="/labels">Etiquetas</a>
			<a class="btn-primary" href="/devices/new">Nuevo equipo</a>
		{/if}
	</div>
</div>

<form method="GET" class="card mb-4 flex flex-wrap items-end gap-3 p-4">
	<div class="min-w-[220px] flex-1">
		<label class="label" for="q">Buscar</label>
		<input
			class="input"
			id="q"
			name="q"
			value={data.filters.search}
			placeholder="Código, nombre, marca, modelo o nº de serie"
		/>
	</div>
	<div>
		<label class="label" for="status">Estado</label>
		<select class="input" id="status" name="status" value={data.filters.status}>
			<option value="">Todos</option>
			{#each statuses as s (s)}
				<option value={s}>{DEVICE_STATUS_LABEL[s]}</option>
			{/each}
		</select>
	</div>
	<div>
		<label class="label" for="cat">Categoría</label>
		<select class="input" id="cat" name="cat" value={String(data.filters.categoryId)}>
			<option value="">Todas</option>
			{#each data.categories as c (c.id)}
				<option value={c.id}>{c.name}</option>
			{/each}
		</select>
	</div>
	<div class="flex gap-2">
		<button class="btn-primary" type="submit">Filtrar</button>
		<a class="btn-secondary" href="/devices">Limpiar</a>
	</div>
</form>

<div class="card overflow-hidden">
	{#if data.devices.length === 0}
		<div class="px-5 py-16 text-center">
			<p class="text-slate-500">No hay equipos que coincidan.</p>
			{#if canManage}
				<a class="btn-primary mt-4" href="/devices/new">Añadir el primer equipo</a>
			{/if}
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
					<tr>
						<th class="px-4 py-3 font-semibold">Código</th>
						<th class="px-4 py-3 font-semibold">Equipo</th>
						<th class="px-4 py-3 font-semibold">Categoría</th>
						<th class="px-4 py-3 font-semibold">Ubicación</th>
						<th class="px-4 py-3 font-semibold">Estado</th>
						<th class="px-4 py-3 font-semibold">En poder de</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.devices as d (d.id)}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3">
								<a href="/devices/{d.id}" class="font-mono font-semibold text-brand-700 hover:underline">{d.code}</a>
							</td>
							<td class="px-4 py-3">
								<a href="/devices/{d.id}" class="text-slate-900 hover:underline">{d.name || d.model || '—'}</a>
								{#if d.brand}
									<span class="block text-xs text-slate-400">{d.brand}</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								{#if d.category_name}
									<span class="badge" style="background:{d.category_color}1a; color:{d.category_color}">
										{d.category_name}
									</span>
								{:else}
									<span class="text-slate-400">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-slate-600">{d.location || '—'}</td>
							<td class="px-4 py-3"><StatusBadge status={d.status} /></td>
							<td class="px-4 py-3 text-slate-600">{d.holder_name || '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
