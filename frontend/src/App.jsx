import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import HomePage from './pages/HomePage.jsx'
import PlanPage from './pages/PlanPage.jsx'
import ItineraryPage from './pages/ItineraryPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import SafetyChatbotPage from './pages/SafetyChatbotPage.jsx'

import { ThemeProvider } from './state/theme/ThemeProvider.jsx'
import AppShell from './ui/AppShell.jsx'

function ProtectedRoute({ children }) {
  const authenticated = localStorage.getItem('tripguard-authenticated') === 'true'
  return authenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/plan" element={<ProtectedRoute><PlanPage /></ProtectedRoute>} />
            <Route path="/itinerary" element={<ProtectedRoute><ItineraryPage /></ProtectedRoute>} />
            <Route path="/safety-chat" element={<ProtectedRoute><SafetyChatbotPage /></ProtectedRoute>} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  )
}
