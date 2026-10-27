
import { NavLink } from "react-router-dom";

const opciones = [
  {
    ruta: "/dashboard",
    icono: "bi-speedometer2",
    nombre: "Dashboard",
  },
  {
    ruta: "/productos",
    icono: "bi-box-seam",
    nombre: "Productos",
  },
  {
    ruta: "/categorias",
    icono: "bi-tags",
    nombre: "Categorías",
  },
  {
    ruta: "/clientes",
    icono: "bi-people",
    nombre: "Clientes",
  },
  {
    ruta: "/pedidos",
    icono: "bi-cart-check",
    nombre: "Pedidos",
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar p-3">
      <h4 className="fw-bold text-center mb-4">
        <i className="bi bi-shop me-2"></i>
        Tienda
      </h4>

      <nav className="nav flex-column gap-2">
        {opciones.map((opcion) => (
          <NavLink
            key={opcion.ruta}
            to={opcion.ruta}
            className={({ isActive }) =>
              `nav-link sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <i className={`bi ${opcion.icono} me-2`}></i>
            {opcion.nombre}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
