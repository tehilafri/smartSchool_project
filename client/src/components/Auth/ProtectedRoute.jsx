import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

function ProtectedRoute({ allowedRoles, children}) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;