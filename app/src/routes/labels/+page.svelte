<script lang="ts">
	import { labelsPerSheet, getPreset } from '$lib/labels-presets';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Preselecciona el equipo si se llega desde su ficha (/labels?code=…).
	// svelte-ignore state_referenced_locally
	let selected = $state(
		new Set<number>(
			data.preCode ? data.devices.filter((d) => d.code === data.preCode).map((d) => d.id) : []
		)
	);
	let categoryFilter = $state('');
	// svelte-ignore state_referenced_locally
	let preset = $state(data.presets[0].key);

	const visible = $derived(
		categoryFilter ? data.devices.filter((d) => String(d.category_id) === categoryFilter) : data.devices
	);
	const selectedCount = $derived(selected.size);
	const perSheet = $derived(labelsPerSheet(getPreset(preset)));
	const sheets = $derived(Math.ceil(Math.max(selectedCount, 0) / perSheet) || 0);

	function toggle(id: number) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}
	function selectAllVisible() {
		const next = new Set(selected);
		for (const d of visible) next.add(d.id);
		selected = next;
	}
	function selectNone() {
		selected = new Set();
	}
</script>

<svelte:head>
	<title>Etiquetas · Inventario EDUmind</title>
</svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-slate-900">Generador de etiquetas</h1>
	<p class="text-slate-600">
		Etiquetas con QR, código y tipología en formatos APLI normalizados. En lote o individuales.
	</p>
</div>

<form method="POST" action="/labels/pdf" target="_blank" class="grid gap-6 lg:grid-cols-3">
	<section class="card overflow-hidden lg:col-span-2">
		<header class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
			<h2 class="font-semibold text-slate-900">Equipos ({selectedCount} seleccionados)</h2>
			<div class="flex items-center gap-2">
				<select class="input py-1.5" bind:value={categoryFilter} aria-label="Filtrar por categoría">
					<option value="">Todas las categorías</option>
					{#each data.categories as c (c.id)}
						<option value={String(c.id)}>{c.name}</option>
					{/each}
				</select>
				<button type="button" class="btn-secondary py-1.5" onclick={selectAllVisible}>Todos</button>
				<button type="button" class="btn-secondary py-1.5" onclick={selectNone}>Ninguno</button>
			</div>
		</header>
		<div class="max-h-[28rem] overflow-y-auto">
			{#if visible.length === 0}
				<p class="px-5 py-12 text-center text-slate-500">No hay equipos en esta categoría.</p>
			{:else}
				<ul class="divide-y divide-slate-100">
					{#each visible as d (d.id)}
						<li>
							<label class="flex cursor-pointer items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
								<input
									type="checkbox"
									name="id"
									value={d.id}
									checked={selected.has(d.id)}
									onchange={() => toggle(d.id)}
									class="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
								/>
								<span class="font-mono font-semibold text-slate-900">{d.code}</span>
								<span class="text-sm text-slate-500">{d.name || d.model || ''}</span>
								{#if d.category_name}
									<span class="ml-auto text-xs text-slate-400">{d.category_name}</span>
								{/if}
							</label>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>

	<aside class="card h-fit space-y-5 p-5">
		<div>
			<label class="label" for="preset">Formato de etiqueta</label>
			<select class="input" id="preset" name="preset" bind:value={preset}>
				{#each data.presets as p (p.key)}
					<option value={p.key}>{p.ref} — {p.name}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="label" for="start_index">Empezar en la casilla nº</label>
			<input class="input" id="start_index" name="start_index" type="number" min="0" max={perSheet - 1} value="0" />
			<p class="mt-1 text-xs text-slate-500">
				Para reaprovechar una hoja ya empezada (0 = primera casilla). {perSheet} por hoja.
			</p>
		</div>
		<fieldset>
			<legend class="label">Calibración de impresora (mm)</legend>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="text-xs text-slate-500" for="offset_x">Desplaz. X</label>
					<input class="input" id="offset_x" name="offset_x" type="number" step="0.5" value={data.offsets.x} />
				</div>
				<div>
					<label class="text-xs text-slate-500" for="offset_y">Desplaz. Y</label>
					<input class="input" id="offset_y" name="offset_y" type="number" step="0.5" value={data.offsets.y} />
				</div>
			</div>
		</fieldset>
		<div class="space-y-2">
			<label class="flex items-center gap-2 text-sm text-slate-700">
				<input type="checkbox" name="border" class="h-4 w-4 rounded border-slate-300 text-brand-700" />
				Dibujar borde de guía (recorte)
			</label>
			<label class="flex items-center gap-2 text-sm text-slate-700">
				<input type="checkbox" name="center" class="h-4 w-4 rounded border-slate-300 text-brand-700" checked />
				Incluir nombre del centro
			</label>
		</div>
		<div class="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
			{selectedCount} etiqueta(s) · {sheets} hoja(s) A4
		</div>
		<button class="btn-primary w-full" type="submit" disabled={selectedCount === 0}>Generar PDF</button>
		<p class="text-center text-xs text-slate-400">Se abre en una pestaña nueva, listo para imprimir.</p>
	</aside>
</form>
