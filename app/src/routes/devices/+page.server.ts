import type { PageServerLoad } from './$types';
import { listCategories, listDevices } from '$lib/server/queries';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q')?.trim() || undefined;
	const status = url.searchParams.get('status') || undefined;
	const categoryId = url.searchParams.get('cat') ? Number(url.searchParams.get('cat')) : undefined;
	return {
		devices: listDevices({ search, status, categoryId }),
		categories: listCategories(),
		filters: { search: search ?? '', status: status ?? '', categoryId: categoryId ?? '' }
	};
};
