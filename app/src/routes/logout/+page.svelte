<!-- /logout solo acepta POST (ver +page.server.ts). Si alguien llega por GET, ofrece el botón. -->
<svelte:head>
	<title>Salir · Inventario EDUmind</title>
</svelte:head>

<div class="mx-auto max-w-md py-10 text-center">
	<p class="mb-4 text-slate-600">¿Cerrar la sesión?</p>
	<form method="POST">
		<button class="btn-primary" type="submit">Cerrar sesión</button>
		<a class="btn-secondary ml-2" href="/">Volver</a>
	</form>
</div>
