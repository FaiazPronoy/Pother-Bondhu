import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

// the role comes from the server's status check, not from anything the
// browser stored, so it cannot be edited into "admin" from dev tools
const ProtectedAdminRoute = ({ children }) => {
  const { isLoggedIn, userData } = useContext(AppContext);

  if (!isLoggedIn || userData?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
