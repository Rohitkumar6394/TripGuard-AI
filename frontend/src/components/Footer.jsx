import { Link } from 'react-router-dom'
import { ShieldCheck, Camera, Briefcase, Code2 } from 'lucide-react'

const quickLinks = [
  { label: 'Home', to: '/#home' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'About Us', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
]

const features = [
  { label: 'AI Trip Planner', to: '/plan' },
  { label: 'AI Itinerary', to: '/itinerary' },
  { label: 'Safety Analysis', to: '/safety-chat' },
  { label: 'Weather', to: '/dashboard' },
]

const support = [
  { label: 'Help Center', to: '#' },
  { label: 'Contact', to: '/#contact' },
  { label: 'FAQ', to: '#' },
]

const social = [
  { label: 'Instagram', href: 'https://www.instagram.com', icon: Camera, color: 'text-pink-400 hover:bg-pink-500' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: Briefcase, color: 'text-blue-400 hover:bg-blue-600' },
  { label: 'GitHub', href: 'https://github.com/settings/profile', icon: Code2, color: 'text-zinc-300 hover:bg-zinc-600' },
]

function FooterColumns({ title, items }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-orange-400">
        {title}
      </h4>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link to={item.to} className="text-sm text-[color:var(--text-muted)] transition hover:text-orange-400">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[color:var(--glass-border)] bg-[color:var(--bg-1)]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-5">

          {/* Logo and Tagline */}
          <div className="md:col-span-2">
            <Link to="/#home" className="group inline-flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 text-white ring-1 ring-[color:var(--glass-border)]">
                <ShieldCheck size={21} />
              </div>
              <span className="text-lg font-extrabold text-orange-400">TripGuard AI</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-[color:var(--text-muted)]">
              AI-powered travel planning, safety &amp; smart recommendations.
            </p>
          </div>

          {/* Columns */}
          <FooterColumns title="Quick Links" items={quickLinks} />
          <FooterColumns title="Features" items={features} />
          <FooterColumns title="Support" items={support} />

          {/* Follow Us */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-orange-400">Follow Us</h4>
            <div className="flex gap-3">
              {social.map(({ label, href, icon: Icon, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`grid h-11 w-11 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition ${color}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[color:var(--glass-border)] pt-6 text-xs text-[color:var(--text-muted)] sm:flex-row">
          <div>Copyright © TripGuard AI — All Rights Reserved</div>
          <div className="flex items-center gap-4">
            <button className="transition hover:text-orange-400">Privacy Policy</button>
            <span>|</span>
            <button className="transition hover:text-orange-400">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  )
}