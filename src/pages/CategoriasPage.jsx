
import { useEffect, useMemo, useState } from "react";
import { categoriaService } from "../services/categoriaService";
import { authService } from "../services/authService";

const formularioInicial = {
  nombre: "",
  descripcion: "",
};

function obtenerMensajeError(error) {
  const data = error.response?.data;

  if (data?.mensaje) return data.mensaje;

  if (data?.errors) {
    return Object.values(data.errors).flat().join(" | ");
  }

  if (error.response?.status === 403) {
    return "No tienes permisos de administrador.";
  }

  if (error.response?.status === 401) {
    return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  }

  if (!error.response) {
    return "No se pudo establecer conexión con la API.";
  }

  return "Ocurrió un error al procesar la operación.";
}

export default function CategoriasPage() {
  const esAdmin = authService.esAdmin();

  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarCategorias = async () => {
    setCargando(true);

    try {
      const datos = await categoriaService.obtenerTodas();
      setCategorias(datos);
      setError("");
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return categorias.filter((categoria) => {
      const nombre = categoria.nombre?.toLowerCase() || "";
      const descripcion = categoria.descripcion?.toLowerCase() || "";

      return (
        nombre.includes(texto) ||
        descripcion.includes(texto)
      );
    });
  }, [categorias, busqueda]);

  const abrirCrear = () => {
    setCategoriaEditando(null);
    setFormulario({ ...formularioInicial });
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  };

  const abrirEditar = (categoria) => {
    setCategoriaEditando(categoria);
    setFormulario({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setCategoriaEditando(null);
    setFormulario({ ...formularioInicial });
    setError("");
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();

    const nombre = formulario.nombre.trim();
    const descripcion = formulario.descripcion.trim();

    if (!nombre) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (nombre.length > 100 || descripcion.length > 250) {
      setError("Se excedió la longitud permitida.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const datos = { nombre, descripcion };

      if (categoriaEditando) {
        await categoriaService.actualizar(
          categoriaEditando.id,
          datos
        );
        setMensaje("Categoría actualizada correctamente.");
      } else {
        await categoriaService.crear(datos);
        setMensaje("Categoría creada correctamente.");
      }

      setMostrarFormulario(false);
      setCategoriaEditando(null);
      setFormulario({ ...formularioInicial });

      await cargarCategorias();
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCategoria = async (categoria) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la categoría "${categoria.nombre}"?`
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    try {
      await categoriaService.eliminar(categoria.id);

      setMensaje("Categoría eliminada correctamente.");
      await cargarCategorias();
    } catch (err) {
      setError(obtenerMensajeError(err));
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Categorías</h2>
          <p className="text-muted mb-0">
            Administración de categorías de productos
          </p>
        </div>

        {esAdmin && !mostrarFormulario && (
          <button
            className="btn btn-primary"
            onClick={abrirCrear}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Nueva categoría
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success" role="status">
          {mensaje}
        </div>
      )}

      {!esAdmin && (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Tienes acceso de consulta. Para crear, editar o
          eliminar categorías necesitas el rol Admin.
        </div>
      )}

      {mostrarFormulario && esAdmin && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">
              {categoriaEditando
                ? "Editar categoría"
                : "Crear categoría"}
            </h5>

            <form onSubmit={guardarCategoria}>
              <div className="mb-3">
                <label htmlFor="nombreCategoria" className="form-label">
                  Nombre *
                </label>

                <input
                  id="nombreCategoria"
                  className="form-control"
                  value={formulario.nombre}
                  maxLength={100}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      nombre: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="descripcionCategoria" className="form-label">
                  Descripción
                </label>

                <textarea
                  id="descripcionCategoria"
                  className="form-control"
                  rows={3}
                  maxLength={250}
                  value={formulario.descripcion}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      descripcion: e.target.value,
                    })
                  }
                />
                <small className="text-muted">
                  {formulario.descripcion.length}/250 caracteres
                </small>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>

                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  disabled={guardando}
                  onClick={cancelarFormulario}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <h5 className="fw-bold mb-0">
              Listado de categorías
            </h5>

            <input
              type="search"
              className="form-control"
              style={{ maxWidth: 300 }}
              placeholder="Buscar categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  {esAdmin && (
                    <th className="text-end">Acciones</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={esAdmin ? 4 : 3} className="text-center py-4">
                      Cargando categorías...
                    </td>
                  </tr>
                ) : categoriasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={esAdmin ? 4 : 3} className="text-center py-4 text-muted">
                      No se encontraron categorías.
                    </td>
                  </tr>
                ) : (
                  categoriasFiltradas.map((categoria) => (
                    <tr key={categoria.id}>
                      <td>{categoria.id}</td>
                      <td className="fw-semibold">
                        {categoria.nombre}
                      </td>
                      <td>{categoria.descripcion || "Sin descripción"}</td>

                      {esAdmin && (
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => abrirEditar(categoria)}
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Editar
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarCategoria(categoria)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <small className="text-muted">
            Mostrando {categoriasFiltradas.length} de{" "}
            {categorias.length} categorías.
          </small>
        </div>
      </div>
    </div>
  );
}
