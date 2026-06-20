import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import DashboardPage from '../pages/DashboardPage'
import BoardersPage from '../pages/BoardersPage'
import RoomsPage from '../pages/RoomsPage'
import PaymentsPage from '../pages/PaymentsPage'
import ReportsPage from '../pages/ReportsPage'
import SettingsPage from '../pages/SettingsPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="boarders" element={<BoardersPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}