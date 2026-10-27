
import { useEffect, useMemo, useState } from "react";
import { productoService } from "../services/productoService";
import { categoriaService } from "../services/categoriaService";
import { authService } from "../services/authService";

const formularioInicial = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: "",
  categoriaId: "",
};


function obtenerMensajeError(error) {
  console.error("ERROR COMPLETO DE LA API:", error);

  console.log("Código HTTP:", error.response?.status);
  console.log("Respuesta del backend:", error.response?.data);

  const data = error.response?.data;

  if (data?.mensaje) {
    return data.mensaje;
  }

  if (data?.errors) {
    return Object.values(data.errors).flat().join(" | ");
  }

  if (error.response?.status === 400) {
    return "Datos inválidos. Revisa los campos del producto.";
  }

  if (error.response?.status === 401) {
    return "Tu sesión ha expirado.";
  }

  if (error.response?.status === 403) {
    return "No tienes permisos de administrador.";
  }

  if (error.response?.status === 500) {
    return "Error interno de ASP.NET Core. Revisa la consola del backend.";
  }

  if (!error.response) {
    return "No se pudo conectar con la API.";
  }

  return `Error HTTP ${error.response.status}`;
}


export default function ProductosPage() {
  const esAdmin = authService.esAdmin();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Obtener productos y categorías desde ASP.NET Core
  const cargarDatos = async () => {
    setCargando(true);

    try {
      const [listaProductos, listaCategorias] = await Promise.all([
        productoService.obtenerTodos(),
        categoriaService.obtenerTodas(),
      ]);

      setProductos(listaProductos);
      setCategorias(listaCategorias);
      setError("");
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Búsqueda y filtro por categoría
  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const contenido = [
        producto.nombre,
        producto.descripcion,
        producto.categoriaNombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideTexto = contenido.includes(texto);

      const coincideCategoria =
        !filtroCategoria ||
        producto.categoriaId === Number(filtroCategoria);

      return coincideTexto && coincideCategoria;
    });
  }, [productos, busqueda, filtroCategoria]);

  // Estadísticas de inventario
  const totalProductos = productos.length;

  const agotados = productos.filter(
    (producto) => producto.stock === 0
  ).length;

  const totalUnidades = productos.reduce(
    (total, producto) => total + producto.stock,
    0
  );

  const formatoPrecio = new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  });

  // Abrir formulario para crear
  const abrirCrear = () => {
    setProductoEditando(null);
    setFormulario({ ...formularioInicial });
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  };

  // Abrir formulario para editar
  const abrirEditar = (producto) => {
    setProductoEditando(producto);

    setFormulario({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precio: String(producto.precio),
      stock: String(producto.stock),
      categoriaId: String(producto.categoriaId),
    });

    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
    setFormulario({ ...formularioInicial });
    setError("");
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  // Guardar nuevo producto o modificar uno existente
  const guardarProducto = async (e) => {
    e.preventDefault();

    const nombre = formulario.nombre.trim();
    const descripcion = formulario.descripcion.trim();
    const precio = Number(formulario.precio);
    const stock = Number(formulario.stock);
    const categoriaId = Number(formulario.categoriaId);

    if (!nombre || nombre.length > 150) {
      setError("El nombre debe tener entre 1 y 150 caracteres.");
      return;
    }

    if (descripcion.length > 500) {
      setError("La descripción no puede superar 500 caracteres.");
      return;
    }

    if (
      formulario.precio.trim() === "" ||
      !Number.isFinite(precio) ||
      precio <= 0 ||
      precio > 999999999
    ) {
      setError("Ingresa un precio válido mayor que cero.");
      return;
    }

    if (
      formulario.stock.trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("El stock debe ser un número entero no negativo.");
      return;
    }

    if (
      !categorias.some((categoria) => categoria.id === categoriaId)
    ) {
      setError("Selecciona una categoría válida.");
      return;
    }

    const datosProducto = {
      nombre,
      descripcion,
      precio,
      stock,
      categoriaId,
    };

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      if (productoEditando) {
        await productoService.actualizar(
          productoEditando.id,
          datosProducto
        );
      } else {
        await productoService.crear(datosProducto);
      }

      const mensajeExito = productoEditando
        ? "Producto actualizado correctamente."
        : "Producto creado correctamente.";

      const nuevosProductos = await productoService.obtenerTodos();

      setProductos(nuevosProductos);
      setMostrarFormulario(false);
      setProductoEditando(null);
      setFormulario({ ...formularioInicial });
      setMensaje(mensajeExito);
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar producto
  const eliminarProducto = async (producto) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar "${producto.nombre}"?`
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");
    setEliminandoId(producto.id);

    try {
      await productoService.eliminar(producto.id);

      setProductos((actuales) =>
        actuales.filter((item) => item.id !== producto.id)
      );

      setMensaje("Producto eliminado correctamente.");
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div>
      {/* ENCABEZADO */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Productos</h2>
          <p className="text-muted mb-0">
            Gestión del inventario de la tienda
          </p>
        </div>

        {esAdmin && !mostrarFormulario && (
          <button
            className="btn btn-primary"
            onClick={abrirCrear}
            disabled={cargando}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Nuevo producto
          </button>
        )}
      </div>

      {/* MENSAJES */}
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
          Tu cuenta tiene permisos de consulta.
          Solo un administrador puede modificar productos.
        </div>
      )}

      {/* ESTADÍSTICAS */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between">
                <span className="text-muted">Productos</span>
                <i className="bi bi-box-seam text-primary fs-4"></i>
              </div>
              <h2 className="fw-bold mt-2">
                {cargando ? "..." : totalProductos}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between">
                <span className="text-muted">Unidades en stock</span>
                <i className="bi bi-boxes text-success fs-4"></i>
              </div>
              <h2 className="fw-bold mt-2">
                {cargando ? "..." : totalUnidades}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between">
                <span className="text-muted">Agotados</span>
                <i className="bi bi-exclamation-triangle text-danger fs-4"></i>
              </div>
              <h2 className="fw-bold mt-2">
                {cargando ? "..." : agotados}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO */}
      {mostrarFormulario && esAdmin && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">
              {productoEditando
                ? "Editar producto"
                : "Registrar nuevo producto"}
            </h5>

            <form onSubmit={guardarProducto}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="nombreProducto" className="form-label">
                    Nombre *
                  </label>
                  <input
                    id="nombreProducto"
                    name="nombre"
                    className="form-control"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="categoriaProducto" className="form-label">
                    Categoría *
                  </label>
                  <select
                    id="categoriaProducto"
                    name="categoriaId"
                    className="form-select"
                    value={formulario.categoriaId}
                    onChange={manejarCambio}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label htmlFor="descripcionProducto" className="form-label">
                    Descripción
                  </label>
                  <textarea
                    id="descripcionProducto"
                    name="descripcion"
                    className="form-control"
                    rows={3}
                    maxLength={500}
                    value={formulario.descripcion}
                    onChange={manejarCambio}
                  />
                  <small className="text-muted">
                    {formulario.descripcion.length}/500 caracteres
                  </small>
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="precioProducto" className="form-label">
                    Precio (Bs) *
                  </label>
                  <input
                    id="precioProducto"
                    type="number"
                    name="precio"
                    className="form-control"
                    min="0.01"
                    max="999999999"
                    step="0.01"
                    value={formulario.precio}
                    onChange={manejarCambio}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="stockProducto" className="form-label">
                    Stock *
                  </label>
                  <input
                    id="stockProducto"
                    type="number"
                    name="stock"
                    className="form-control"
                    min="0"
                    step="1"
                    value={formulario.stock}
                    onChange={manejarCambio}
                    required
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando || categorias.length === 0}
                >
                  <i className="bi bi-check-lg me-2"></i>
                  {guardando ? "Guardando..." : "Guardar producto"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={cancelarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTADO */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3 align-items-center mb-4">
            <div className="col-12 col-lg-4">
              <h5 className="fw-bold mb-0">Listado de productos</h5>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <input
                type="search"
                className="form-control"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <select
                className="form-select"
                aria-label="Filtrar por categoría"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>

                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  {esAdmin && <th>Acciones</th>}
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td
                      colSpan={esAdmin ? 6 : 5}
                      className="text-center py-4"
                    >
                      Cargando productos...
                    </td>
                  </tr>
                ) : productosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={esAdmin ? 6 : 5}
                      className="text-center py-4 text-muted"
                    >
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((producto) => (
                    <tr key={producto.id}>
                      <td>{producto.id}</td>

                      <td>
                        <div className="fw-semibold">
                          {producto.nombre}
                        </div>
                        <small className="text-muted">
                          {producto.descripcion || "Sin descripción"}
                        </small>
                      </td>

                      <td>
                        <span className="badge text-bg-light border">
                          {producto.categoriaNombre || "Sin categoría"}
                        </span>
                      </td>

                      <td className="fw-semibold">
                        {formatoPrecio.format(producto.precio)}
                      </td>

                      <td>
                        {producto.stock === 0 ? (
                          <span className="badge text-bg-danger">
                            Agotado
                          </span>
                        ) : producto.stock <= 5 ? (
                          <span className="badge text-bg-warning">
                            Bajo: {producto.stock}
                          </span>
                        ) : (
                          <span className="badge text-bg-success">
                            {producto.stock} unidades
                          </span>
                        )}
                      </td>

                      {esAdmin && (
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => abrirEditar(producto)}
                              disabled={eliminandoId !== null}
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Editar
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => eliminarProducto(producto)}
                              disabled={eliminandoId !== null}
                            >
                              <i className="bi bi-trash me-1"></i>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted small">
            Mostrando {productosFiltrados.length} de{" "}
            {productos.length} productos.
          </div>
        </div>
      </div>
    </div>
  );
}
