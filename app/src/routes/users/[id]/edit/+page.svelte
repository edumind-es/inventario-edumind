<script lang="ts">
	import UserForm from '$lib/components/UserForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Editar {data.editUser.name} · Inventario EDUmind</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<nav class="mb-4 text-sm text-slate-500">
		<a href="/users" class="hover:underline">Usuarios</a> · <span>{data.editUser.name}</span>
	</nav>
	<h1 class="mb-6 text-2xl font-bold text-slate-900">Editar usuario</h1>
	<UserForm user={data.editUser} values={form?.values} error={form?.error} submitLabel="Guardar cambios" />
	<div class="mt-6 flex justify-end">
		<form method="POST" action="?/delete">
			<button class="btn-danger" type="submit">Eliminar usuario</button>
		</form>
	</div>
</div>
