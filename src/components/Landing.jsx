import { Link } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import ParticlesCanvas from './ParticlesCanvas'

const features = [
  { icon: 'fas fa-database',            color: 'rgba(59,130,246,.12)',  borderColor: 'rgba(59,130,246,.2)',  iconColor: '#60a5fa', title: 'Persistent History',     desc: 'Every operation you run is automatically saved. Access your full log anytime, filter it, or export it as CSV.' },
  { icon: 'fas fa-exchange-alt',        color: 'rgba(139,92,246,.12)', borderColor: 'rgba(139,92,246,.2)', iconColor: '#a78bfa', title: 'Smart Unit Conversion',   desc: 'Convert between length, weight, volume, and temperature units instantly with full validation.' },
  { icon: 'fas fa-shield-halved',       color: 'rgba(34,197,94,.12)',  borderColor: 'rgba(34,197,94,.2)',  iconColor: '#22c55e', title: 'Clerk OAuth Security',    desc: 'Sign in with Google, GitHub, or email via Clerk — production-grade auth with zero configuration.' },
  { icon: 'fas fa-chart-pie',           color: 'rgba(245,158,11,.12)', borderColor: 'rgba(245,158,11,.2)', iconColor: '#f59e0b', title: 'Usage Analytics',        desc: 'Track how many operations of each type you\'ve run. Live counters update in real-time.' },
  { icon: 'fas fa-triangle-exclamation',color: 'rgba(248,113,113,.12)',borderColor: 'rgba(248,113,113,.2)',iconColor: '#f87171', title: 'Error Logging',          desc: 'Failed operations are captured and stored separately. Diagnose issues with full context.' },
  { icon: 'fas fa-moon',                color: 'rgba(96,165,250,.12)', borderColor: 'rgba(96,165,250,.2)', iconColor: '#60a5fa', title: 'Dark & Light Modes',     desc: 'Switch between sleek dark and clean light theme. Your preference is remembered across sessions.' },
]

const operations = [
  { emoji: '⚖️', name: 'Compare',   desc: 'Check if two measurements are equal across any units',       border: 'rgba(59,130,246,.3)' },
  { emoji: '➕', name: 'Add',       desc: 'Sum two measurements and get the combined result',            border: 'rgba(34,197,94,.3)' },
  { emoji: '➖', name: 'Subtract',  desc: 'Find the difference between two measurement values',         border: 'rgba(139,92,246,.3)' },
  { emoji: '➗', name: 'Divide',    desc: 'Divide one measurement by another to get a ratio',           border: 'rgba(245,158,11,.3)' },
  { emoji: '🔄', name: 'Convert',   desc: 'Convert a value from one unit to any compatible unit',       border: 'rgba(96,165,250,.3)' },
]

const steps = [
  { num: 1, title: 'Create your account',          desc: 'Sign up with Google, GitHub, or email via Clerk — no backend setup required.' },
  { num: 2, title: 'Choose your operation',        desc: 'Select from Compare, Add, Subtract, Divide, or Convert. Pick a measurement type and enter your values.' },
  { num: 3, title: 'Get results & review history', desc: 'Instant results are saved to your database. Review, filter, and export your full operation history anytime.' },
]

