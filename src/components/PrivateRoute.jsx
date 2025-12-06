// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { authUtils } from "../utils/authUtils";

export default function PrivateRoute({ children }) {
  const isAuthenticated = authUtils.isAuthenticated(); // true si token existe

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
