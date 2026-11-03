<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Configuración inicial · Inventario EDUmind</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
	<div class="mb-6 text-center">
		<img
			src="/logo-edumind.png"
			alt="Inventario EDUmind"
			class="mx-auto mb-3 h-24 w-24 rounded-2xl object-contain shadow-sm ring-1 ring-slate-200"
		/>
		<h1 class="text-2xl font-bold text-slate-900">Bienvenido a Inventario EDUmind</h1>
		<p class="mt-1 text-slate-600">
			Vamos a crear la cuenta de administración del centro. Estos datos se guardan solo en este
			ordenador.
		</p>
	</div>

	<form method="POST" class="card space-y-4 p-6">
		{#if form?.error}
			<p class="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{form.error}</p>
		{/if}
		<div>
			<label class="label" for="center_name">Nombre del centro</label>
			<input
				class="input"
				id="center_name"
				name="center_name"
				value={form?.values?.center_name ?? ''}
				placeholder="CEP Campolongo"
			/>
		</div>
		<hr class="border-slate-200" />
		<p class="text-sm font-semibold text-slate-700">Cuenta de administrador/a</p>
		<div>
			<label class="label" for="name">Nombre completo *</label>
			<input class="input" id="name" name="name" required value={form?.values?.name ?? ''} />
		</div>
		<div>
			<label class="label" for="email">Correo (usuario de acceso) *</label>
			<input class="input" id="email" name="email" type="email" required value={form?.values?.email ?? ''} />
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="label" for="password">Contraseña *</label>
				<input class="input" id="password" name="password" type="password" required minlength="8" />
			</div>
			<div>
				<label class="label" for="password2">Repite la contraseña *</label>
				<input class="input" id="password2" name="password2" type="password" required minlength="8" />
			</div>
		</div>
		<button class="btn-primary w-full" type="submit">Crear cuenta y empezar</button>
	</form>
</main>
