<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { parseScan } from '$lib/qr';
	import type { PageData } from './$types';
	import type { IScannerControls } from '@zxing/browser';

	let { data }: { data: PageData } = $props();

	let manual = $state('');
	let cameraOn = $state(false);
	let cameraError = $state<string | null>(null);
	let videoEl = $state<HTMLVideoElement | null>(null);
	let controls: IScannerControls | null = null;

	/** Normaliza lo leído y pide al servidor que busque el equipo. */
	function resolveCode(raw: string) {
		const parsed = parseScan(raw);
		const code = parsed?.code ?? raw.trim();
		if (code) goto(`/scan?code=${encodeURIComponent(code)}`, { invalidateAll: true });
	}

	function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (manual.trim()) resolveCode(manual);
	}

	/* ------------------------------ Cámara ------------------------------ */
	// ZXing se carga solo al pulsar «Activar cámara» (es pesado).
	async function startCamera() {
		cameraError = null;
		try {
			const { BrowserMultiFormatReader } = await import('@zxing/browser');
			const reader = new BrowserMultiFormatReader();
			cameraOn = true;
			await Promise.resolve(); // deja que Svelte monte el <video>
			controls = await reader.decodeFromVideoDevice(undefined, videoEl!, (result) => {
				if (result) {
					stopCamera();
					resolveCode(result.getText());
				}
			});
		} catch (e) {
			cameraError =
				'No se pudo acceder a la cámara. Comprueba los permisos del navegador o usa el lector USB / la entrada manual.';
			cameraOn = false;
			console.error(e);
		}
	}

	function stopCamera() {
		controls?.stop();
		controls = null;
		cameraOn = false;
	}

	/* --------------------------- Lector USB --------------------------- */
	// Un lector de códigos USB «teclea» el código muy rápido y termina en Enter.
	let usbBuffer = '';
	let usbTimer: ReturnType<typeof setTimeout> | null = null;

	function onKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
		if (e.key === 'Enter') {
			if (usbBuffer.length >= 3) resolveCode(usbBuffer);
			usbBuffer = '';
			return;
		}
		if (e.key.length === 1) {
			usbBuffer += e.key;
			if (usbTimer) clearTimeout(usbTimer);
			usbTimer = setTimeout(() => (usbBuffer = ''), 300);
		}
	}

	onMount(() => {
		window.addEventListener('keydown', onKeydown);
	});
	onDestroy(() => {
		if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);
		stopCamera();
	});
</script>

<svelte:head>
	<title>Escanear · Inventario EDUmind</title>
</svelte:head>

<div class="mx-auto max-w-xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-slate-900">Escanear equipo</h1>
		<p class="text-slate-600">Escanea el QR con la cámara o el lector USB, o escribe el código del equipo.</p>
	</div>

	{#if data.notFoundCode}
		<p class="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="alert">
			No se encontró ningún equipo con el código <strong class="font-mono">{data.notFoundCode}</strong>.
		</p>
	{/if}

	<section class="card p-6">
		<form class="flex gap-2" onsubmit={onSubmit}>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="input font-mono"
				bind:value={manual}
				placeholder="Código del equipo (ej. POR-0001)"
				aria-label="Código del equipo"
				autofocus
			/>
			<button class="btn-primary shrink-0" type="submit">Buscar</button>
		</form>
		<p class="mt-2 text-xs text-slate-500">Un lector USB también funciona aquí: apunta y dispara, se rellena solo.</p>
	</section>

	<section class="card mt-4 p-6">
		<div class="flex items-center justify-between">
			<h2 class="font-semibold text-slate-900">Cámara</h2>
			{#if cameraOn}
				<button class="btn-secondary" onclick={stopCamera}>Detener</button>
			{:else}
				<button class="btn-primary" onclick={startCamera}>Activar cámara</button>
			{/if}
		</div>

		{#if cameraError}
			<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{cameraError}</p>
		{/if}

		{#if cameraOn}
			<div class="mt-4 overflow-hidden rounded-xl bg-black">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video bind:this={videoEl} class="aspect-video w-full object-cover" autoplay playsinline></video>
			</div>
			<p class="mt-2 text-center text-sm text-slate-500">Apunta al código QR de la etiqueta…</p>
		{:else}
			<div
				class="mt-4 flex aspect-video items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400"
			>
				<span>La cámara aparecerá aquí</span>
			</div>
		{/if}
	</section>
</div>
