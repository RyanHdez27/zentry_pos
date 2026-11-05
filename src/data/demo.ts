// Compatibilidad temporal para vistas que todavía consumen series locales.
// Estos catálogos permanecen vacíos hasta que la API devuelva datos del tenant.
export const products: any[] = [];
export const customers: any[] = [];
export const invoices: any[] = [];
export const users: any[] = [];
export const auditLogs: any[] = [];
export const inventoryMovements: any[] = [];
export const salesChart: any[] = [];
export const categoryChart: any[] = [];
export const paymentChart: any[] = [];
export const fmt = (n: number) => '$' + n.toLocaleString('es-CO');
