<script lang="ts">
	import UserForm from '$lib/components/UserForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Nuevo usuario · Inventario EDUmind</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<nav class="mb-4 text-sm text-slate-500">
		<a href="/users" class="hover:underline">Usuarios</a> · <span>Nuevo</span>
	</nav>
	<h1 class="mb-6 text-2xl font-bold text-slate-900">Nuevo usuario</h1>
	<UserForm values={form?.values} error={form?.error} submitLabel="Crear usuario" />
</div>
