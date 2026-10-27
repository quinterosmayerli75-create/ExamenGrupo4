export type User = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
};

export type Session = {
  token: string;
  user: User;
};

export type Product = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  categoriaId: number;
  categoriaNombre: string | null;
};

export type Category = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

export type Customer = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
};

export type OrderDetail = {
  id: number;
  pedidoId: number;
  productoId: number;
  productoNombre: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type Order = {
  id: number;
  fecha: string;
  estado: string | null;
  clienteId: number;
  clienteNombre: string | null;
  total: number;
  detalles: OrderDetail[];
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type ApiError = Error & { status?: number };
