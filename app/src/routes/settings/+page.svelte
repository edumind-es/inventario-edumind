<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// svelte-ignore state_referenced_locally
	let logoPreview = $state(data.settings.center_logo ?? '');
	let logoData = $state('');
	let logoError = $state<string | null>(null);

	// El logo se lee en el navegador y viaja como data URL en un campo oculto.
	function onLogoChange(e: Event) {
		logoError = null;
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (!/image\/(png|jpeg|jpg)/.test(file.type)) {
			logoError = 'Formato no válido. Usa PNG o JPG.';
			return;
		}
		if (file.size > 700 * 1024) {
			logoError = 'Imagen demasiado grande (máx. 700 KB).';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			logoData = String(reader.result ?? '');
			logoPreview = logoData;
		};
		reader.readAsDataURL(file);
	}
</script>

<svelte:head>
	<title>Ajustes · Inventario EDUmind</title>
</svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-slate-900">Ajustes</h1>
	<p class="text-slate-600">Configuración del centro, préstamos, etiquetas y categorías.</p>
</div>

{#if form?.success}
	<p class="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
		{form.success}
	</p>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
	<section class="card p-6">
		<h2 class="mb-4 font-semibold text-slate-900">Centro y préstamos</h2>
		<form method="POST" action="?/saveGeneral" class="space-y-4" use:enhance>
			<div>
				<label class="label" for="center_name">Nombre del centro</label>
				<input class="input" id="center_name" name="center_name" value={data.settings.center_name} />
			</div>
			<div>
				<label class="label" for="center_code">Código de centro (opcional)</label>
				<input class="input" id="center_code" name="center_code" value={data.settings.center_code} />
			</div>
			<div>
				<label class="label" for="loan_default_days">Días de préstamo por defecto</label>
				<input
					class="input"
					id="loan_default_days"
					name="loan_default_days"
					type="number"
					min="1"
					value={data.settings.loan_default_days}
				/>
			</div>
			<fieldset>
				<legend class="label">Calibración de etiquetas por defecto (mm)</legend>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="text-xs text-slate-500" for="label_offset_x_mm">Desplaz. X</label>
						<input
							class="input"
							id="label_offset_x_mm"
							name="label_offset_x_mm"
							type="number"
							step="0.5"
							value={data.settings.label_offset_x_mm}
						/>
					</div>
					<div>
						<label class="text-xs text-slate-500" for="label_offset_y_mm">Desplaz. Y</label>
						<input
							class="input"
							id="label_offset_y_mm"
							name="label_offset_y_mm"
							type="number"
							step="0.5"
							value={data.settings.label_offset_y_mm}
						/>
					</div>
				</div>
			</fieldset>
			<button class="btn-primary" type="submit">Guardar ajustes</button>
		</form>
	</section>

	<section class="card p-6">
		<h2 class="mb-1 font-semibold text-slate-900">Categorías / tipologías</h2>
		<p class="mb-4 text-sm text-slate-500">
			El código (2–5 letras) genera los IDs de equipo: <span class="font-mono">POR-0001</span>.
		</p>
		{#if form?.catError}
			<p class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{form.catError}</p>
		{/if}
		<ul class="mb-4 divide-y divide-slate-100">
			{#each data.categories as c (c.id)}
				<li class="flex items-center gap-3 py-2">
					<span class="h-4 w-4 shrink-0 rounded-full" style="background:{c.color}"></span>
					<span class="font-mono text-sm font-semibold text-slate-700">{c.code}</span>
					<span class="text-slate-800">{c.name}</span>
					<span class="ml-auto text-xs text-slate-400">{c.device_count} equipo(s)</span>
					{#if c.device_count === 0}
						<form method="POST" action="?/deleteCategory" use:enhance>
							<input type="hidden" name="id" value={c.id} />
							<button class="text-xs font-medium text-red-600 hover:underline" type="submit">Borrar</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
		<form
			method="POST"
			action="?/addCategory"
			class="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-4"
			use:enhance
		>
			<div class="w-20">
				<label class="label" for="cat_code">Código</label>
				<input class="input font-mono uppercase" id="cat_code" name="code" placeholder="POR" maxlength="5" required />
			</div>
			<div class="min-w-[120px] flex-1">
				<label class="label" for="cat_name">Nombre</label>
				<input class="input" id="cat_name" name="name" placeholder="Portátil" required />
			</div>
			<div>
				<label class="label" for="cat_color">Color</label>
				<input class="input h-[42px] w-14 p-1" id="cat_color" name="color" type="color" value="#0f766e" />
			</div>
			<button class="btn-primary" type="submit">Añadir</button>
		</form>
	</section>
</div>

<section class="card mt-6 p-6">
	<h2 class="mb-1 font-semibold text-slate-900">Identidad del centro y protección de datos</h2>
	<p class="mb-4 text-sm text-slate-500">
		El logo aparece en la cabecera de las actas de entrega/recogida y el texto de protección de
		datos, al pie.
	</p>
	{#if form?.brandError}
		<p class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{form.brandError}</p>
	{/if}
	<form method="POST" action="?/saveBranding" class="grid gap-6 lg:grid-cols-[220px_1fr]" use:enhance>
		<div>
			<span class="label">Logo del centro</span>
			<div
				class="flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2"
			>
				{#if logoPreview}
					<img src={logoPreview} alt="Logo del centro" class="max-h-24 max-w-full object-contain" />
				{:else}
					<span class="text-xs text-slate-400">Sin logo</span>
				{/if}
			</div>
			<div class="mt-2 flex items-center gap-2">
				<label class="btn-secondary cursor-pointer text-xs">
					Elegir imagen…
					<input type="file" accept="image/png,image/jpeg" class="hidden" onchange={onLogoChange} />
				</label>
				{#if data.settings.center_logo}
					<button class="text-xs font-medium text-red-600 hover:underline" type="submit" formaction="?/removeLogo">
						Quitar
					</button>
				{/if}
			</div>
			{#if logoError}
				<p class="mt-1 text-xs text-red-600">{logoError}</p>
			{/if}
			<p class="mt-1 text-xs text-slate-400">PNG o JPG, máx. 700 KB.</p>
			<input type="hidden" name="logo_data" value={logoData} />
		</div>
		<div>
			<label class="label" for="lopd_text">Cláusula de protección de datos (LOPD/RGPD)</label>
			<textarea class="input text-sm" id="lopd_text" name="lopd_text" rows="7">{data.settings.lopd_text}</textarea>
			<div class="mt-3">
				<button class="btn-primary" type="submit">Guardar identidad</button>
			</div>
		</div>
	</form>
</section>

<section class="card mt-6 p-6">
	<h2 class="mb-1 font-semibold text-slate-900">Copia de seguridad y datos</h2>
	<p class="mb-4 text-sm text-slate-500">
		Descarga una copia de toda la base de datos (equipos, préstamos, usuarios y ajustes).
		Guárdala en lugar seguro; sirve para restaurar o migrar de equipo.
	</p>
	<a class="btn-primary" href="/settings/backup" download>Descargar copia de seguridad</a>
	<dl class="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
		<div class="flex justify-between border-t border-slate-100 pt-2">
			<dt class="text-slate-500">Versión de la app</dt>
			<dd class="font-medium text-slate-800">{data.version || '—'}</dd>
		</div>
		<div class="flex justify-between border-t border-slate-100 pt-2">
			<dt class="text-slate-500">Carpeta de datos</dt>
			<dd class="max-w-[60%] truncate font-mono text-xs text-slate-600" title={data.dataDir}>{data.dataDir}</dd>
		</div>
	</dl>
	<p class="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
		Los datos se guardan <strong>fuera</strong> de la carpeta de la aplicación, así que al
		instalar una versión nueva <strong>no se pierden</strong>. Para restaurar una copia,
		reemplaza el archivo <span class="font-mono">inventario.db</span> de esa carpeta (con la app
		cerrada).
	</p>
</section>
