import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const ProtectedAdminRoute = ({ children }) => {
  const { isLoggedIn, userData } = useContext(AppContext);

  if (!isLoggedIn || userData?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
