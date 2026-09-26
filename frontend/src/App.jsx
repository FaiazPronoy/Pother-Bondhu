import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Rescues from './pages/Rescues';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import ProfilePage from './pages/Profile';
import VolunteersPage from './pages/VolunteersPage';
import VolunteerProfile from './pages/VolunteerProfile';
import CheckoutPage from './pages/CheckoutPage';
import CreateTeam from './pages/CreateTeam';
import MyTeam from './pages/MyTeam';
import TeamInvitations from './pages/TeamInvitation';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';
import NotFound from './pages/NotFound';
import ProtectedAdminRoute from './components/ProtectAdminRoute';

// the admin screens carry the charts and animation code; visitors never need it
const OrderPage = lazy(() => import('./components/OrderPage'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const VolunteerPage = lazy(() => import('./components/VolunteerPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const RevenuePage = lazy(() => import('./components/RevenuePage'));
const admin = (page) => (
  <ProtectedAdminRoute>
    <Suspense fallback={<p className="p-10 text-center text-ink-2">Loading…</p>}>{page}</Suspense>
  </ProtectedAdminRoute>
);

const App = () => {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] btn btn-clay">
        Skip to content
      </a>
      <ToastContainer position="top-center" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/adminorders" element={admin(<OrderPage />)} />
        <Route path="/adminproducts" element={admin(<ProductPage />)} />
        <Route path="/adminvolunteers" element={admin(<VolunteerPage />)} />
        <Route path="/admindashboard" element={admin(<AdminDashboard />)} />
        <Route path="/adminrevenue" element={admin(<RevenuePage />)} />

        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/rescues" element={<Rescues />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/products" element={<Products />} />
          <Route path="/products/category/:category" element={<Products />} />
          <Route path="/search" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          <Route path="/volunteers" element={<VolunteersPage />} />
          <Route path="/volunteers/:id" element={<VolunteerProfile />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:key" element={<TeamDetails />} />
          <Route path="/createteam" element={<CreateTeam />} />
          <Route path="/my-team" element={<MyTeam />} />
          <Route path="/team-invitations" element={<TeamInvitations />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
