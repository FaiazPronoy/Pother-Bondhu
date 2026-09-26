import React, { useState, useContext } from 'react';
import { Package, Menu, ClipboardList, Wallet, LayoutDashboard, Users, LogOut, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DarkmodeContext } from '../context/DarkmodeContext';
import { AppContext } from '../context/AppContext';
import { Wordmark, LangButton } from './bits';
import { useLang } from '../context/LangContext';

const AdminNavbar = ({ isSidebarOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useContext(DarkmodeContext);
  const { logout } = useContext(AppContext);
  const { t } = useLang();
  const SidebarItem = ({ icon, label, showLabel, onClick, isActive }) => {
    let baseClasses = 'flex items-center gap-2 cursor-pointer transition-colors duration-200';
    const activeColour = isDarkMode ? 'text-blue-300' : 'text-blue-800';
    let activeClasses = isSidebarOpen
      ? `${activeColour} font-bold rounded-md px-2 py-1 shadow-md`
      : `${activeColour} font-semibold rounded-md`;
    let hoverClasses = isSidebarOpen
      ? isDarkMode
        ? 'text-gray-300 hover:text-white hover:bg-white/10 rounded-md px-2 py-1'
        : 'text-blue-800 font-semibold rounded-md px-2 py-1 hover:shadow-blue-900'
      : `${isDarkMode ? 'text-white' : 'text-blue-800 font-semibold py-0.75'}`;

    const finalClasses = isActive
      ? `${baseClasses} ${activeClasses}`
      : `${baseClasses} ${hoverClasses}`;

    return (
      <div
        className={finalClasses}
        onClick={onClick}
        style={{ marginBottom: '15px' }}
      >
        {React.cloneElement(icon, {
          size: isSidebarOpen ? 26 : 26
        })}
        {showLabel && <span>{label}</span>}
      </div>
    );
  };

  const handleLogout = async () => {
    setIsDialogOpen(false);
    await logout();
    navigate('/login');
    setActiveTab('Dashboard');
  };

  return (
    <aside
      className={`shrink-0 transition-all duration-300 ${isSidebarOpen ? "w-64 border-r" : "w-16"
        } ${isDarkMode ? 'bg-black border-r-white/20' : 'bg-gray-100 border-r-transparent'} text-white p-4 relative`}
    >
      <div className="flex items-center justify-between mb-6">
        {isSidebarOpen ? (
          <Link to="/" aria-label={t("admin.backToSite")} className={isDarkMode ? 'text-white' : 'text-gray-900'}>
            <Wordmark size="text-xl" />
          </Link>
        ) : (
          <div />
        )}

        <button
          onClick={toggleSidebar}
          className={`text-white bg-transparent border-none p-0 transition-all duration-300 ${!isSidebarOpen ? 'mr-1' : '' // Add margin-left when sidebar is off
            }`}
          aria-label={isSidebarOpen ? t("admin.collapse") : t("admin.expand")}
        >
          <Menu className={`text-xl font-boldest ${isDarkMode ? 'text-white' : 'text-blue-800'}`} size={isSidebarOpen ? 24 : 30} />
        </button>
      </div>
      <nav className="space-y-4">
        <Link to="/admindashboard" style={{ textDecoration: 'none' }}>
          <SidebarItem icon={<LayoutDashboard />} label={t("admin.dashboard")} showLabel={isSidebarOpen} onClick={() => setActiveTab('Dashboard')} isActive={activeTab === 'Dashboard'} />
        </Link>
        <Link to="/adminproducts" style={{ textDecoration: 'none' }}>
          <SidebarItem icon={<Package />} label={t("admin.products")} showLabel={isSidebarOpen} onClick={() => setActiveTab('Products')} isActive={activeTab === 'Products'} />
        </Link>
        <Link to="/adminorders" style={{ textDecoration: 'none' }}>
          <SidebarItem icon={<ClipboardList />} label={t("admin.orders")} showLabel={isSidebarOpen} onClick={() => setActiveTab('Orders')} isActive={activeTab === 'Orders'} />
        </Link>
        <Link to="/adminvolunteers" style={{ textDecoration: 'none' }}>
          <SidebarItem icon={<Users />} label={t("admin.volunteers")} showLabel={isSidebarOpen} onClick={() => setActiveTab('Volunteers')} isActive={activeTab === 'Volunteers'} />
        </Link>
        <Link to="/adminrevenue" style={{ textDecoration: 'none' }}>
          <SidebarItem icon={<Wallet />} label={t("admin.revenue")} showLabel={isSidebarOpen} onClick={() => setActiveTab('Revenue & Profit')} isActive={activeTab === 'Revenue & Profit'} />
        </Link>
        <div style={{ textDecoration: 'none' }}>
          <SidebarItem
            icon={<LogOut />}
            label={t("admin.logout")}
            showLabel={isSidebarOpen}
            onClick={() => setIsDialogOpen(true)}
            isActive={false}
          />
        </div>
      </nav>

      {isSidebarOpen && <LangButton className={`mt-4 ${isDarkMode ? '!text-gray-300 hover:!text-white hover:!bg-white/10' : ''}`} />}

      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-5 left-3.5 cursor-pointer focus:outline-none transition-all duration-300
          ${isDarkMode ? 'bg-gray-600 rounded-full p-2' : 'bg-blue-800 rounded-full p-2 '}
        `}
        style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {isDarkMode ? <Sun className="text-xl text-white" /> : <Moon className="text-xl text-white" />}
      </button>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-md">
          <div className={`rounded-lg shadow-lg p-6 w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-semibold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>
              {t("admin.sure")}
            </h2>
            <p className={`text-sm text-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              {t("admin.logoutQ")}
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="bg-blue-600 text-white px-4 py-2 rounded-md mr-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t("admin.yes")}
              </button>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t("admin.no")}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AdminNavbar;

