import type { LayoutServerLoad } from './$types';
import { getSetting } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		centerName: getSetting('center_name', 'Centro Educativo')
	};
};
