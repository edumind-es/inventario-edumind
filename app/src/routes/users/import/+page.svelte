<script lang="ts">
	import { enhance } from '$app/forms';
	import Papa from 'papaparse';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let csv = $state('');
	let preview = $state<string[][]>([]);
	let previewHeaders = $state<string[]>([]);
	let parseError = $state<string | null>(null);

	const EXAMPLE = `nombre,email,identificador,rol
Ana García,ana.garcia@centro.edu,12345678A,gestor
Luis Pérez,luis.perez@centro.edu,,consulta
Aula 5º B,,AULA-5B,consulta`;

	/** Previsualización local (hasta 20 filas); la importación real la hace el servidor. */
	function updatePreview() {
		parseError = null;
		preview = [];
		previewHeaders = [];
		if (!csv.trim()) return;
		const res = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
		if (res.errors.length) {
			parseError = res.errors[0].message;
			return;
		}
		const rows = res.data;
		if (rows.length) {
			previewHeaders = rows[0];
			preview = rows.slice(1, 21);
		}
	}

	function onFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			csv = String(reader.result ?? '');
			updatePreview();
		};
		reader.readAsText(file);
	}

	function loadExample() {
		csv = EXAMPLE;
		updatePreview();
	}
</script>

<svelte:head>
	<title>Importar usuarios · Inventario EDUmind</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<nav class="mb-4 text-sm text-slate-500">
		<a href="/users" class="hover:underline">Usuarios</a> · <span>Importar CSV</span>
	</nav>
	<h1 class="mb-2 text-2xl font-bold text-slate-900">Volcado de usuarios (CSV)</h1>
	<p class="mb-6 text-slate-600">
		Sube o pega un CSV. Columnas admitidas: <code class="rounded bg-slate-100 px-1">nombre</code>
		(obligatoria), <code class="rounded bg-slate-100 px-1">email</code>,
		<code class="rounded bg-slate-100 px-1">identificador</code>,
		<code class="rounded bg-slate-100 px-1">rol</code>. Si el email ya existe, se actualiza.
	</p>

	{#if form?.error}
		<p class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
			{form.success} <a href="/users" class="underline">Ver usuarios</a>
		</p>
	{/if}

	<form method="POST" class="card space-y-4 p-6" use:enhance>
		<div class="flex flex-wrap items-center gap-3">
			<label class="btn-secondary cursor-pointer">
				Subir archivo…
				<input type="file" accept=".csv,text/csv" class="hidden" onchange={onFile} />
			</label>
			<button type="button" class="btn-secondary" onclick={loadExample}>Cargar ejemplo</button>
		</div>
		<div>
			<label class="label" for="csv">Contenido CSV</label>
			<textarea
				class="input font-mono text-xs"
				id="csv"
				name="csv"
				rows="8"
				bind:value={csv}
				oninput={updatePreview}
				placeholder="nombre,email,identificador,rol&#10;Ana García,ana@centro.edu,12345678A,gestor"
			></textarea>
		</div>

		{#if parseError}
			<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{parseError}</p>
		{/if}

		{#if preview.length > 0}
			<div>
				<p class="mb-2 text-sm font-medium text-slate-700">Previsualización ({preview.length} fila(s) de muestra)</p>
				<div class="overflow-x-auto rounded-lg border border-slate-200">
					<table class="w-full text-left text-xs">
						<thead class="bg-slate-50 text-slate-500">
							<tr>
								{#each previewHeaders as h, i (i)}
									<th class="px-3 py-2 font-semibold">{h}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each preview as row, i (i)}
								<tr>
									{#each row as cell, j (j)}
										<td class="px-3 py-1.5 text-slate-700">{cell}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<div class="flex gap-2">
			<button class="btn-primary" type="submit" disabled={!csv.trim()}>Importar usuarios</button>
			<a class="btn-secondary" href="/users">Cancelar</a>
		</div>
	</form>
</div>
