import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import AuthView from './src/views/AuthView'
import DashboardView from './src/views/DashboardView'
import LoggedMiddleware from './src/middlewares/LoggedMiddleware'
import NotLoggedMiddleware from './src/middlewares/NotLoggedMiddleware'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<NotLoggedMiddleware><AuthView /></NotLoggedMiddleware>} />
      <Route path="/dashboard" element={<LoggedMiddleware><DashboardView /></LoggedMiddleware>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
)
