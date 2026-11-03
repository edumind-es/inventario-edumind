<script lang="ts">
	import type { Category, Device } from '$lib/types';

	let {
		categories,
		device = null,
		values = null,
		error = null,
		submitLabel = 'Guardar'
	}: {
		categories: Category[];
		device?: Device | null;
		values?: Record<string, string> | null;
		error?: string | null;
		submitLabel?: string;
	} = $props();

	// Valor del campo: lo que envió el formulario (si falló), si no el equipo, si no el alternativo.
	const v = (k: string, alt = ''): string =>
		values?.[k] ?? (device?.[k as keyof Device] != null ? String(device[k as keyof Device]) : alt);
</script>

<form method="POST" class="card space-y-5 p-6">
	{#if error}
		<p class="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>
	{/if}

	<div class="grid gap-5 sm:grid-cols-2">
		<div>
			<label class="label" for="category_id">Categoría / tipología *</label>
			<select class="input" id="category_id" name="category_id" required>
				<option value="">Selecciona…</option>
				{#each categories as c (c.id)}
					<option value={c.id} selected={String(c.id) === v('category_id')}>{c.name} ({c.code})</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="label" for="code">Código del equipo</label>
			<input
				class="input font-mono"
				id="code"
				name="code"
				value={v('code')}
				placeholder="Se genera automáticamente (ej. POR-0001)"
			/>
			<p class="mt-1 text-xs text-slate-500">Déjalo vacío para autogenerar según la categoría.</p>
		</div>
	</div>

	<div>
		<label class="label" for="name">Nombre / descripción</label>
		<input class="input" id="name" name="name" value={v('name')} placeholder="Portátil aula 3B" />
	</div>

	<div class="grid gap-5 sm:grid-cols-3">
		<div>
			<label class="label" for="brand">Marca</label>
			<input class="input" id="brand" name="brand" value={v('brand')} />
		</div>
		<div>
			<label class="label" for="model">Modelo</label>
			<input class="input" id="model" name="model" value={v('model')} />
		</div>
		<div>
			<label class="label" for="serial">Nº de serie</label>
			<input class="input" id="serial" name="serial" value={v('serial')} />
		</div>
	</div>

	<div class="grid gap-5 sm:grid-cols-2">
		<div>
			<label class="label" for="location">Ubicación habitual</label>
			<input class="input" id="location" name="location" value={v('location')} placeholder="Aula TIC" />
		</div>
		<div>
			<label class="label" for="status">Estado</label>
			<select class="input" id="status" name="status">
				{#each ['disponible', 'mantenimiento', 'baja'] as s (s)}
					<option value={s} selected={v('status', 'disponible') === s}>
						{s === 'disponible' ? 'Disponible' : s === 'mantenimiento' ? 'Mantenimiento' : 'De baja'}
					</option>
				{/each}
			</select>
			<p class="mt-1 text-xs text-slate-500">El estado «Prestado» se gestiona desde préstamos.</p>
		</div>
	</div>

	<div>
		<label class="label" for="notes">Notas</label>
		<textarea class="input" id="notes" name="notes" rows="3">{v('notes')}</textarea>
	</div>

	<div class="flex gap-2">
		<button class="btn-primary" type="submit">{submitLabel}</button>
		<a class="btn-secondary" href="/devices">Cancelar</a>
	</div>
</form>
