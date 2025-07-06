import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children, allowedRoles }) {
  const { token, role } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />; // create this page or redirect somewhere else
  }

  return children;
}
