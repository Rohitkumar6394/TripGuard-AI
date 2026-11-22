import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../state/theme/useTheme.js'
import { Moon, Sun, Menu, X, Monitor, LayoutDashboard, ShieldCheck } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/#home' },
  { label: 'Features', href: '/#features' },
  { label: 'Safety', href: '/#safety' },
  { label: 'How It Works', href: '/#how-it-works' },
]

export default function Navbar() {
  const { mode, setMode } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const themeMenuRef = useRef(null)
  const location = useLocation()
  const authenticated = localStorage.getItem('tripguard-authenticated') === 'true'

  useEffect(() => {
    if (!themeMenuOpen) return
    const close = (event) => {
      if (!themeMenuRef.current?.contains(event.target)) setThemeMenuOpen(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [themeMenuOpen])

  const showBackground = useMemo(() => location.pathname !== '/', [location.pathname])

  const logout = () => {
    localStorage.removeItem('tripguard-auth-token')
    localStorage.removeItem('tripguard-authenticated')
    localStorage.removeItem('tripguard-user')
    window.location.href = '/'
  }

  return (
    <header className={`fixed left-0 right-0 top-0 z-40 backdrop-blur-md ${showBackground ? 'bg-[color:var(--glass-strong)]' : 'bg-black/20'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="group inline-flex items-center gap-2">
          <motion.div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg" whileHover={{ rotate: -5 }}>
            <ShieldCheck size={21} />
          </motion.div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-[color:var(--text)]">TripGuard AI</div>
            <div className="hidden text-xs text-[color:var(--text-muted)] md:block">Plan smarter. Travel safer.</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {authenticated ? (
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-soft)] hover:text-[color:var(--text)]">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          ) : navItems.map(item => (
            <a key={item.label} href={item.href} className="text-sm text-[color:var(--text-soft)] hover:text-[color:var(--text)]">{item.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {authenticated ? (
            <>
              <Link to="/plan" className="hidden rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white sm:inline-flex">Plan Trip</Link>
              <button onClick={logout} className="hidden rounded-full border border-[color:var(--glass-border)] px-4 py-2 text-sm sm:inline-flex">Logout</button>
            </>
          ) : (
            <Link to="/login" className="hidden rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white sm:inline-flex">Sign in</Link>
          )}

          <div ref={themeMenuRef} className="relative hidden sm:block">
            <button onClick={() => setThemeMenuOpen(v => !v)} className="grid h-9 w-9 place-items-center rounded-2xl bg-[color:var(--glass)] ring-1 ring-[color:var(--glass-border)]">
              {mode === 'dark' ? <Moon size={18}/> : mode === 'light' ? <Sun size={18}/> : <Monitor size={18}/>}
            </button>
            <AnimatePresence>
              {themeMenuOpen && (
                <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="absolute right-0 mt-2 w-40 rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass-strong)] p-2 shadow-xl">
                  {['light','dark','system'].map(item => (
                    <button key={item} onClick={() => {setMode(item);setThemeMenuOpen(false)}} className="flex w-full rounded-xl px-3 py-2 text-left text-sm capitalize hover:bg-[color:var(--glass-hover)]">{item}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="grid h-9 w-9 place-items-center rounded-2xl bg-[color:var(--glass)] ring-1 ring-[color:var(--glass-border)] md:hidden" onClick={() => setMobileMenuOpen(v=>!v)}>
            {mobileMenuOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="border-t border-[color:var(--glass-border)] bg-[color:var(--glass-strong)] md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
              {(authenticated ? [{label:'Dashboard',href:'/dashboard'},{label:'AI Trip Planning',href:'/plan'},{label:'AI Itinerary',href:'/itinerary'},{label:'Safety Chatbot',href:'/safety-chat'}] : navItems).map(item => (
                <Link key={item.label} to={item.href} onClick={()=>setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm hover:bg-[color:var(--glass-hover)]">{item.label}</Link>
              ))}
              {authenticated ? <button onClick={logout} className="mt-2 rounded-xl bg-[color:var(--glass)] px-4 py-3 text-left text-sm">Logout</button> : <Link to="/login" onClick={()=>setMobileMenuOpen(false)} className="mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white">Sign in</Link>}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
