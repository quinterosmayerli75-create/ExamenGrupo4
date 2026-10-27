
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { authService } from "../services/authService";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import CategoriasPage from "../pages/CategoriasPage";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProductosPage from "../pages/ProductosPage";
import ClientesPage from "../pages/ClientesPage";
import PedidosPage from "../pages/PedidosPage";
function RutaProtegida() {
  const [autenticado, setAutenticado] = useState(
    authService.estaAutenticado()
  );

  useEffect(() => {
    const actualizarSesion = () => {
      setAutenticado(authService.estaAutenticado());
    };

    window.addEventListener("sesion-expirada", actualizarSesion);
    window.addEventListener("sesion-actualizada", actualizarSesion);

    return () => {
      window.removeEventListener("sesion-expirada", actualizarSesion);
      window.removeEventListener("sesion-actualizada", actualizarSesion);
    };
  }, []);

  return autenticado ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}

function LayoutPrincipal() {
  return (
    <div className="d-flex min-vh-100">
      <Sidebar />

      <div className="flex-grow-1 min-width-0">
        <Navbar />

        <main className="container-fluid p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ModuloPendiente({ titulo }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h2>{titulo}</h2>
        <p className="text-muted mb-0">
          Este módulo se implementará en la siguiente etapa.
        </p>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/registro" element={<RegisterPage />} />

        <Route element={<RutaProtegida />}>
          <Route element={<LayoutPrincipal />}>
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
            path="/productos"
            element={<ProductosPage />}
            />

            <Route
                path="/categorias"
                element={<CategoriasPage />}
                />

            <Route
                path="/clientes"
                element={<ClientesPage />}
                />

            <Route
            path="/pedidos"
            element={<PedidosPage />}
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
