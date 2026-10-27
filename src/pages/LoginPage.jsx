
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      await authService.login(email, password);

      window.dispatchEvent(new Event("sesion-actualizada"));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card border-0 shadow">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <i className="bi bi-bag-check-fill text-primary auth-icon"></i>
            <h2 className="mt-3 fw-bold">Sistema de Ventas</h2>
            <p className="text-muted">
              Inicia sesión para continuar
            </p>
          </div>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <form onSubmit={iniciarSesion}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Correo electrónico
              </label>

              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={cargando}
            >
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-center mt-4 mb-0">
            ¿No tienes una cuenta?{" "}
            <Link to="/registro">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
