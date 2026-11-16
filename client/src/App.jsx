import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout, ProtectedRoute } from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import {
  DashboardPage,
  ManageRoomsPage,
  BulkUtilityPage,
  ManageRepairsPage,
  TenantPortalPage
} from './pages/RolePages';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />

          {/* Route bảo vệ cho Chủ trọ */}
          <Route path="landlord" element={<ProtectedRoute allowedRoles={['landlord']} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="rooms" element={<ManageRoomsPage />} />
            <Route path="utilities" element={<BulkUtilityPage />} />
            <Route path="repairs" element={<ManageRepairsPage />} />
          </Route>

          {/* Route bảo vệ cho Người thuê */}
          <Route path="tenant" element={<ProtectedRoute allowedRoles={['tenant']} />}>
            <Route path="portal" element={<TenantPortalPage />} />
          </Route>

          {/* Trang 404 */}
          <Route path="*" element={<div className="p-8 text-center font-bold">404 - Không tìm thấy trang</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;