import React from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children ? children : <Outlet />;
};

export const MainLayout = () => {
  const { user, logoutUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded text-sm font-medium transition ${
      isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-600'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-700 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg tracking-wide">QUẢN LÝ NHÀ TRỌ HÀ ĐÔNG</span>
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/" end className={navLinkClass}>Phòng trống</NavLink>
              {user?.role === 'landlord' && (
                <>
                  <NavLink to="/landlord/dashboard" className={navLinkClass}>Dashboard</NavLink>
                  <NavLink to="/landlord/rooms" className={navLinkClass}>QL Phòng & HĐ</NavLink>
                  <NavLink to="/landlord/utilities" className={navLinkClass}>Điện nước & Hóa đơn</NavLink>
                  <NavLink to="/landlord/repairs" className={navLinkClass}>Sửa chữa & Liên hệ</NavLink>
                </>
              )}
              {user?.role === 'tenant' && (
                <NavLink to="/tenant/portal" className={navLinkClass}>Phòng của tôi & Hóa đơn</NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-xs"
            >
              {darkMode ? '☀ Sáng' : '🌙 Tối'}
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.fullName} ({user.role === 'landlord' ? 'Chủ trọ' : 'Người thuê'})</span>
                <button
                  onClick={() => { logoutUser(); navigate('/login'); }}
                  className="bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded text-xs"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="bg-white text-blue-700 font-semibold px-3 py-1 rounded text-xs">
                Đăng nhập
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};