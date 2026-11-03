<script lang="ts" module>
	import type { DeviceStatus } from '$lib/types';

	export const DEVICE_STATUS_LABEL: Record<DeviceStatus, string> = {
		disponible: 'Disponible',
		prestado: 'Prestado',
		mantenimiento: 'Mantenimiento',
		baja: 'De baja'
	};
</script>

<script lang="ts">
	let { status }: { status: DeviceStatus } = $props();

	const styles: Record<DeviceStatus, string> = {
		disponible: 'bg-emerald-100 text-emerald-800',
		prestado: 'bg-amber-100 text-amber-800',
		mantenimiento: 'bg-sky-100 text-sky-800',
		baja: 'bg-slate-200 text-slate-600'
	};
</script>

<span class="badge {styles[status]}">
	<span class="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
	{DEVICE_STATUS_LABEL[status]}
</span>
