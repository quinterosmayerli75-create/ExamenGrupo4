
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombreUsuario: "",
    email: "",
    password: "",
    confirmarPassword: "",
  });

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarCambio = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const registrar = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);

    try {
      await authService.registro(
        form.nombreUsuario,
        form.email,
        form.password
      );

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error en el registro:", err);

      const status = err.response?.status;
      const data = err.response?.data;

      if (!err.response) {
        setError(
          "No se pudo conectar con la API. Verifica el backend y CORS."
        );
      } else if (data?.errors) {
        const mensajes = Object.values(data.errors).flat();
        setError(mensajes.join(" | "));
      } else if (data?.mensaje) {
        setError(data.mensaje);
      } else if (status === 400) {
        setError("Los datos enviados no son válidos.");
      } else if (status === 500) {
        setError("Error interno del servidor.");
      } else {
        setError(`Error HTTP ${status}: no se pudo registrar.`);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card border-0 shadow">
        <div className="card-body p-4 p-md-5">
          <h2 className="fw-bold text-center mb-2">
            Crear cuenta
          </h2>

          <p className="text-muted text-center mb-4">
            Regístrate en el Sistema de Ventas
          </p>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <form onSubmit={registrar}>
            <div className="mb-3">
              <label htmlFor="nombreUsuario" className="form-label">
                Nombre de usuario
              </label>

              <input
                id="nombreUsuario"
                name="nombreUsuario"
                className="form-control"
                maxLength={100}
                value={form.nombreUsuario}
                onChange={manejarCambio}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="registroEmail" className="form-label">
                Correo electrónico
              </label>

              <input
                id="registroEmail"
                type="email"
                name="email"
                className="form-control"
                value={form.email}
                onChange={manejarCambio}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="registroPassword" className="form-label">
                Contraseña
              </label>

              <input
                id="registroPassword"
                type="password"
                name="password"
                className="form-control"
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={manejarCambio}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirmarPassword" className="form-label">
                Confirmar contraseña
              </label>

              <input
                id="confirmarPassword"
                type="password"
                name="confirmarPassword"
                className="form-control"
                autoComplete="new-password"
                value={form.confirmarPassword}
                onChange={manejarCambio}
                required
              />
            </div>

            <button
              className="btn btn-primary w-100"
              type="submit"
              disabled={cargando}
            >
              {cargando ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center mt-4 mb-0">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
