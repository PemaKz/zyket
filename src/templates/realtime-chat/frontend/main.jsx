import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import AuthView from './src/views/AuthView'
import ChatView from './src/views/ChatView'
import LoggedMiddleware from './src/middlewares/LoggedMiddleware'
import NotLoggedMiddleware from './src/middlewares/NotLoggedMiddleware'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/auth" element={<NotLoggedMiddleware><AuthView /></NotLoggedMiddleware>} />
      <Route path="/chat" element={<LoggedMiddleware><ChatView /></LoggedMiddleware>} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  </BrowserRouter>
)
