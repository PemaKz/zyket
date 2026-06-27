import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function NotLoggedMiddleware({ children }) {
  const { user, isPending } = useAuth();
  if (isPending) return null;
  if (user) return <Navigate to="/chat" replace />;
  return children;
}

NotLoggedMiddleware.propTypes = { children: PropTypes.node.isRequired };
