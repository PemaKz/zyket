import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function NotLoggedMiddleware ({ children }) {
  const { user, isPending } = useAuth();

  if(isPending) return null;
  if(user) return <Navigate to={`/panel`} />; // Change this to your desired home route for logged in users
  return children;
}

NotLoggedMiddleware.propTypes = {
  children: PropTypes.node.isRequired
};