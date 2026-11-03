<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Acceso · Inventario EDUmind</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
	<div class="mb-6 text-center">
		<img
			src="/logo-edumind.png"
			alt="Inventario EDUmind"
			class="mx-auto mb-3 h-24 w-24 rounded-2xl object-contain shadow-sm ring-1 ring-slate-200"
		/>
		<h1 class="text-2xl font-bold text-slate-900">Inventario EDUmind</h1>
		<p class="mt-1 text-slate-600">{data.centerName}</p>
		<p class="text-sm text-slate-500">Inicia sesión para gestionar el inventario del centro.</p>
	</div>

	<form method="POST" class="card space-y-4 p-6">
		{#if form?.error}
			<p class="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{form.error}</p>
		{/if}
		<div>
			<label class="label" for="email">Correo</label>
			<input
				class="input"
				id="email"
				name="email"
				type="email"
				autocomplete="username"
				required
				value={form?.email ?? ''}
			/>
			{#if data.adminHints.length > 0}
				<p class="mt-1 text-xs text-slate-500">
					Administración: {data.adminHints.join(' · ')}
				</p>
			{/if}
		</div>
		<div>
			<label class="label" for="password">Contraseña</label>
			<input class="input" id="password" name="password" type="password" autocomplete="current-password" required />
		</div>
		<button class="btn-primary w-full" type="submit">Entrar</button>
	</form>

	{#if data.canRecover}
		<p class="mt-4 text-center text-sm text-slate-500">
			<a href="/recuperar" class="font-medium text-brand-700 hover:underline">He olvidado la contraseña</a>
		</p>
	{:else}
		<p class="mt-4 text-center text-xs text-slate-400">
			¿Sin acceso? La contraseña se restablece desde el ordenador donde está instalada la aplicación.
		</p>
	{/if}
</main>
