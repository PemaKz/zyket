import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function LoggedMiddleware({ children }) {
  const { user, isPending } = useAuth();
  if (isPending) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

LoggedMiddleware.propTypes = { children: PropTypes.node.isRequired };
