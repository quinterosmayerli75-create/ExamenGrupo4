
import { useEffect, useMemo, useState } from "react";
import { clienteService } from "../services/clienteService";
import { authService } from "../services/authService";

const formularioInicial = {
    nombre: "",
    correo: "",
    telefono: "",
};

function obtenerMensajeError(error) {
    const data = error.response?.data;

    if (data?.mensaje) return data.mensaje;

    if (data?.errors) {
        return Object.values(data.errors).flat().join(" | ");
    }

    if (!error.response) {
        return "No se pudo conectar con el servidor.";
    }

    switch (error.response.status) {
        case 401:
            return "La sesión expiró. Inicia sesión nuevamente.";
        case 403:
            return "No tienes permisos para realizar esta operación.";
        case 404:
            return "El cliente ya no existe.";
        case 409:
            return "El correo electrónico ya está registrado.";
        case 500:
            return "Error interno del servidor. Revisa ASP.NET Core.";
        default:
            return `Error HTTP ${error.response.status}.`;
    }
}

export default function ClientesPage() {
    const esAdmin = authService.esAdmin();


    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const usuarioActual = authService.getUsuario();

    const clientesVisibles = useMemo(() => {
        if (esAdmin) return clientes;

        const correo = usuarioActual?.correo?.trim().toLowerCase();

        return clientes.filter(
            (cliente) =>
                cliente.correo?.trim().toLowerCase() === correo
        );
    }, [clientes, esAdmin, usuarioActual?.correo]);

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [eliminandoId, setEliminandoId] = useState(null);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [clienteEditando, setClienteEditando] = useState(null);
    const [formulario, setFormulario] = useState({
        ...formularioInicial,
    });

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const cargarClientes = async () => {
        setCargando(true);

        try {
            const datos = await clienteService.obtenerTodos();
            setClientes(datos);
            setError("");
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarClientes();
    }, []);


    const clientesFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return clientesVisibles.filter((cliente) => {
            const contenido = [
                cliente.nombre,
                cliente.correo,
                cliente.telefono,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return contenido.includes(texto);
        });
    }, [clientesVisibles, busqueda]);


    const abrirCrear = () => {
        setClienteEditando(null);
        setFormulario({ ...formularioInicial });
        setError("");
        setMensaje("");
        setMostrarFormulario(true);
    };

    const abrirEditar = (cliente) => {
        setClienteEditando(cliente);
        setFormulario({
            nombre: cliente.nombre,
            correo: cliente.correo,
            telefono: cliente.telefono || "",
        });
        setError("");
        setMensaje("");
        setMostrarFormulario(true);
    };

    const cancelar = () => {
        setMostrarFormulario(false);
        setClienteEditando(null);
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

    const guardarCliente = async (e) => {
        e.preventDefault();

        const nombre = formulario.nombre.trim();
        const correo = formulario.correo.trim().toLowerCase();
        const telefono = formulario.telefono.trim();

        if (!nombre || nombre.length > 100) {
            setError("El nombre debe tener entre 1 y 100 caracteres.");
            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
            correo.length > 150
        ) {
            setError("Ingresa un correo electrónico válido.");
            return;
        }

        if (telefono.length > 20) {
            setError("El teléfono no puede superar 20 caracteres.");
            return;
        }

        setGuardando(true);
        setError("");
        setMensaje("");

        const datosCliente = { nombre, correo, telefono };

        try {
            if (clienteEditando) {
                await clienteService.actualizar(
                    clienteEditando.id,
                    datosCliente
                );
            } else {
                await clienteService.crear(datosCliente);
            }

            const mensajeExito = clienteEditando
                ? "Cliente actualizado correctamente."
                : "Cliente registrado correctamente.";

            const listaActualizada = await clienteService.obtenerTodos();

            setClientes(listaActualizada);
            setMostrarFormulario(false);
            setClienteEditando(null);
            setFormulario({ ...formularioInicial });
            setMensaje(mensajeExito);
        } catch (err) {
            setError(obtenerMensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    const eliminarCliente = async (cliente) => {
        if (!esAdmin) return;

        const confirmar = window.confirm(
            `¿Estás seguro de eliminar a "${cliente.nombre}"?`
        );

        if (!confirmar) return;

        setError("");
        setMensaje("");
        setEliminandoId(cliente.id);

        try {
            await clienteService.eliminar(cliente.id);

            setClientes((actuales) =>
                actuales.filter((c) => c.id !== cliente.id)
            );

            setMensaje("Cliente eliminado correctamente.");
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
                    <h2 className="fw-bold mb-1">
                        {esAdmin ? "Clientes" : "Mi perfil"}
                    </h2>

                    <p className="text-muted mb-0">
                        {esAdmin
                            ? "Gestión de clientes del sistema de ventas"
                            : "Consulta y administra tus datos personales"}
                    </p>
                </div>

                {esAdmin && !mostrarFormulario && (
                    <button
                        className="btn btn-primary"
                        onClick={abrirCrear}
                    >
                        <i className="bi bi-person-plus me-2"></i>
                        Nuevo cliente
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

            {/* ESTADÍSTICAS */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">
                                    {esAdmin ? "Total de clientes" : "Mi registro"}
                                </span>
                                <i className="bi bi-people text-primary fs-4"></i>
                            </div>
                            <h2 className="fw-bold mt-2 mb-0">
                                {cargando ? "..." : clientesVisibles.length}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">Resultados visibles</span>
                                <i className="bi bi-search text-success fs-4"></i>
                            </div>
                            <h2 className="fw-bold mt-2 mb-0">
                                {cargando ? "..." : clientesFiltrados.length}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* FORMULARIO */}
            {mostrarFormulario && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">
                        <h5 className="fw-bold mb-4">
                            {clienteEditando
                                ? "Editar cliente"
                                : "Registrar nuevo cliente"}
                        </h5>

                        <form onSubmit={guardarCliente}>
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <label htmlFor="nombreCliente" className="form-label">
                                        Nombre completo *
                                    </label>
                                    <input
                                        id="nombreCliente"
                                        type="text"
                                        name="nombre"
                                        className="form-control"
                                        maxLength={100}
                                        value={formulario.nombre}
                                        onChange={manejarCambio}
                                        required
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label htmlFor="correoCliente" className="form-label">
                                        Correo electrónico *
                                    </label>
                                    <input
                                        id="correoCliente"
                                        type="email"
                                        name="correo"
                                        className="form-control"
                                        maxLength={150}
                                        value={formulario.correo}
                                        onChange={manejarCambio}
                                        readOnly={Boolean(clienteEditando)}
                                        required
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label htmlFor="telefonoCliente" className="form-label">
                                        Teléfono
                                    </label>
                                    <input
                                        id="telefonoCliente"
                                        type="tel"
                                        name="telefono"
                                        className="form-control"
                                        maxLength={20}
                                        value={formulario.telefono}
                                        onChange={manejarCambio}
                                        placeholder="Ej. 70707070"
                                    />
                                </div>
                            </div>

                            <div className="d-flex gap-2 mt-4">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={guardando}
                                >
                                    <i className="bi bi-check-lg me-2"></i>
                                    {guardando ? "Guardando..." : "Guardar cliente"}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={cancelar}
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LISTADO DE CLIENTES */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                        <h5 className="fw-bold mb-0">
                            Listado de clientes
                        </h5>

                        <input
                            type="search"
                            className="form-control"
                            style={{ maxWidth: 320 }}
                            placeholder="Buscar nombre, correo o teléfono..."
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
                                    <th>Correo</th>
                                    <th>Teléfono</th>
                                    <th className="text-end">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4">
                                            Cargando clientes...
                                        </td>
                                    </tr>
                                ) : clientesFiltrados.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center text-muted py-4"
                                        >
                                            No se encontraron clientes.
                                        </td>
                                    </tr>
                                ) : (
                                    clientesFiltrados.map((cliente) => (
                                        <tr key={cliente.id}>
                                            <td>{cliente.id}</td>
                                            <td className="fw-semibold">
                                                {cliente.nombre}
                                            </td>
                                            <td>{cliente.correo}</td>
                                            <td>{cliente.telefono || "No registrado"}</td>
                                            <td>
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => abrirEditar(cliente)}
                                                        disabled={eliminandoId !== null}
                                                    >
                                                        <i className="bi bi-pencil me-1"></i>
                                                        Editar
                                                    </button>

                                                    {esAdmin && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => eliminarCliente(cliente)}
                                                            disabled={eliminandoId !== null}
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

                    <small className="text-muted">
                        Mostrando {clientesFiltrados.length} de{" "}
                        {clientes.length} clientes.
                    </small>
                </div>
            </div>
        </div>
    );
}
