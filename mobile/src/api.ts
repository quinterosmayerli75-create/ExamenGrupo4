import type { ApiError, Category, Customer, Order, Product, Session, User } from './types';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
export const API_BASE_URL = (configuredUrl || 'http://10.0.2.2:5194/api').replace(/\/+$/, '');

type RequestOptions = {
  token?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/${path.replace(/^\//, '')}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new Error(`No se pudo conectar con la API en ${API_BASE_URL}. Revisa la dirección y que el backend esté activo.`);
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = getErrorMessage(payload) ?? `La solicitud falló (${response.status}).`;
    const error = new Error(message) as ApiError;
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const value = payload as Record<string, unknown>;
  for (const key of ['mensaje', 'message', 'detail', 'title']) {
    if (typeof value[key] === 'string' && value[key]) return value[key] as string;
  }
  const errors = value.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors as Record<string, unknown>).flat()[0];
    if (typeof first === 'string') return first;
  }
  return undefined;
}

export async function login(email: string, password: string): Promise<Session> {
  const result = await request<{ token: string; usuario: User }>('Auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return { token: result.token, user: result.usuario };
}

export async function register(name: string, email: string, password: string): Promise<void> {
  await request('Auth/registro', {
    method: 'POST',
    body: { nombreUsuario: name, email, password },
  });
}

export function getProducts(token: string): Promise<Product[]> {
  return request('Productos', { token });
}

export type ProductInput = Pick<Product, 'nombre' | 'descripcion' | 'precio' | 'stock' | 'categoriaId'>;

export async function saveProduct(token: string, product: ProductInput, id?: number): Promise<void> {
  await request(id ? `Productos/${id}` : 'Productos', {
    token,
    method: id ? 'PUT' : 'POST',
    body: { id: id ?? 0, ...product },
  });
}

export function deleteProduct(token: string, id: number): Promise<void> {
  return request(`Productos/${id}`, { token, method: 'DELETE' });
}

export function getCategories(token: string): Promise<Category[]> {
  return request('Categorias', { token });
}

export async function saveCategory(token: string, category: Pick<Category, 'nombre' | 'descripcion'>, id?: number): Promise<void> {
  await request(id ? `Categorias/${id}` : 'Categorias', {
    token,
    method: id ? 'PUT' : 'POST',
    body: { id: id ?? 0, ...category },
  });
}

export function deleteCategory(token: string, id: number): Promise<void> {
  return request(`Categorias/${id}`, { token, method: 'DELETE' });
}

export function getCustomers(token: string): Promise<Customer[]> {
  return request('Clientes', { token });
}

export function getMyCustomer(token: string): Promise<Customer> {
  return request('Clientes/mi-perfil', { token });
}

export function getCustomer(token: string, id: number): Promise<Customer> {
  return request(`Clientes/${id}`, { token });
}

export function createCustomer(token: string, user: User, phone: string): Promise<Customer> {
  return request('Clientes', {
    token,
    method: 'POST',
    body: { nombre: user.nombre, correo: user.correo, telefono: phone || null },
  });
}

export function updateCustomer(token: string, customer: Customer, phone: string): Promise<void> {
  return request(`Clientes/${customer.id}`, {
    token,
    method: 'PUT',
    body: {
      id: customer.id,
      nombre: customer.nombre,
      correo: customer.correo,
      telefono: phone || null,
    },
  });
}

export function getOrders(token: string): Promise<Order[]> {
  return request('Pedidos', { token });
}

export function updateOrderStatus(token: string, id: number, estado: string): Promise<void> {
  return request(`Pedidos/${id}/estado`, { token, method: 'PUT', body: { estado } });
}

export function createOrder(
  token: string,
  customerId: number,
  items: { productoId: number; cantidad: number }[],
): Promise<Order> {
  return request('Pedidos', {
    token,
    method: 'POST',
    body: {
      clienteId: customerId,
      detalles: items,
    },
  });
}
