
import { useEffect, useMemo, useState } from "react";
import { pedidoService } from "../services/pedidoService";
import { productoService } from "../services/productoService";
import { clienteService } from "../services/clienteService";
import { authService } from "../services/authService";

const estados = ["Pendiente", "Pagado", "Enviado", "Entregado"];

const moneda = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
});

function mensajeError(err) {
  const data = err.response?.data;

  if (data?.mensaje) return data.mensaje;
  if (data?.errors)
    return Object.values(data.errors).flat().join(" | ");

  if (err.response?.status === 403)
    return "No tienes permisos para esta operación.";

  if (!err.response)
    return "No se pudo conectar con el backend.";

  return `Error HTTP ${err.response.status}.`;
}

export default function PedidosPage() {
  const esAdmin = authService.esAdmin();

  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [detalles, setDetalles] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarDatos() {
    setCargando(true);

    try {
      const [listaPedidos, listaClientes, listaProductos] =
        await Promise.all([
          pedidoService.obtenerTodos(),
          clienteService.obtenerTodos(),
          productoService.obtenerTodos(),
        ]);

      setPedidos(listaPedidos);
      setClientes(listaClientes);
      setProductos(listaProductos);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const detallesCalculados = useMemo(() => {
    return detalles.map((detalle) => {
      const producto = productos.find(
        (p) => p.id === detalle.productoId
      );

      return {
        ...detalle,
        nombre: producto?.nombre || "Producto",
        precio: Number(producto?.precio || 0),
        subtotal: Number(producto?.precio || 0) * detalle.cantidad,
      };
    });
  }, [detalles, productos]);

  const totalEstimado = detallesCalculados.reduce(
    (total, d) => total + d.subtotal,
    0
  );

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return pedidos.filter((pedido) => {
      return [
        String(pedido.id),
        pedido.clienteNombre,
        pedido.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [pedidos, busqueda]);

  const agregarProducto = () => {
    const id = Number(productoId);
    const unidades = Number(cantidad);
    const producto = productos.find((p) => p.id === id);

    setError("");

    if (!producto || !Number.isInteger(unidades) || unidades <= 0) {
      setError("Selecciona un producto y una cantidad válida.");
      return;
    }

    const existente = detalles.find((d) => d.productoId === id);
    const acumulado = (existente?.cantidad || 0) + unidades;

    if (acumulado > producto.stock) {
      setError(`Stock insuficiente. Disponible: ${producto.stock}.`);
      return;
    }

    if (existente) {
      setDetalles((actuales) =>
        actuales.map((d) =>
          d.productoId === id
            ? { ...d, cantidad: acumulado }
            : d
        )
      );
    } else {
      setDetalles((actuales) => [
        ...actuales,
        { productoId: id, cantidad: unidades },
      ]);
    }

    setProductoId("");
    setCantidad(1);
  };

  const quitarProducto = (id) => {
    setDetalles((actuales) =>
      actuales.filter((d) => d.productoId !== id)
    );
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setClienteId("");
    setDetalles([]);
    setError("");
  };

  const guardarPedido = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!clientes.some((c) => c.id === Number(clienteId))) {
      setError("Selecciona un cliente válido.");
      return;
    }

    if (detalles.length === 0) {
      setError("Agrega al menos un producto al pedido.");
      return;
    }

    setProcesando(true);

    try {
      const nuevo = await pedidoService.crear(clienteId, detalles);

      setMostrarFormulario(false);
      setClienteId("");
      setDetalles([]);

      await cargarDatos();
      setMensaje(`Pedido #${nuevo.id} registrado correctamente.`);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const cambiarEstado = async (pedido, estado) => {
    setError("");
    setMensaje("");
    setProcesando(true);

    try {
      await pedidoService.cambiarEstado(pedido.id, estado);
      await cargarDatos();
      setMensaje(`Estado del pedido #${pedido.id} actualizado.`);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const eliminarPedido = async (pedido) => {
    if (!window.confirm(
      `¿Eliminar el pedido #${pedido.id}? Se devolverá su stock.`
    )) return;

    setError("");
    setMensaje("");
    setProcesando(true);

    try {
      await pedidoService.eliminar(pedido.id);
      setPedidoDetalle(null);
      await cargarDatos();
      setMensaje("Pedido eliminado y stock devuelto.");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Pedidos</h2>
          <p className="text-muted mb-0">
            Registro y seguimiento de ventas
          </p>
        </div>

        {!mostrarFormulario && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setError("");
              setMensaje("");
              setMostrarFormulario(true);
            }}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Nuevo pedido
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {mensaje && (
        <div className="alert alert-success">{mensaje}</div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <span className="text-muted">Total pedidos</span>
              <h2 className="fw-bold mt-2">{pedidos.length}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <span className="text-muted">Pendientes</span>
              <h2 className="fw-bold mt-2">
                {pedidos.filter((p) => p.estado === "Pendiente").length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <span className="text-muted">Valor total de pedidos</span>
              <h2 className="fw-bold mt-2">
                {moneda.format(
                  pedidos.reduce((s, p) => s + Number(p.total), 0)
                )}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">Registrar pedido</h5>

            <form onSubmit={guardarPedido}>
              <div className="mb-3">
                <label htmlFor="clientePedido" className="form-label">
                  Cliente *
                </label>
                <select
                  id="clientePedido"
                  className="form-select"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} — {cliente.correo}
                    </option>
                  ))}
                </select>
              </div>

              <h6 className="fw-bold mt-4">Agregar productos</h6>

              <div className="row g-3 align-items-end mb-3">
                <div className="col-md-7">
                  <label htmlFor="productoPedido" className="form-label">
                    Producto
                  </label>
                  <select
                    id="productoPedido"
                    className="form-select"
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.filter((p) => p.stock > 0).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — {moneda.format(p.precio)}
                        {" "}({p.stock} disponibles)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2">
                  <label htmlFor="cantidadPedido" className="form-label">
                    Cantidad
                  </label>
                  <input
                    id="cantidadPedido"
                    type="number"
                    className="form-control"
                    min="1"
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100"
                    onClick={agregarProducto}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Agregar
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detallesCalculados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Todavía no agregaste productos.
                        </td>
                      </tr>
                    ) : (
                      detallesCalculados.map((d) => (
                        <tr key={d.productoId}>
                          <td>{d.nombre}</td>
                          <td>{d.cantidad}</td>
                          <td>{moneda.format(d.precio)}</td>
                          <td>{moneda.format(d.subtotal)}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => quitarProducto(d.productoId)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <h5 className="text-end fw-bold">
                Total estimado: {moneda.format(totalEstimado)}
              </h5>

              <div className="d-flex gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={procesando || detalles.length === 0}
                >
                  {procesando ? "Guardando..." : "Confirmar pedido"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={cancelarFormulario}
                  disabled={procesando}
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
            <h5 className="fw-bold mb-0">Listado de pedidos</h5>
            <input
              className="form-control"
              style={{ maxWidth: 300 }}
              placeholder="Buscar pedido, cliente o estado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      Cargando pedidos...
                    </td>
                  </tr>
                ) : pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No se encontraron pedidos.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>#{pedido.id}</td>
                      <td>{pedido.clienteNombre}</td>
                      <td>{new Date(pedido.fecha).toLocaleString("es-BO")}</td>
                      <td className="fw-semibold">
                        {moneda.format(pedido.total)}
                      </td>
                      <td>
                        {esAdmin ? (
                          <select
                            className="form-select form-select-sm"
                            value={pedido.estado}
                            disabled={procesando}
                            onChange={(e) =>
                              cambiarEstado(pedido, e.target.value)
                            }
                          >
                            {estados.map((estado) => (
                              <option key={estado} value={estado}>
                                {estado}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="badge text-bg-secondary">
                            {pedido.estado}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setPedidoDetalle(pedido)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            Detalles
                          </button>

                          {esAdmin && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={procesando}
                              onClick={() => eliminarPedido(pedido)}
                            >
                              <i className="bi bi-trash me-1"></i>
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {pedidoDetalle && (
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between">
              <h5 className="fw-bold">
                Detalle del pedido #{pedidoDetalle.id}
              </h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setPedidoDetalle(null)}
              >
                Cerrar
              </button>
            </div>

            <p className="text-muted">
              Cliente: {pedidoDetalle.clienteNombre}
            </p>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidoDetalle.detalles.map((d) => (
                    <tr key={d.id}>
                      <td>{d.productoNombre}</td>
                      <td>{d.cantidad}</td>
                      <td>{moneda.format(d.precioUnitario)}</td>
                      <td>{moneda.format(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h5 className="fw-bold text-end">
              Total: {moneda.format(pedidoDetalle.total)}
            </h5>
          </div>
        </div>
      )}
    </div>
  );
}
