import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/clerk-react'
import { useTheme } from '../contexts/ThemeContext'

function RulerLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="10" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <line x1="6"  y1="7" x2="6"  y2="13" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="10" y1="7" x2="10" y2="11" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="14" y1="7" x2="14" y2="13" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="18" y1="7" x2="18" y2="11" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user }               = useUser()
  const location               = useLocation()
  const navigate               = useNavigate()
  const isDash                 = location.pathname.startsWith('/dashboard')

  const handleAnchor = (sectionId) => {
    if (location.pathname !== '/') { navigate('/'); setTimeout(() => scrollTo(sectionId), 150) }
    else scrollTo(sectionId)
  }

  const navTo = (id) => window.dispatchEvent(new CustomEvent('qm-nav', { detail: id }))

  return (
    <nav className="nav-fixed">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '100%', gap: '1.5rem' }}>

        {/* Toggle (Dashboard only) */}
        {isDash && (
          <button className="menu-toggle" onClick={() => window.dispatchEvent(new CustomEvent('qm-toggle-sidebar'))} title="Toggle Menu">
            <i className="fas fa-bars"></i>
          </button>
        )}

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#1d4ed8,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px var(--glow-blue)' }}>
            <RulerLogo size={20} />
          </div>
          QuantiMeasure
        </Link>

        {/* Landing nav links */}
        {!isDash && (
          <div className="nav-links-desktop" style={{ display: 'flex', gap: '.1rem' }}>
            <button className="nl" onClick={() => handleAnchor('features')}><i className="fas fa-star"></i> Features</button>
            <button className="nl" onClick={() => handleAnchor('operations')}><i className="fas fa-exchange-alt"></i> Operations</button>
            <button className="nl" onClick={() => handleAnchor('how-it-works')}><i className="fas fa-circle-play"></i> How it works</button>
          </div>
        )}

        {/* Dashboard nav links — Hidden in favor of hamburger drawer */}


        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          {/* Signed OUT — show Sign In / Get Started */}
          <SignedOut>
            <Link to="/sign-in" className="btn btn-s btn-sm">Sign In</Link>
            <Link to="/sign-up" className="btn btn-p btn-sm">
              Get Started <i className="fas fa-arrow-right"></i>
            </Link>
          </SignedOut>

          {/* Signed IN — show username pill + Clerk UserButton + Dashboard link */}
          <SignedIn>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.3rem .7rem .3rem .3rem', borderRadius: 50, border: '1px solid var(--brd2)', background: 'var(--bginp)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', color: '#fff', fontWeight: 800 }}>
                {(user?.firstName || user?.username || '?')[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: '.82rem', color: 'var(--text2)', fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.firstName || user?.username || 'User'}
              </span>
            </div>

            {!isDash && (
              <Link to="/dashboard" className="btn btn-p btn-sm">
                <i className="fas fa-gauge-high"></i> Dashboard
              </Link>
            )}

            {/* Clerk's built-in user button (avatar + sign-out menu) */}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}
