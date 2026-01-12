import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import BudgetListPage from './pages/BudgetListPage';
import BudgetFormPage from './pages/BudgetFormPage';
import BudgetViewPage from './pages/BudgetViewPage';
import ClientsPage from './pages/ClientsPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/budgets" element={
                        <ProtectedRoute>
                            <BudgetListPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/budgets/new" element={
                        <ProtectedRoute>
                            <BudgetFormPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/budgets/:id" element={
                        <ProtectedRoute>
                            <BudgetViewPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/budgets/:id/edit" element={
                        <ProtectedRoute>
                            <BudgetFormPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/clients" element={
                        <ProtectedRoute>
                            <ClientsPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    } />

                    <Route path="/" element={<Navigate to="/budgets" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
