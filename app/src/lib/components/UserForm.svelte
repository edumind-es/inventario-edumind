<script lang="ts">
	import { ROLE_LABEL, type Role } from '$lib/roles';
	import type { UserRow } from '$lib/types';

	let {
		user = null,
		values = null,
		error = null,
		submitLabel = 'Guardar'
	}: {
		user?: UserRow | null;
		values?: Record<string, string> | null;
		error?: string | null;
		submitLabel?: string;
	} = $props();

	const roles: Role[] = ['consulta', 'gestor', 'admin'];
	const v = (k: string, alt = ''): string => values?.[k] ?? alt;
	const initialRole = $derived(user?.role ?? v('role', 'consulta'));
	const canBorrow = $derived(user ? user.can_borrow === 1 : true);
	const active = $derived(user ? user.active === 1 : true);
</script>

<form method="POST" class="card space-y-5 p-6">
	{#if error}
		<p class="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>
	{/if}

	<div class="grid gap-5 sm:grid-cols-2">
		<div>
			<label class="label" for="name">Nombre completo *</label>
			<input class="input" id="name" name="name" required value={user?.name ?? v('name')} />
		</div>
		<div>
			<label class="label" for="identifier">Identificador (DNI, nº empleado…)</label>
			<input class="input" id="identifier" name="identifier" value={user?.identifier ?? v('identifier')} />
		</div>
	</div>

	<div>
		<label class="label" for="email">Correo (usuario de acceso)</label>
		<input class="input" id="email" name="email" type="email" value={user?.email ?? v('email')} />
		<p class="mt-1 text-xs text-slate-500">Necesario solo si el usuario va a iniciar sesión en la app.</p>
	</div>

	<div class="grid gap-5 sm:grid-cols-2">
		<div>
			<label class="label" for="role">Rol</label>
			<select class="input" id="role" name="role">
				{#each roles as r (r)}
					<option value={r} selected={initialRole === r}>{ROLE_LABEL[r]}</option>
				{/each}
			</select>
			<p class="mt-1 text-xs text-slate-500">Consulta: solo ver · Gestor: préstamos y etiquetas · Admin: todo.</p>
		</div>
		<div>
			<label class="label" for="password">{user?.has_login ? 'Restablecer contraseña' : 'Contraseña de acceso'}</label>
			<input
				class="input"
				id="password"
				name="password"
				type="password"
				minlength="8"
				autocomplete="new-password"
			/>
			<p class="mt-1 text-xs text-slate-500">
				{user ? 'Déjalo vacío para no cambiarla.' : 'Vacío = usuario sin acceso (solo préstamos).'}
			</p>
		</div>
	</div>

	<div class="flex flex-wrap gap-6">
		<label class="flex items-center gap-2 text-sm text-slate-700">
			<input
				type="checkbox"
				name="can_borrow"
				class="h-4 w-4 rounded border-slate-300 text-brand-700"
				checked={canBorrow}
			/>
			Puede recibir equipos en préstamo
		</label>
		<label class="flex items-center gap-2 text-sm text-slate-700">
			<input type="checkbox" name="active" class="h-4 w-4 rounded border-slate-300 text-brand-700" checked={active} />
			Cuenta activa
		</label>
	</div>

	<div class="flex gap-2">
		<button class="btn-primary" type="submit">{submitLabel}</button>
		<a class="btn-secondary" href="/users">Cancelar</a>
	</div>
</form>
