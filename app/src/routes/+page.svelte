<script lang="ts">
	import { isOverdue, formatDate, formatDateTime } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const cards = $derived([
		{ label: 'Equipos totales', value: data.counts.total, tone: 'text-slate-900', href: '/devices' },
		{
			label: 'Disponibles',
			value: data.counts.disponibles,
			tone: 'text-emerald-600',
			href: '/devices?status=disponible'
		},
		{ label: 'Prestados', value: data.counts.prestados, tone: 'text-amber-600', href: '/devices?status=prestado' },
		{
			label: 'Vencidos',
			value: data.counts.overdue,
			tone: data.counts.overdue > 0 ? 'text-red-600' : 'text-slate-900',
			href: '/loans?filter=overdue'
		}
	]);
</script>

<svelte:head>
	<title>Panel · Inventario EDUmind</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-slate-900">Panel</h1>
		<p class="text-slate-600">Estado general del inventario del centro.</p>
	</div>
	<div class="flex gap-2">
		<a class="btn-secondary" href="/scan">Escanear</a>
		<a class="btn-primary" href="/devices/new">Nuevo equipo</a>
	</div>
</div>

<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
	{#each cards as c (c.label)}
		<a href={c.href} class="card p-5 transition-shadow hover:shadow-md">
			<p class="text-sm font-medium text-slate-500">{c.label}</p>
			<p class="mt-1 text-3xl font-bold {c.tone}">{c.value}</p>
		</a>
	{/each}
</div>

<div class="mt-8 grid gap-6 lg:grid-cols-2">
	<section class="card overflow-hidden">
		<header class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
			<h2 class="font-semibold text-slate-900">Préstamos activos</h2>
			<a class="text-sm font-medium text-brand-700 hover:underline" href="/loans">Ver todos</a>
		</header>
		{#if data.activeLoans.length === 0}
			<p class="px-5 py-10 text-center text-sm text-slate-500">No hay préstamos activos.</p>
		{:else}
			<ul class="divide-y divide-slate-100">
				{#each data.activeLoans as loan (loan.id)}
					<li class="flex items-center justify-between gap-3 px-5 py-3">
						<div class="min-w-0">
							<a href="/devices/{loan.device_id}" class="font-medium text-slate-900 hover:underline">
								{loan.device_code}
							</a>
							<span class="text-slate-500">· {loan.device_name ?? loan.category_name ?? ''}</span>
							<p class="truncate text-sm text-slate-600">{loan.borrower_name ?? 'Sin asignar'}</p>
						</div>
						<div class="shrink-0 text-right text-sm">
							{#if loan.due_at}
								<span
									class="font-medium {isOverdue(loan.due_at, loan.returned_at) ? 'text-red-600' : 'text-slate-500'}"
								>
									{isOverdue(loan.due_at, loan.returned_at) ? 'Vencido ' : 'Vence '}{formatDate(loan.due_at)}
								</span>
							{:else}
								<span class="text-slate-400">Sin fecha</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="card overflow-hidden">
		<header class="border-b border-slate-200 px-5 py-4">
			<h2 class="font-semibold text-slate-900">Actividad reciente</h2>
		</header>
		{#if data.recent.length === 0}
			<p class="px-5 py-10 text-center text-sm text-slate-500">Aún no hay movimientos.</p>
		{:else}
			<ul class="divide-y divide-slate-100">
				{#each data.recent as loan (loan.id)}
					<li class="flex items-center justify-between gap-3 px-5 py-3">
						<div class="min-w-0">
							<p class="truncate text-sm">
								<span class="font-medium text-slate-900">{loan.device_code}</span>
								{#if loan.returned_at}
									<span class="text-emerald-700">devuelto</span>
								{:else}
									<span class="text-amber-700">prestado a {loan.borrower_name ?? '—'}</span>
								{/if}
							</p>
							<p class="text-xs text-slate-500">{formatDateTime(loan.returned_at ?? loan.checkout_at)}</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
