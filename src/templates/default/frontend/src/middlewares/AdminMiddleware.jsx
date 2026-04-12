import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function AdminMiddleware({ children }) {
  const { user, isPending } = useAuth();

  if (isPending) return null;
  if (!user) return <Navigate to="/auth/login" />; // Change this to your desired login route
  if (user.role !== "admin") return <Navigate to="/" />; // Change this to your desired forbidden route

  return children;
}

AdminMiddleware.propTypes = {
  children: PropTypes.node.isRequired,
};
