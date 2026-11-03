<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Error {page.status} · Inventario EDUmind</title>
</svelte:head>

<div class="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
	<p class="text-5xl font-bold text-slate-300">{page.status}</p>
	<h1 class="mt-3 text-xl font-semibold text-slate-900">{page.error?.message ?? 'Ha ocurrido un error'}</h1>
	<a class="btn-secondary mt-6" href="/">Volver al panel</a>
</div>
