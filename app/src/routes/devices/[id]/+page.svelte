<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatDate, formatDateTime, isOverdue } from '$lib/format';
	import { roleAtLeast } from '$lib/roles';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const d = $derived(data.device);
	const canManage = $derived(roleAtLeast(data.user?.role, 'gestor'));
	const isAdmin = $derived(roleAtLeast(data.user?.role, 'admin'));
	const activeLoan = $derived(data.history.find((h) => !h.returned_at));
	const defaultDue = $derived(
		new Date(Date.now() + data.defaultLoanDays * 864e5).toISOString().slice(0, 10)
	);

	let confirmDelete = $state(false);
</script>

<svelte:head>
	<title>{d.code} · Inventario EDUmind</title>
</svelte:head>

<nav class="mb-4 text-sm text-slate-500">
	<a href="/devices" class="hover:underline">Equipos</a> · <span class="font-mono">{d.code}</span>
</nav>

<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
	<div>
		<div class="flex items-center gap-3">
			<h1 class="font-mono text-2xl font-bold text-slate-900">{d.code}</h1>
			<StatusBadge status={d.status} />
		</div>
		<p class="mt-1 text-lg text-slate-700">{d.name || d.model || d.category_name || 'Equipo'}</p>
	</div>
	{#if canManage}
		<div class="flex gap-2">
			<a class="btn-secondary" href="/labels?code={d.code}">Etiqueta</a>
			<a class="btn-secondary" href="/devices/{d.id}/edit">Editar</a>
			{#if isAdmin}
				<button class="btn-danger" onclick={() => (confirmDelete = true)}>Eliminar</button>
			{/if}
		</div>
	{/if}
</div>

{#if form?.error}
	<p class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{form.error}</p>
{/if}
{#if form?.success}
	<p class="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
		{form.success}
	</p>
{/if}

<div class="grid gap-6 lg:grid-cols-3">
	<div class="space-y-6 lg:col-span-2">
		<section class="card p-6">
			<h2 class="mb-4 font-semibold text-slate-900">Datos del equipo</h2>
			<dl class="grid gap-x-6 gap-y-4 sm:grid-cols-2">
				<div>
					<dt class="text-xs font-medium uppercase text-slate-400">Categoría</dt>
					<dd class="text-slate-800">{d.category_name || '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium uppercase text-slate-400">Ubicación</dt>
					<dd class="text-slate-800">{d.location || '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium uppercase text-slate-400">Marca</dt>
					<dd class="text-slate-800">{d.brand || '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium uppercase text-slate-400">Modelo</dt>
					<dd class="text-slate-800">{d.model || '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium uppercase text-slate-400">Nº de serie</dt>
					<dd class="font-mono text-slate-800">{d.serial || '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium uppercase text-slate-400">Alta</dt>
					<dd class="text-slate-800">{formatDate(d.created_at)}</dd>
				</div>
				{#if d.notes}
					<div class="sm:col-span-2">
						<dt class="text-xs font-medium uppercase text-slate-400">Notas</dt>
						<dd class="whitespace-pre-line text-slate-800">{d.notes}</dd>
					</div>
				{/if}
			</dl>
		</section>

		{#if canManage}
			<section class="card p-6">
				{#if d.status === 'prestado'}
					<h2 class="mb-1 font-semibold text-slate-900">Préstamo activo</h2>
					<p class="text-slate-700">
						En poder de <strong>{d.holder_name || '—'}</strong> desde {formatDateTime(d.checkout_at)}.
						{#if d.due_at}
							<span class={isOverdue(d.due_at, null) ? 'font-semibold text-red-600' : 'text-slate-500'}>
								{isOverdue(d.due_at, null) ? 'Vencido el' : 'Devolución prevista'}
								{formatDate(d.due_at)}.
							</span>
						{/if}
					</p>
					<div class="mt-4 flex flex-wrap items-center gap-2">
						<form method="POST" action="?/return" use:enhance>
							<button class="btn-primary" type="submit">Registrar devolución</button>
						</form>
						{#if activeLoan}
							<span class="mx-1 text-slate-300">|</span>
							<span class="text-sm text-slate-500">Actas:</span>
							<a class="btn-secondary" href="/loans/{activeLoan.id}/document?type=entrega" target="_blank">Entrega</a>
							<a class="btn-secondary" href="/loans/{activeLoan.id}/document?type=recogida" target="_blank">Recogida</a>
							<a class="btn-secondary" href="/loans/{activeLoan.id}/document?type=ambos" target="_blank">Ambas</a>
						{/if}
					</div>
				{:else if d.status === 'disponible'}
					<h2 class="mb-4 font-semibold text-slate-900">Prestar equipo</h2>
					<form method="POST" action="?/checkout" class="space-y-4" use:enhance>
						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<label class="label" for="user_id">Usuario</label>
								<select class="input" id="user_id" name="user_id">
									<option value="">— Elegir de la lista —</option>
									{#each data.borrowers as u (u.id)}
										<option value={u.id}>{u.name}</option>
									{/each}
								</select>
							</div>
							<div>
								<label class="label" for="borrower_name">…o nombre manual</label>
								<input class="input" id="borrower_name" name="borrower_name" placeholder="Nombre y apellidos" />
							</div>
						</div>
						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<label class="label" for="due_at">Devolución prevista</label>
								<input class="input" id="due_at" name="due_at" type="date" value={defaultDue} />
							</div>
							<div>
								<label class="label" for="notes">Notas (opcional)</label>
								<input class="input" id="notes" name="notes" placeholder="Accesorios, cargador…" />
							</div>
						</div>
						<button class="btn-primary" type="submit">Registrar préstamo</button>
					</form>
				{:else}
					<h2 class="mb-1 font-semibold text-slate-900">Estado: {d.status}</h2>
					<p class="text-slate-600">
						Este equipo no está disponible para préstamo. Cambia su estado desde
						<a href="/devices/{d.id}/edit" class="text-brand-700 hover:underline">editar</a>.
					</p>
				{/if}
			</section>
		{/if}
	</div>

	<aside class="space-y-6">
		<section class="card p-6 text-center">
			<h2 class="mb-3 font-semibold text-slate-900">Etiqueta QR</h2>
			<div class="mx-auto w-44">{@html data.qrSvg}</div>
			<p class="mt-3 font-mono text-lg font-bold text-slate-900">{d.code}</p>
			<p class="text-sm text-slate-500">{d.category_name || ''}</p>
			{#if canManage}
				<a class="btn-secondary mt-4 w-full" href="/labels?code={d.code}">Generar etiqueta PDF</a>
			{/if}
		</section>
	</aside>
</div>

<section class="card mt-6 overflow-hidden">
	<header class="border-b border-slate-200 px-5 py-4">
		<h2 class="font-semibold text-slate-900">Historial de préstamos</h2>
	</header>
	{#if data.history.length === 0}
		<p class="px-5 py-10 text-center text-sm text-slate-500">Este equipo aún no tiene préstamos.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
					<tr>
						<th class="px-4 py-3 font-semibold">Usuario</th>
						<th class="px-4 py-3 font-semibold">Salida</th>
						<th class="px-4 py-3 font-semibold">Prevista</th>
						<th class="px-4 py-3 font-semibold">Devolución</th>
						<th class="px-4 py-3 font-semibold">Registrado por</th>
						<th class="px-4 py-3 font-semibold">Actas</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.history as h (h.id)}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3 font-medium text-slate-900">{h.borrower_name || '—'}</td>
							<td class="px-4 py-3 text-slate-600">{formatDateTime(h.checkout_at)}</td>
							<td class="px-4 py-3 text-slate-600">{h.due_at ? formatDate(h.due_at) : '—'}</td>
							<td class="px-4 py-3">
								{#if h.returned_at}
									<span class="text-emerald-700">{formatDateTime(h.returned_at)}</span>
								{:else}
									<span class="badge bg-amber-100 text-amber-800">En préstamo</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-slate-500">{h.checked_out_by_name || '—'}</td>
							<td class="px-4 py-3">
								<div class="flex gap-2 text-xs">
									<a class="font-medium text-brand-700 hover:underline" href="/loans/{h.id}/document?type=entrega" target="_blank">Entrega</a>
									<a class="font-medium text-brand-700 hover:underline" href="/loans/{h.id}/document?type=recogida" target="_blank">Recogida</a>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

{#if confirmDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
		<div class="card w-full max-w-md p-6">
			<h2 class="text-lg font-bold text-slate-900">Eliminar equipo {d.code}</h2>
			<p class="mt-2 text-slate-600">
				Se borrará el equipo y todo su historial de préstamos. Esta acción no se puede deshacer.
			</p>
			<div class="mt-6 flex justify-end gap-2">
				<button class="btn-secondary" onclick={() => (confirmDelete = false)}>Cancelar</button>
				<form method="POST" action="?/delete" use:enhance>
					<button class="btn-danger" type="submit">Sí, eliminar</button>
				</form>
			</div>
		</div>
	</div>
{/if}
