/** Roles de usuario (compartido entre cliente y servidor). */
export type Role = 'admin' | 'gestor' | 'consulta';

export const ROLE_LABEL: Record<Role, string> = {
	admin: 'Administrador/a',
	gestor: 'Gestor/a',
	consulta: 'Consulta'
};

const RANK: Record<Role, number> = { consulta: 0, gestor: 1, admin: 2 };

export function roleAtLeast(role: Role | null | undefined, min: Role): boolean {
	if (!role) return false;
	return RANK[role] >= RANK[min];
}
