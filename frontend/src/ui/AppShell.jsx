import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function AppShell({ children }) {
  const location = useLocation()
  const hideFooter = location.pathname === '/login' || location.pathname === '/signup'

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">{children}</div>
      {hideFooter ? null : <Footer />}
    </div>
  )
}
