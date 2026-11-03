<script lang="ts">
	import { enhance } from '$app/forms';
	import { ROLE_LABEL, type Role } from '$lib/roles';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const roleStyle: Record<Role, string> = {
		admin: 'bg-purple-100 text-purple-800',
		gestor: 'bg-brand-100 text-brand-800',
		consulta: 'bg-slate-100 text-slate-600'
	};
</script>

<svelte:head>
	<title>Usuarios · Inventario EDUmind</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-slate-900">Usuarios</h1>
		<p class="text-slate-600">{data.users.length} usuario(s). Gestión de roles y acceso.</p>
	</div>
	<div class="flex gap-2">
		<a class="btn-secondary" href="/users/import">Importar CSV</a>
		<a class="btn-primary" href="/users/new">Nuevo usuario</a>
	</div>
</div>

{#if form?.error}
	<p class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{form.error}</p>
{/if}

<div class="card overflow-hidden">
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
				<tr>
					<th class="px-4 py-3 font-semibold">Nombre</th>
					<th class="px-4 py-3 font-semibold">Correo</th>
					<th class="px-4 py-3 font-semibold">Rol</th>
					<th class="px-4 py-3 font-semibold">Acceso</th>
					<th class="px-4 py-3 font-semibold">Estado</th>
					<th class="px-4 py-3 text-right font-semibold">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#each data.users as u (u.id)}
					<tr class="hover:bg-slate-50 {u.active ? '' : 'opacity-50'}">
						<td class="px-4 py-3">
							<a href="/users/{u.id}/edit" class="font-medium text-slate-900 hover:underline">{u.name}</a>
							{#if u.identifier}
								<span class="block text-xs text-slate-400">{u.identifier}</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-slate-600">{u.email || '—'}</td>
						<td class="px-4 py-3"><span class="badge {roleStyle[u.role]}">{ROLE_LABEL[u.role]}</span></td>
						<td class="px-4 py-3">
							{#if u.has_login}
								<span class="text-emerald-700">Sí</span>
							{:else}
								<span class="text-slate-400">Solo préstamos</span>
							{/if}
						</td>
						<td class="px-4 py-3">{u.active ? 'Activo' : 'Inactivo'}</td>
						<td class="px-4 py-3">
							<div class="flex justify-end gap-1">
								<a class="btn-secondary px-2 py-1 text-xs" href="/users/{u.id}/edit">Editar</a>
								<form method="POST" action="?/toggleActive" use:enhance>
									<input type="hidden" name="id" value={u.id} />
									<button class="btn-secondary px-2 py-1 text-xs" type="submit">
										{u.active ? 'Desactivar' : 'Activar'}
									</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
