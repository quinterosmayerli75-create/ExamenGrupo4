
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function Navbar() {
  const navigate = useNavigate();
  const usuario = authService.getUsuario();

  const cerrarSesion = () => {
    authService.logout();
    window.dispatchEvent(new Event("sesion-actualizada"));
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-white border-bottom px-4 py-3">
      <div className="d-flex justify-content-between align-items-center gap-3">
        <h5 className="mb-0 fw-bold">
          Sistema de Ventas
        </h5>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end">
            <div className="fw-semibold">
              {usuario?.nombre || "Usuario"}
            </div>

            <small className="text-muted">
              {usuario?.rol || "Sin rol"}
            </small>
          </div>

          <button
            onClick={cerrarSesion}
            className="btn btn-outline-danger btn-sm"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