export default function Landing() {
  return (
    <>
      <div className="bg-layer">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <ParticlesCanvas />
      </div>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 2rem 4rem' }}>

        <div className="hero-eyebrow animate-fade-up">
          <i className="fas fa-sparkles" style={{ fontSize: '.72rem' }}></i>
          Precision Measurement Platform
        </div>

        <h1 style={{ fontWeight: 800, fontSize: 'clamp(2.6rem,6vw,5rem)', lineHeight: 1.08, letterSpacing: '-.02em', color: 'var(--text)', marginBottom: '1.4rem', animation: 'fadeUp 0.6s ease 0.1s both' }}>
          Measure, Convert<br />
          <span style={{ background: 'linear-gradient(135deg,#60a5fa 0%,#a78bfa 60%,#f0abfc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            &amp; Compare Anything
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem,2vw,1.2rem)', color: 'var(--text2)', maxWidth: 580, lineHeight: 1.65, marginBottom: '2.4rem', animation: 'fadeUp 0.6s ease 0.2s both' }}>
          QuantiMeasure gives you a full suite of measurement operations — comparisons,
          additions, subtractions, divisions, and unit conversions — all stored in your
          personal history and accessible from any device.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 0.6s ease 0.3s both' }}>
          <SignedOut>
            <Link to="/sign-up" className="btn-hero-p">
              <i className="fas fa-rocket"></i> Start for Free
            </Link>
            <Link to="/sign-in" className="btn-hero-s">
              <i className="fas fa-sign-in-alt"></i> Sign In
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="btn-hero-p">
              <i className="fas fa-gauge-high"></i> Go to Dashboard
            </Link>
          </SignedIn>
        </div>

        <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 0.6s ease 0.4s both' }}>
          {['OAuth via Clerk', 'Full history saved', '5 operation types', '4 measurement categories'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.8rem', color: 'var(--text3)', fontWeight: 600 }}>
              <i className="fas fa-check-circle" style={{ color: '#60a5fa', fontSize: '.75rem' }}></i> {t}
            </div>
          ))}
        </div>

        {/* Demo card */}
        <div style={{ position: 'relative', marginTop: '4rem', animation: 'fadeUp 0.6s ease 0.5s both' }}>
          <div className="demo-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--text)' }}>1.8</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Metres</div>
              </div>
              <div style={{ fontSize: '1.2rem', color: '#60a5fa', opacity: .6 }}>
                <i className="fas fa-arrows-left-right"></i>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--text)' }}>180</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Centimetres</div>
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'var(--text3)' }}>
              <i className="fas fa-equals"></i>
            </div>
            <div className="demo-result">
              <div style={{ fontWeight: 800, fontSize: '1.6rem', color: '#60a5fa' }}>✓ Equal</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Comparison Result</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label"><i className="fas fa-chart-bar"></i> By the numbers</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap', marginTop: '3rem' }}>
            {[['5','Operation Types'],['4','Measurement Categories'],['14+','Unit Choices'],['∞','History Records']].map(([n,l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '2.8rem', background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{n}</div>
                <div style={{ fontSize: '.82rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: '.2rem' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ position: 'relative', zIndex: 1 }} id="features">
        <div style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-label"><i className="fas fa-star"></i> Features</div>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', color: 'var(--text)', lineHeight: 1.15, letterSpacing: '-.01em', marginBottom: '1rem' }}>
            Everything you need<br />for precise measurement work
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text2)', maxWidth: 520, lineHeight: 1.65, marginBottom: '3.5rem' }}>
            A powerful engine paired with a clean interface — designed to save time and reduce errors.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.2rem' }}>
            {features.map(({ icon, color, borderColor, iconColor, title, desc }) => (
              <div key={title} className="feat-card">
                <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '1.1rem', background: color, border: `1px solid ${borderColor}`, color: iconColor }}>
                  <i className={icon}></i>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '.5rem' }}>{title}</h3>
                <p style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── OPERATIONS ── */}
      <div style={{ position: 'relative', zIndex: 1 }} id="operations">
        <div style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label" style={{ justifyContent: 'center' }}><i className="fas fa-exchange-alt"></i> Operations</div>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', color: 'var(--text)', lineHeight: 1.15, marginBottom: '1rem' }}>
            Five powerful operations,<br />four measurement types
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text2)', maxWidth: 520, margin: '0 auto 3rem', lineHeight: 1.65 }}>
            Work with Length, Weight, Volume, and Temperature — using any combination of the operations below.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '1rem', maxWidth: 900, margin: '0 auto' }}>
            {operations.map(({ emoji, name, desc, border }) => (
              <div key={name} className="op-card" style={{ borderColor: border }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '.65rem' }}>{emoji}</span>
                <h4 style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', marginBottom: '.3rem' }}>{name}</h4>
                <p style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ position: 'relative', zIndex: 1 }} id="how-it-works">
        <div style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-label"><i className="fas fa-circle-play"></i> How it works</div>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', color: 'var(--text)', lineHeight: 1.15, marginBottom: '3.5rem' }}>
            Up and running<br />in three steps
          </h2>
          <div style={{ display: 'flex', gap: 0, position: 'relative', flexWrap: 'wrap' }}>
            {steps.map(({ num, title, desc }, i) => (
              <div key={num} style={{ flex: 1, minWidth: 220, position: 'relative', paddingRight: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#fff', boxShadow: '0 6px 18px var(--glow-blue)', marginBottom: '1rem' }}>
                  {num}
                </div>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', top: 22, left: 44, right: 0, height: 1, background: 'linear-gradient(90deg,rgba(59,130,246,.4),transparent)' }} />
                )}
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '.4rem' }}>{title}</div>
                <div style={{ fontSize: '.83rem', color: 'var(--text2)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '3.5rem 2.5rem', backdropFilter: 'blur(20px)', boxShadow: '0 24px 60px rgba(0,0,0,.4)' }}>
          <h2 style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--text)', marginBottom: '.75rem' }}>Ready to get started?</h2>
          <p style={{ fontSize: '1rem', color: 'var(--text2)', marginBottom: '2rem' }}>Create a free account and run your first measurement operation in under a minute.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <SignedOut>
              <Link to="/sign-up" className="btn-hero-p">
                <i className="fas fa-user-plus"></i> Create Free Account
              </Link>
              <Link to="/sign-in" className="btn-hero-s">
                <i className="fas fa-sign-in-alt"></i> Sign In
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="btn-hero-p">
                <i className="fas fa-gauge-high"></i> Open Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--brd2)', padding: '2rem', textAlign: 'center', fontSize: '.8rem', color: 'var(--text3)' }}>
        <p>
          &copy; 2025 <strong>QuantiMeasure</strong> &nbsp;·&nbsp; Built with precision &nbsp;·&nbsp;
          <Link to="/sign-in" style={{ color: '#60a5fa', textDecoration: 'none' }}>Sign In</Link> &nbsp;·&nbsp;
          <Link to="/sign-up" style={{ color: '#60a5fa', textDecoration: 'none' }}>Register</Link>
        </p>
      </footer>
    </>
  )
}
