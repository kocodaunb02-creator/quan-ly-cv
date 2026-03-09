import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy loading pages for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <React.Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#FAFAFA]">Loading...</div>}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />

                        {/* Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            {/* Add more protected routes here later */}
                        </Route>

                        {/* Default Redirect */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </React.Suspense>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
