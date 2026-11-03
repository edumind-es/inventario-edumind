<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Tras «Generar código» o si ya había uno vigente, se muestra el paso 2.
	const showStep2 = $derived(Boolean(form?.issued) || data.pending);
	const file = $derived(form?.file ?? data.file);
</script>

<svelte:head>
	<title>Recuperar acceso · Inventario EDUmind</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
	<div class="mb-6 text-center">
		<img
			src="/logo-edumind.png"
			alt="Inventario EDUmind"
			class="mx-auto mb-3 h-20 w-20 rounded-2xl object-contain shadow-sm ring-1 ring-slate-200"
		/>
		<h1 class="text-2xl font-bold text-slate-900">Recuperar acceso</h1>
		<p class="mt-1 text-slate-600">{data.centerName}</p>
	</div>

	{#if form?.error}
		<p class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{form.error}</p>
	{/if}

	<section class="card space-y-4 p-6">
		<h2 class="font-semibold text-slate-900">1. Demuestra que estás en este ordenador</h2>
		<p class="text-sm text-slate-600">
			Al pulsar el botón, la aplicación guarda un <strong>código de un solo uso</strong> en un fichero de
			texto dentro de su carpeta de datos. Solo quien puede abrir ese fichero en este ordenador puede
			restablecer la contraseña. El código caduca a los 10 minutos.
		</p>
		<form method="POST" action="?/generar">
			<button class="btn-primary" type="submit">
				{showStep2 ? 'Generar un código nuevo' : 'Generar código'}
			</button>
		</form>
		{#if showStep2}
			<div class="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
				<p class="font-semibold">Abre este fichero y copia el código que contiene:</p>
				<p class="mt-1 font-mono text-xs break-all">{file}</p>
			</div>
		{/if}
	</section>

	{#if showStep2}
		<section class="card mt-4 space-y-4 p-6">
			<h2 class="font-semibold text-slate-900">2. Nueva contraseña</h2>
			<form method="POST" action="?/restablecer" class="space-y-4">
				<div>
					<label class="label" for="code">Código del fichero</label>
					<input
						class="input font-mono"
						id="code"
						name="code"
						inputmode="numeric"
						autocomplete="one-time-code"
						maxlength="6"
						required
						value={form?.values?.code ?? ''}
					/>
				</div>
				<div>
					<label class="label" for="user_id">Cuenta de administración</label>
					<select class="input" id="user_id" name="user_id" required>
						<option value="">Elige…</option>
						{#each data.admins as a (a.id)}
							<option value={a.id} selected={String(a.id) === (form?.values?.user_id ?? '')}>
								{a.name} · {a.emailMasked}
							</option>
						{/each}
					</select>
					<p class="mt-1 text-xs text-slate-500">
						El correo se muestra parcialmente oculto. Iniciarás sesión con el correo completo de esa cuenta.
					</p>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="label" for="password">Contraseña nueva</label>
						<input class="input" id="password" name="password" type="password" minlength="8" required autocomplete="new-password" />
					</div>
					<div>
						<label class="label" for="password2">Repite la contraseña</label>
						<input class="input" id="password2" name="password2" type="password" minlength="8" required autocomplete="new-password" />
					</div>
				</div>
				<button class="btn-primary w-full" type="submit">Restablecer y entrar</button>
			</form>
		</section>
	{/if}

	<p class="mt-6 text-center text-sm text-slate-500">
		<a href="/login" class="hover:underline">Volver al acceso</a>
	</p>
</main>
