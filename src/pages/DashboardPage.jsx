
import { useEffect, useState } from "react";
import api from "../services/api";
import { authService } from "../services/authService";

const modulos = [
  {
    titulo: "Productos",
    ruta: "/api/Productos",
    icono: "bi-box-seam",
    color: "primary",
  },
  {
    titulo: "Categorías",
    ruta: "/api/Categorias",
    icono: "bi-tags",
    color: "success",
  },
  {
    titulo: "Clientes",
    ruta: "/api/Clientes",
    icono: "bi-people",
    color: "warning",
  },
  {
    titulo: "Pedidos",
    ruta: "/api/Pedidos",
    icono: "bi-cart-check",
    color: "info",
  },
];

export default function DashboardPage() {
  const usuario = authService.getUsuario();

  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarDashboard = async () => {
      try {
        const respuestas = await Promise.all(
          modulos.map((modulo) => api.get(modulo.ruta))
        );

        const resumen = {};

        modulos.forEach((modulo, indice) => {
          resumen[modulo.titulo] =
            respuestas[indice].data.length;
        });

        if (activo) setDatos(resumen);
      } catch (err) {
        if (activo) {
          setError(
            err.response?.data?.mensaje ||
              "No se pudieron cargar los datos del dashboard."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDashboard();

    return () => {
      activo = false;
    };
  }, []);

  return (
    <div>
      <h2 className="fw-bold mb-2">
        Bienvenido, {usuario?.nombre || "Usuario"}
      </h2>

      <p className="text-muted mb-4">
        Resumen general del Sistema de Ventas
      </p>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="row g-4">
        {modulos.map((modulo) => (
          <div className="col-12 col-md-6 col-xl-3" key={modulo.titulo}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="text-muted mb-0">
                    {modulo.titulo}
                  </h6>

                  <i
                    className={`bi ${modulo.icono} fs-3 text-${modulo.color}`}
                  ></i>
                </div>

                <h2 className="fw-bold mb-0">
                  {cargando
                    ? "..."
                    : error
                      ? "—"
                      : (datos[modulo.titulo] ?? 0)}
                </h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body p-4">
          <h5 className="fw-bold">
            Información de tu cuenta
          </h5>

          <p className="mb-2">
            <strong>Nombre:</strong> {usuario?.nombre}
          </p>

          <p className="mb-2">
            <strong>Correo:</strong> {usuario?.correo}
          </p>

          <p className="mb-0">
            <strong>Rol:</strong> {usuario?.rol}
          </p>
        </div>
      </div>
    </div>
  );
}
