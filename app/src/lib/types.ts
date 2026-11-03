/**
 * Tipos de datos compartidos entre servidor y cliente.
 * (Las consultas viven en $lib/server/queries.ts; aquí solo las formas.)
 */
import type { Role } from './roles';

export type DeviceStatus = 'disponible' | 'prestado' | 'mantenimiento' | 'baja';

export type Category = { id: number; code: string; name: string; color: string };

export type Device = {
	id: number;
	code: string;
	category_id: number | null;
	name: string | null;
	brand: string | null;
	model: string | null;
	serial: string | null;
	location: string | null;
	status: DeviceStatus;
	notes: string | null;
	created_at: string;
	updated_at: string;
};

/** Equipo con su categoría y, si está prestado, quién lo tiene. */
export type DeviceView = Device & {
	category_name: string | null;
	category_code: string | null;
	category_color: string | null;
	holder_name: string | null;
	checkout_at: string | null;
	due_at: string | null;
};

export type UserRow = {
	id: number;
	name: string;
	email: string | null;
	identifier: string | null;
	role: Role;
	can_borrow: number;
	active: number;
	has_login: number;
	created_at: string;
};

export type LoanRow = {
	id: number;
	device_id: number;
	device_code: string;
	device_name: string | null;
	category_name: string | null;
	borrower_name: string | null;
	user_id: number | null;
	checkout_at: string;
	due_at: string | null;
	returned_at: string | null;
	notes: string | null;
	checked_out_by_name: string | null;
};

export type LoanFull = LoanRow & {
	category_code: string | null;
	brand: string | null;
	model: string | null;
	serial: string | null;
	borrower_identifier: string | null;
};
