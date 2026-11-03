<script lang="ts">
		import { formatDateTime, formatDate, isOverdue } from '$lib/format';
	import { roleAtLeast } from '$lib/roles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const canManage = $derived(roleAtLeast(data.user?.role, 'gestor'));
	const tabs = $derived([
		{ key: 'active', label: 'Activos', count: data.counts.active ?? 0 },
		{ key: 'overdue', label: 'Vencidos', count: data.counts.overdue ?? 0 },
		{ key: 'all', label: 'Historial', count: data.counts.all_count ?? 0 }
	]);
</script>

<svelte:head>
	<title>Préstamos · Inventario EDUmind</title>
</svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-slate-900">Préstamos</h1>
	<p class="text-slate-600">Trazabilidad de entradas y salidas de equipos.</p>
</div>

<div class="mb-4 flex flex-wrap gap-2" role="tablist">
	{#each tabs as t (t.key)}
		<a
			href="/loans?filter={t.key}"
			role="tab"
			aria-selected={data.filter === t.key}
			class="rounded-lg px-4 py-2 text-sm font-semibold transition-colors {data.filter === t.key
				? 'bg-brand-700 text-white'
				: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}"
		>
			{t.label}
			<span
				class="ml-1 rounded-full px-1.5 text-xs {data.filter === t.key
					? 'bg-white/20'
					: t.key === 'overdue' && t.count > 0
						? 'bg-red-100 text-red-700'
						: 'bg-slate-100 text-slate-600'}"
			>
				{t.count}
			</span>
		</a>
	{/each}
</div>

<div class="card overflow-hidden">
	{#if data.loans.length === 0}
		<p class="px-5 py-16 text-center text-slate-500">
			{data.filter === 'overdue'
				? 'No hay préstamos vencidos. 👍'
				: data.filter === 'active'
					? 'No hay préstamos activos.'
					: 'Todavía no hay movimientos.'}
		</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
					<tr>
						<th class="px-4 py-3 font-semibold">Equipo</th>
						<th class="px-4 py-3 font-semibold">Usuario</th>
						<th class="px-4 py-3 font-semibold">Salida</th>
						<th class="px-4 py-3 font-semibold">Prevista</th>
						<th class="px-4 py-3 font-semibold">Estado</th>
						{#if canManage}
							<th class="px-4 py-3 font-semibold">Actas</th>
						{/if}
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.loans as l (l.id)}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3">
								<a href="/devices/{l.device_id}" class="font-mono font-semibold text-brand-700 hover:underline">
									{l.device_code}
								</a>
								<span class="block text-xs text-slate-400">{l.device_name || l.category_name || ''}</span>
							</td>
							<td class="px-4 py-3 font-medium text-slate-900">{l.borrower_name || '—'}</td>
							<td class="px-4 py-3 text-slate-600">{formatDateTime(l.checkout_at)}</td>
							<td class="px-4 py-3 text-slate-600">{l.due_at ? formatDate(l.due_at) : '—'}</td>
							<td class="px-4 py-3">
								{#if l.returned_at}
									<span class="badge bg-emerald-100 text-emerald-800">Devuelto {formatDate(l.returned_at)}</span>
								{:else if isOverdue(l.due_at, l.returned_at)}
									<span class="badge bg-red-100 text-red-700">Vencido</span>
								{:else}
									<span class="badge bg-amber-100 text-amber-800">En préstamo</span>
								{/if}
							</td>
							{#if canManage}
								<td class="px-4 py-3">
									<div class="flex gap-2 text-xs">
										<a class="font-medium text-brand-700 hover:underline" href="/loans/{l.id}/document?type=entrega" target="_blank">Entrega</a>
										<a class="font-medium text-brand-700 hover:underline" href="/loans/{l.id}/document?type=recogida" target="_blank">Recogida</a>
									</div>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
