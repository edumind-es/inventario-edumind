<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { ROLE_LABEL, roleAtLeast, type Role } from '$lib/roles';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	type NavItem = { href: string; label: string; minRole: Role; icon: string };

	const NAV: NavItem[] = [
		{
			href: '/',
			label: 'Panel',
			minRole: 'consulta',
			icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10'
		},
		{
			href: '/scan',
			label: 'Escanear',
			minRole: 'gestor',
			icon: 'M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M4 12h16'
		},
		{
			href: '/devices',
			label: 'Equipos',
			minRole: 'consulta',
			icon: 'M9 17H7A2 2 0 015 15V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2h-2M9 17v4h6v-4M9 17h6'
		},
		{
			href: '/loans',
			label: 'Préstamos',
			minRole: 'consulta',
			icon: 'M8 7V3m8 4V3M4 11h16M5 7h14a1 1 0 011 1v11a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1z'
		},
		{
			href: '/labels',
			label: 'Etiquetas',
			minRole: 'gestor',
			icon: 'M7 7h.01M3 5v6.586a1 1 0 00.293.707l7.414 7.414a2 2 0 002.828 0l5.586-5.586a2 2 0 000-2.828l-7.414-7.414A1 1 0 0011.586 3H5a2 2 0 00-2 2z'
		},
		{
			href: '/users',
			label: 'Usuarios',
			minRole: 'admin',
			icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-1.35'
		},
		{
			href: '/settings',
			label: 'Ajustes',
			minRole: 'admin',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z'
		},
		{
			href: '/system',
			label: 'Sistema',
			minRole: 'admin',
			icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-14 0h14M7 8h.01M7 16h.01'
		}
	];

	// Login y setup se muestran sin barra lateral.
	const bare = $derived(['/login', '/setup'].some((p) => page.url.pathname.startsWith(p)));
	const items = $derived(NAV.filter((i) => roleAtLeast(data.user?.role, i.minRole)));
	let menuOpen = $state(false);

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

{#if bare || !data.user}
	{@render children()}
{:else}
	<div class="flex min-h-screen">
		<aside
			class="fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 {menuOpen
				? 'translate-x-0'
				: ''}"
		>
			<div class="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
				<img
					src="/logo-edumind.png"
					alt="EDUmind"
					class="h-9 w-9 shrink-0 rounded-xl object-contain ring-1 ring-slate-200"
				/>
				<div class="min-w-0">
					<p class="truncate text-sm font-bold text-slate-900">Inventario EDUmind</p>
					<p class="truncate text-xs text-slate-500">{data.centerName}</p>
				</div>
			</div>
			<nav class="space-y-1 p-3" aria-label="Navegación principal">
				{#each items as item (item.href)}
					<a
						href={item.href}
						aria-current={isActive(item.href) ? 'page' : undefined}
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {isActive(
							item.href
						)
							? 'bg-brand-50 text-brand-800'
							: 'text-slate-700 hover:bg-slate-100'}"
						onclick={() => (menuOpen = false)}
					>
						<svg
							class="h-5 w-5 shrink-0"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d={item.icon}></path>
						</svg>
						{item.label}
					</a>
				{/each}
			</nav>
		</aside>

		{#if menuOpen}
			<button
				class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
				aria-label="Cerrar menú"
				onclick={() => (menuOpen = false)}
			></button>
		{/if}

		<div class="flex min-w-0 flex-1 flex-col">
			<header
				class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8"
			>
				<button class="btn-secondary p-2 lg:hidden" aria-label="Abrir menú" onclick={() => (menuOpen = true)}>
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"></path>
					</svg>
				</button>
				<div class="flex flex-1 items-center justify-end gap-4">
					<div class="text-right">
						<p class="text-sm font-semibold text-slate-800">{data.user.name}</p>
						<p class="text-xs text-slate-500">{ROLE_LABEL[data.user.role]}</p>
					</div>
					<form method="POST" action="/logout">
						<button class="btn-secondary" type="submit" title="Cerrar sesión">
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path
									d="M17 16l4-4m0 0l-4-4m4 4H7M13 16v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								></path>
							</svg>
							<span class="sr-only sm:not-sr-only">Salir</span>
						</button>
					</form>
				</div>
			</header>
			<main class="flex-1 px-4 py-6 lg:px-8 lg:py-8">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
