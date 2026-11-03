<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let working = $state(false);
</script>

<svelte:head>
	<title>Sistema · Inventario EDUmind</title>
</svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-slate-900">Sistema</h1>
	<p class="text-slate-600">Modo de funcionamiento, acceso desde móviles y encendido.</p>
</div>

{#if form?.error}
	<p class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{form.error}</p>
{/if}

{#if form?.restarting}
	<div class="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-5">
		<p class="font-semibold text-brand-800">Reiniciando en modo {form.mode === 'red' ? 'red' : 'local'}…</p>
		<p class="mt-1 text-sm text-brand-700">Espera unos segundos y abre esta dirección en este ordenador:</p>
		<a class="mt-2 inline-block font-mono text-brand-800 underline" href={form.url}>{form.url}</a>
	</div>
{:else if form?.shuttingDown}
	<div class="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
		<p class="font-semibold text-slate-800">Apagando el servidor…</p>
		<p class="mt-1 text-sm text-slate-600">
			Para volver a usar la aplicación, abre de nuevo Inventario EDUmind desde su icono.
		</p>
	</div>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
	<section class="card p-6">
		<h2 class="mb-4 font-semibold text-slate-900">Modo de funcionamiento</h2>
		<div class="mb-4 flex items-center gap-3">
			<span class="badge {data.mode === 'red' ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-700'}">
				{data.mode === 'red' ? 'Compartido en la red' : 'Solo este equipo'}
			</span>
		</div>
		<p class="mb-4 text-sm text-slate-600">
			{#if data.mode === 'red'}
				La aplicación es accesible desde móviles y tablets de la misma WiFi del centro.
			{:else}
				La aplicación solo funciona en este ordenador. Actívala en red para usarla desde móviles.
			{/if}
		</p>

		{#if data.supervised}
			<div class="flex flex-wrap gap-2">
				{#if data.mode === 'local'}
					<form
						method="POST"
						action="?/setMode"
						use:enhance={() => {
							working = true;
							return async ({ update }) => {
								await update();
								working = false;
							};
						}}
					>
						<input type="hidden" name="mode" value="red" />
						<button class="btn-primary" type="submit" disabled={working}>Activar modo red</button>
					</form>
				{:else}
					<form method="POST" action="?/setMode" use:enhance>
						<input type="hidden" name="mode" value="local" />
						<button class="btn-secondary" type="submit">Volver a solo este equipo</button>
					</form>
				{/if}
				<form method="POST" action="?/shutdown" use:enhance>
					<button class="btn-danger" type="submit">Apagar el servidor</button>
				</form>
			</div>
			<p class="mt-3 text-xs text-slate-400">Al cambiar de modo, el servidor se reinicia solo (unos segundos).</p>
		{:else}
			<p class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
				El cambio de modo y el apagado están disponibles en la <strong>app instalada</strong> (con su icono).
				En modo desarrollo se controla desde la terminal.
			</p>
		{/if}
	</section>

	<section class="card p-6">
		<h2 class="mb-4 font-semibold text-slate-900">Acceso desde móviles y tablets</h2>
		{#if data.mode === 'red' && data.qrSvg}
			<div class="flex flex-col items-center text-center">
				<div class="w-44">{@html data.qrSvg}</div>
				<p class="mt-3 text-sm text-slate-600">Escanea con la cámara del móvil (misma WiFi):</p>
				<a class="font-mono text-brand-700 hover:underline" href={data.networkUrl}>{data.networkUrl}</a>
				<p class="mt-3 max-w-xs text-xs text-slate-400">
					La primera vez el móvil avisará del certificado: pulsa «Avanzado» → «Continuar». Luego,
					«Añadir a pantalla de inicio» para tenerlo como una app.
				</p>
			</div>
		{:else}
			<div class="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
				Activa el <strong>modo red</strong> para obtener el código QR y la dirección con la que los
				móviles se conectan.
			</div>
		{/if}
	</section>
</div>
