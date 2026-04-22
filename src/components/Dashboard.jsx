import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk, useAuth } from '@clerk/clerk-react'
import { useApi, setClerkToken } from '../hooks/useApi'
import ParticlesCanvas from './ParticlesCanvas'

const OPS      = ['COMPARE','ADD','SUBTRACT','DIVIDE','CONVERT']
const OP_PILLS = [
  { op: 'compare',  label: '⚖️ Compare' },
  { op: 'add',      label: '➕ Add' },
  { op: 'subtract', label: '➖ Subtract' },
  { op: 'divide',   label: '➗ Divide' },
  { op: 'convert',  label: '🔄 Convert' },
]
const OP_COLORS = { COMPARE:'#3b82f6',ADD:'#22c55e',SUBTRACT:'#8b5cf6',DIVIDE:'#f59e0b',CONVERT:'#60a5fa' }
const OP_ICONS  = { COMPARE:'fas fa-equals',ADD:'fas fa-plus',SUBTRACT:'fas fa-minus',DIVIDE:'fas fa-divide',CONVERT:'fas fa-exchange-alt' }
const G = { background:'linear-gradient(135deg,#60a5fa,#a78bfa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }

function Badge({ text }) {
  const c = OP_COLORS[(text||'').toUpperCase()] || '#666'
  return (
    <span style={{ background:`${c}18`,color:c,padding:'.18rem .6rem',borderRadius:50,fontSize:'.68rem',fontWeight:800,border:`1px solid ${c}35` }}>
      {text}
    </span>
  )
}
function fmtV(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return String(Math.round(v*1e9)/1e9)
  return String(v)
}
function Toast({ t }) {
  if (!t) return null
  return <div className={`toast ${t.type}`}>{t.msg}</div>
}

export default function Dashboard() {
  const [sec,   setSec]   = useState('dashboard')
  const [toast, setToast] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)

  const { user, isSignedIn } = useUser()
  const { signOut }          = useClerk()
  const { getToken }         = useAuth()
  const navigate             = useNavigate()

  const displayName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'
  const avatarLetter = displayName[0]?.toUpperCase() || '?'

  const {
    history, loading, backendOk, apiUrl,
    execute, getHistory, getErrors, getCounts,
    getHistoryByOp, getHistoryByType, getUnits,
    reload, checkBackend,
  } = useApi()

  // Converter state
  const [curOp,    setCurOp]    = useState('compare')
  const [measType, setMeasType] = useState('LengthUnit')
  const [val1,     setVal1]     = useState('')
  const [unit1,    setUnit1]    = useState('')
  const [val2,     setVal2]     = useState('')
  const [unit2,    setUnit2]    = useState('')
  const [unitList, setUnitList] = useState([])
  const [result,   setResult]   = useState(null)
  const [resErr,   setResErr]   = useState('')
  const [runLoad,  setRunLoad]  = useState(false)

  // Stats
  const [stats,   setStats]   = useState({ total:0,compare:0,add:0,errors:0 })
  const [opStats, setOpStats] = useState({ sC:0,sA:0,sSub:0,sD:0,sCv:0 })

  // History filters
  const [hOp,      setHOp]      = useState('')
  const [hType,    setHType]    = useState('')
  const [filtRows, setFiltRows] = useState([])

  // Errors
  const [errRows, setErrRows] = useState([])

  const toast$ = (msg, type='success') => { setToast({ msg,type }); setTimeout(() => setToast(null), 3800) }

  const loadStats = useCallback(async () => {
    try {
      const [counts, errs] = await Promise.all([getCounts(), getErrors()])
      const [c,a,s,d,cv]   = counts
      setStats({ total:c+a+s+d+cv, compare:c, add:a, errors:errs.length })
      setOpStats({ sC:c, sA:a, sSub:s, sD:d, sCv:cv })
    } catch {}
  }, [getCounts, getErrors])

  // Sync Clerk token to useApi
  useEffect(() => {
    if (isSignedIn) {
      getToken().then(t => {
        setClerkToken(t)
        // Force a reload once we have the token
        reload()
        loadStats()
      })
    } else {
      setClerkToken(null)
    }
  }, [getToken, isSignedIn, reload, loadStats])

  // Listen to navbar nav events
  useEffect(() => {
    const h = e => { setSec(e.detail); setShowSidebar(false) }
    window.addEventListener('qm-nav', h)
    return () => window.removeEventListener('qm-nav', h)
  }, [])

  // Listen to sidebar toggle
  useEffect(() => {
    const h = () => setShowSidebar(s => !s)
    window.addEventListener('qm-toggle-sidebar', h)
    return () => window.removeEventListener('qm-toggle-sidebar', h)
  }, [])

  // Update unit list when measType changes
  useEffect(() => {
    const u = getUnits(measType)
    setUnitList(u); setUnit1(u[0]||''); setUnit2(u[1]||u[0]||'')
  }, [measType, getUnits])

  useEffect(() => { loadStats() }, [loadStats, sec])

  useEffect(() => {
    if (sec === 'errors') getErrors().then(setErrRows).catch(() => setErrRows([]))
  }, [sec, getErrors])

  useEffect(() => {
    const load = async () => {
      if (hType)    setFiltRows(await getHistoryByType(hType))
      else if (hOp) setFiltRows(await getHistoryByOp(hOp))
      else          setFiltRows(getHistory())
    }
    load()
  }, [hOp, hType, history, getHistory, getHistoryByOp, getHistoryByType])

  const connColor = backendOk === null ? 'var(--text3)' : backendOk ? '#22c55e' : '#f59e0b'
  const connLabel = backendOk === null ? 'Checking…' : backendOk ? '● Connected' : '● Offline'

  const runOp = async () => {
    const v1 = parseFloat(val1), v2 = parseFloat(val2)
    if (isNaN(v1)) { toast$('Enter Value 1','error'); return }
    if (!unit1)    { toast$('Select Unit 1','error'); return }
    if (curOp !== 'convert' && isNaN(v2)) { toast$('Enter Value 2','error'); return }
    if (!unit2)    { toast$('Select Target Unit','error'); return }
    setRunLoad(true); setResult(null); setResErr('')
    try {
      const r = await execute(curOp, measType, v1, unit1, v2, unit2)
      setResult(r.data)
      toast$('✓ Result saved to database', 'success')
      loadStats()
    } catch(e) {
      setResErr(e.message || 'Operation failed')
      toast$(e.message, 'error')
    } finally { setRunLoad(false) }
  }

  const getResDisp = () => {
    if (!result) return ''
    const op = curOp.toUpperCase()
    if (op === 'COMPARE') return (result.resultString === 'true' || result.resultString === 'Equal') ? '✓ Equal' : '✗ Not Equal'
    if (op === 'DIVIDE')  return fmtV(result.resultValue)
    return `${fmtV(result.resultValue)}${result.resultUnit ? ' '+result.resultUnit : ''}`
  }

  const exportCSV = () => {
    const rows = filtRows.length ? filtRows : getHistory()
    if (!rows.length) { toast$('No data to export','error'); return }
    const csv = 'Operation,Type,Value1,Unit1,Value2,Unit2,Result,ResultUnit,Status\n'
      + rows.map(r => [r.operation,r.thisMeasurementType,r.thisValue,r.thisUnit,r.thatValue,r.thatUnit,r.resultString||r.resultValue,r.resultUnit,r.isError?'Error':'OK'].join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    a.download = 'quantimeasure-history.csv'; a.click()
    toast$('Exported!','success')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const renderRows = (rows, cols) => {
    if (!rows || !rows.length) return <tr><td colSpan={cols} className="ec">No records found.</td></tr>
    return rows.map((r,i) => cols === 3 ? (
      <tr key={i}>
        <td><Badge text={r.operation}/></td>
        <td>{r.thisMeasurementType||'—'}</td>
        <td style={{ color:'#f87171',fontSize:'.8rem' }}>{r.errorMessage||r.message||'—'}</td>
      </tr>
    ) : (
      <tr key={i}>
        <td><Badge text={r.operation}/></td>
        <td>{r.thisMeasurementType||'—'}</td>
        <td>{fmtV(r.thisValue)} {r.thisUnit}</td>
        <td>{fmtV(r.thatValue)} {r.thatUnit}</td>
        <td>{r.resultString||fmtV(r.resultValue)} {r.resultUnit}</td>
        <td><span className={`badge ${r.isError?'badge-err':'badge-ok'}`}>{r.isError?'Error':'OK'}</span></td>
      </tr>
    ))
  }

  const navItems = [
    ['dashboard','fas fa-gauge-high',         'Dashboard'],
    ['converter','fas fa-exchange-alt',        'Converter'],
    ['history',  'fas fa-history',            'History'],
    ['errors',   'fas fa-triangle-exclamation','Error Logs'],
  ]

  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 70px)', paddingTop:70, position:'relative' }}>
      <div className="bg-layer">
        <div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/>
        <ParticlesCanvas />
      </div>

      {/* SIDEBAR DRAWER */}
      <div className={`sidebar-backdrop ${showSidebar ? 'show' : ''}`} onClick={() => setShowSidebar(false)} />
      <aside className={`sidebar-drawer ${showSidebar ? 'open' : ''}`}>
        <div style={{ padding:'1.2rem .7rem' }}>
          <div style={{ marginBottom:'1.4rem' }}>
            <span className="sb-label">Navigation</span>
            <ul style={{ listStyle:'none', padding:0 }}>
              {navItems.map(([id,icon,label]) => (
                <li key={id}>
                  <button className={`sb-link ${sec===id?'active':''}`} onClick={() => { setSec(id); setShowSidebar(false) }}>
                    <i className={icon}></i> {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="sb-label">Account</span>
            <ul style={{ listStyle:'none', padding:0 }}>
              <li><button className={`sb-link ${sec==='profile'?'active':''}`} onClick={() => { setSec('profile'); setShowSidebar(false) }}><i className="fas fa-user-circle"></i> My Profile</button></li>
              <li><a href="/" className="sb-link"><i className="fas fa-home"></i> Home Page</a></li>
              <li>
                <button className="sb-link" onClick={handleSignOut} style={{ color:'#f87171' }}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </li>
            </ul>
          </div>
          <div style={{ marginTop:'1.5rem', padding:'.65rem .75rem', borderRadius:9, background:`${connColor}10`, border:`1px solid ${connColor}30` }}>
            <div style={{ fontSize:'.72rem', fontWeight:800, color:connColor }}>{connLabel}</div>
            <div style={{ fontSize:'.64rem', color:'var(--text3)', marginTop:'.15rem', wordBreak: 'break-all' }}>{apiUrl.replace(/^https?:\/\//, '')}</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, padding:'1.8rem', minWidth:0, position:'relative', zIndex:1, overflowY:'auto' }}>

        {/* ════ DASHBOARD ════ */}
        {sec === 'dashboard' && (
          <div style={{ animation:'fadeIn .25s ease' }}>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem', marginBottom:'1.6rem' }}>
              <div>
                <h1 style={{ fontWeight:800, fontSize:'1.8rem', color:'var(--text)' }}>
                  Welcome back, <span style={G}>{displayName}!</span>
                </h1>
                <p style={{ fontSize:'.83rem', color:'var(--text3)', marginTop:'.2rem' }}>Live data from your SQL Server via .NET API</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                <span style={{ fontSize:'.75rem', fontWeight:700, color:connColor, padding:'.28rem .8rem', borderRadius:50, border:`1px solid ${connColor}35`, background:`${connColor}10` }}>{connLabel}</span>
                <button className="btn btn-s" onClick={() => { loadStats(); reload(); checkBackend() }}><i className="fas fa-rotate"></i> Refresh</button>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem', marginBottom:'1.6rem' }}>
              {[
                { icon:'fas fa-calculator', bg:'rgba(59,130,246,.12)', bd:'rgba(59,130,246,.2)', c:'#60a5fa', label:'Total Ops',   val:stats.total,   sub:'All time' },
                { icon:'fas fa-equals',     bg:'rgba(139,92,246,.12)', bd:'rgba(139,92,246,.2)', c:'#a78bfa', label:'Comparisons', val:stats.compare, sub:'COMPARE ops' },
                { icon:'fas fa-plus',       bg:'rgba(34,197,94,.12)',  bd:'rgba(34,197,94,.2)',  c:'#22c55e', label:'Additions',   val:stats.add,     sub:'ADD ops' },
                { icon:'fas fa-circle-exclamation', bg:'rgba(248,113,113,.12)', bd:'rgba(248,113,113,.2)', c:'#f87171', label:'Errors', val:stats.errors, sub:'Failed ops' },
              ].map(({ icon,bg,bd,c,label,val,sub }) => (
                <div key={label} className="metric">
                  <div className="m-icon" style={{ background:bg, border:`1px solid ${bd}`, color:c }}><i className={icon}></i></div>
                  <div><div className="m-label">{label}</div><div className="m-val">{loading?'…':val}</div><div className="m-sub">{sub}</div></div>
                </div>
              ))}
            </div>

            {/* Recent table */}
            <div className="card" style={{ marginBottom:'1.2rem' }}>
              <div className="card-hd">
                <h2><i className="fas fa-clock-rotate-left"></i> Recent Operations</h2>
                <button className="btn-icon" onClick={reload}><i className="fas fa-rotate" style={{ fontSize:'.76rem' }}></i></button>
              </div>
              <div className="tbl-wrap">
                <table><thead><tr><th>Operation</th><th>Type</th><th>Input 1</th><th>Input 2</th><th>Result</th><th>Status</th></tr></thead>
                  <tbody>{renderRows(getHistory().slice(0,8), 6)}</tbody>
                </table>
              </div>
            </div>

            {/* Op stats strip */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.75rem' }}>
              {[['Compare',opStats.sC,'#3b82f6'],['Add',opStats.sA,'#22c55e'],['Subtract',opStats.sSub,'#8b5cf6'],['Divide',opStats.sD,'#f59e0b'],['Convert',opStats.sCv,'#60a5fa']].map(([l,v,c]) => (
                <div key={l} style={{ background:'var(--bg3)', border:`1px solid ${c}25`, borderRadius:10, padding:'.9rem', textAlign:'center' }}>
                  <div style={{ fontSize:'.65rem', textTransform:'uppercase', letterSpacing:'.1em', color:'var(--text3)', fontWeight:800 }}>{l}</div>
                  <div style={{ fontWeight:800, fontSize:'1.6rem', color:c, marginTop:'.2rem' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ CONVERTER ════ */}
        {sec === 'converter' && (
          <div style={{ animation:'fadeIn .25s ease' }}>
            <div style={{ marginBottom:'1.6rem' }}>
              <h1 style={{ fontWeight:800, fontSize:'1.8rem', color:'var(--text)' }}><span style={G}>Measurement</span> Operations</h1>
              <p style={{ fontSize:'.83rem', color:'var(--text3)', marginTop:'.2rem' }}>Results saved via POST to the .NET backend</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.2rem' }}>
              <div className="card">
                <div className="card-hd"><h2><i className="fas fa-exchange-alt"></i> Operation Panel</h2></div>
                <div className="cp">
                  <div style={{ display:'flex', gap:'.45rem', flexWrap:'wrap', marginBottom:'1.15rem' }}>
                    {OP_PILLS.map(({ op,label }) => (
                      <button key={op} className={`op-pill ${curOp===op?'active':''}`} onClick={() => { setCurOp(op); setResult(null); setResErr('') }}>{label}</button>
                    ))}
                  </div>
                  <div className="api-bar"><span className="method">POST</span><span>{apiUrl.replace(/^https?:\/\//, '')}/api/v1/quantities/{curOp}</span></div>
                  <div className="fg">
                    <label><i className="fas fa-ruler" style={{ color:'#3b82f6',marginRight:'.28rem',fontSize:'.75rem' }}></i> Measurement Type</label>
                    <select className="inp" value={measType} onChange={e => setMeasType(e.target.value)}>
                      <option value="LengthUnit">Length</option>
                      <option value="WeightUnit">Weight</option>
                      <option value="VolumeUnit">Volume</option>
                      <option value="TemperatureUnit">Temperature</option>
                    </select>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                    <div className="fg">
                      <label><i className="fas fa-calculator" style={{ color:'#3b82f6',marginRight:'.28rem',fontSize:'.75rem' }}></i> Value 1</label>
                      <input type="number" className="inp" value={val1} onChange={e => setVal1(e.target.value)} placeholder="e.g. 1.0" step="any"/>
                    </div>
                    <div className="fg">
                      <label><i className="fas fa-tag" style={{ color:'#3b82f6',marginRight:'.28rem',fontSize:'.75rem' }}></i> Unit 1</label>
                      <select className="inp" value={unit1} onChange={e => setUnit1(e.target.value)}>
                        {unitList.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: curOp==='convert'?'1fr':'1fr 1fr', gap:'.75rem' }}>
                    {curOp !== 'convert' && (
                      <div className="fg">
                        <label><i className="fas fa-calculator" style={{ color:'#3b82f6',marginRight:'.28rem',fontSize:'.75rem' }}></i> Value 2</label>
                        <input type="number" className="inp" value={val2} onChange={e => setVal2(e.target.value)} placeholder="e.g. 12.0" step="any"/>
                      </div>
                    )}
                    <div className="fg">
                      <label><i className="fas fa-tag" style={{ color:'#3b82f6',marginRight:'.28rem',fontSize:'.75rem' }}></i>{curOp==='convert'?' Target Unit':' Unit 2'}</label>
                      <select className="inp" value={unit2} onChange={e => setUnit2(e.target.value)}>
                        {unitList.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <button className="btn btn-p btn-lg" onClick={runOp} disabled={runLoad}>
                    <i className="fas fa-play"></i> {runLoad ? 'Sending to backend…' : 'Execute'}
                  </button>
                  {(result || resErr) && (
                    <div className={`result-box ${resErr?'error':''}`}>
                      <div className="r-label">Result from backend</div>
                      <p className="r-val" style={{ color: resErr?'#f87171':'#60a5fa' }}>{resErr || getResDisp()}</p>
                      {result && <p className="r-meta">{curOp==='convert' ? `${val1} ${unit1}  =  ${fmtV(result.resultValue)} ${unit2}` : `${val1} ${unit1}  ${curOp.toUpperCase()}  ${val2} ${unit2}`}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Op stats sidebar */}
              <div className="card">
                <div className="card-hd"><h2><i className="fas fa-chart-bar"></i> Op Stats</h2><button className="btn-icon" onClick={loadStats}><i className="fas fa-rotate" style={{ fontSize:'.76rem' }}></i></button></div>
                <div className="cp">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem' }}>
                    {[['Compare',opStats.sC],['Add',opStats.sA],['Subtract',opStats.sSub],['Divide',opStats.sD]].map(([l,v]) => (
                      <div key={l} style={{ background:'var(--bginp)', border:'1px solid var(--brd2)', borderRadius:9, padding:'.7rem', textAlign:'center' }}>
                        <h4 style={{ fontSize:'.61rem', textTransform:'uppercase', letterSpacing:'.11em', color:'var(--text3)', fontWeight:800 }}>{l}</h4>
                        <p style={{ fontWeight:800, fontSize:'1.3rem', color:'var(--text)' }}>{v}</p>
                      </div>
                    ))}
                    <div style={{ gridColumn:'1/-1', background:'var(--bginp)', border:'1px solid var(--brd2)', borderRadius:9, padding:'.7rem', textAlign:'center' }}>
                      <h4 style={{ fontSize:'.61rem', textTransform:'uppercase', letterSpacing:'.11em', color:'var(--text3)', fontWeight:800 }}>Convert</h4>
                      <p style={{ fontWeight:800, fontSize:'1.3rem', color:'var(--text)' }}>{opStats.sCv}</p>
                    </div>
                  </div>
                  <div style={{ marginTop:'1rem' }}>
                    <h3 style={{ fontSize:'.67rem', textTransform:'uppercase', letterSpacing:'.11em', color:'var(--text3)', fontWeight:800, marginBottom:'.55rem' }}>Recent</h3>
                    <ul style={{ listStyle:'none', padding:0 }}>
                      {getHistory().slice(0,5).map((r,i) => (
                        <li key={i} style={{ display:'flex', flexDirection:'column', gap:'.1rem', padding:'.55rem 0', borderBottom:'1px solid var(--brd2)', fontSize:'.78rem' }}>
                          <span style={{ color:'#60a5fa', fontWeight:800, fontSize:'.67rem', textTransform:'uppercase' }}>{r.operation}</span>
                          <span style={{ color:'var(--text2)' }}>{fmtV(r.thisValue)} {r.thisUnit} → {r.resultString||fmtV(r.resultValue)} {r.resultUnit}</span>
                        </li>
                      ))}
                      {!getHistory().length && <li style={{ color:'var(--text3)', fontSize:'.8rem' }}>Run your first operation!</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ HISTORY ════ */}
        {sec === 'history' && (
          <div style={{ animation:'fadeIn .25s ease' }}>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem', marginBottom:'1.6rem' }}>
              <div>
                <h1 style={{ fontWeight:800, fontSize:'1.8rem', color:'var(--text)' }}><span style={G}>Operation</span> History</h1>
                <p style={{ fontSize:'.83rem', color:'var(--text3)', marginTop:'.2rem' }}>All records from your SQL Server database.</p>
              </div>
            </div>
            <div className="card">
              <div className="card-hd">
                <h2><i className="fas fa-history"></i> All Records</h2>
                <div style={{ display:'flex', gap:'.5rem', alignItems:'center', flexWrap:'wrap' }}>
                  <select className="flt-sel" value={hOp} onChange={e => { setHOp(e.target.value); setHType('') }}>
                    <option value="">All Operations</option>
                    {OPS.map(o => <option key={o} value={o}>{o.charAt(0)+o.slice(1).toLowerCase()}</option>)}
                  </select>
                  <select className="flt-sel" value={hType} onChange={e => { setHType(e.target.value); setHOp('') }}>
                    <option value="">All Types</option>
                    <option value="LengthUnit">Length</option>
                    <option value="WeightUnit">Weight</option>
                    <option value="VolumeUnit">Volume</option>
                    <option value="TemperatureUnit">Temperature</option>
                  </select>
                  <button className="btn-icon" onClick={() => { setHOp(''); setHType('') }}><i className="fas fa-rotate" style={{ fontSize:'.76rem' }}></i></button>
                  <button className="btn btn-s btn-sm" onClick={exportCSV}><i className="fas fa-download"></i> Export CSV</button>
                </div>
              </div>
              <div className="tbl-wrap">
                <table><thead><tr><th>Operation</th><th>Type</th><th>Input 1</th><th>Input 2</th><th>Result</th><th>Status</th></tr></thead>
                  <tbody>{renderRows(filtRows, 6)}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ ERRORS ════ */}
        {sec === 'errors' && (
          <div style={{ animation:'fadeIn .25s ease' }}>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem', marginBottom:'1.6rem' }}>
              <div>
                <h1 style={{ fontWeight:800, fontSize:'1.8rem', color:'var(--text)' }}><span style={G}>Error</span> Logs</h1>
                <p style={{ fontSize:'.83rem', color:'var(--text3)', marginTop:'.2rem' }}>GET /api/v1/quantities/history/errored</p>
              </div>
              <button className="btn btn-s" onClick={() => getErrors().then(setErrRows).catch(() => setErrRows([]))}><i className="fas fa-rotate"></i> Refresh</button>
            </div>
            <div className="card">
              <div className="tbl-wrap">
                <table><thead><tr><th>Operation</th><th>Type</th><th>Error Message</th></tr></thead>
                  <tbody>
                    {errRows.length === 0
                      ? <tr><td colSpan={3} className="ec">✅ No errors in database.</td></tr>
                      : renderRows(errRows, 3)
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ PROFILE ════ */}
        {sec === 'profile' && (
          <div style={{ animation:'fadeIn .25s ease' }}>
            <div style={{ marginBottom:'1.6rem' }}>
              <h1 style={{ fontWeight:800, fontSize:'1.8rem', color:'var(--text)' }}>My <span style={G}>Profile</span></h1>
              <p style={{ fontSize:'.83rem', color:'var(--text3)', marginTop:'.2rem' }}>Account info from Clerk + live stats from the backend.</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'1.2rem' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div className="card">
                  <div className="cp" style={{ textAlign:'center', padding:'2rem 1.5rem' }}>
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="avatar" style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 1rem', border:'3px solid rgba(59,130,246,.4)', display:'block' }} />
                    ) : (
                      <div className="profile-avatar-big" style={{ margin:'0 auto 1rem' }}>{avatarLetter}</div>
                    )}
                    <div style={{ fontWeight:800, fontSize:'1.4rem', color:'var(--text)' }}>{displayName}</div>
                    {user?.emailAddresses?.[0] && (
                      <div style={{ fontSize:'.78rem', color:'var(--text3)', marginTop:'.25rem' }}>{user.emailAddresses[0].emailAddress}</div>
                    )}
                    <span style={{ display:'inline-block', marginTop:'.5rem', padding:'.2rem .75rem', borderRadius:50, fontSize:'.72rem', fontWeight:800, background:'linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.15))', border:'1px solid rgba(59,130,246,.3)', color:'#60a5fa', textTransform:'uppercase', letterSpacing:'.07em' }}>
                      OAuth via Clerk
                    </span>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem', marginTop:'1.5rem' }}>
                      {[['Total',opStats.sC+opStats.sA+opStats.sSub+opStats.sD+opStats.sCv],['Errors',stats.errors],['Compares',opStats.sC],['Converts',opStats.sCv]].map(([l,v]) => (
                        <div key={l} className="pstat"><div className="pstat-val">{v}</div><div className="pstat-lbl">{l}</div></div>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="btn btn-danger" onClick={handleSignOut} style={{ width:'100%', justifyContent:'center' }}>
                  <i className="fas fa-sign-out-alt"></i> Sign Out
                </button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
                <div className="card">
                  <div className="card-hd"><h2><i className="fas fa-id-card"></i> Account Details</h2></div>
                  <div className="cp">
                    {[
                      ['Display Name', displayName],
                      ['Email', user?.emailAddresses?.[0]?.emailAddress || '—'],
                      ['Auth Provider', 'Clerk (OAuth)'],
                      ['User ID', user?.id ? user.id.slice(0,20)+'…' : '—'],
                      ['Status', null],
                    ].map(([l,v]) => (
                      <div key={l} className="info-row">
                        <span className="lbl">{l}</span>
                        <span className="val">{l==='Status' ? <span className="badge badge-ok">Active</span> : v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-hd"><h2><i className="fas fa-chart-pie"></i> Operation Breakdown</h2><button className="btn-icon" onClick={loadStats}><i className="fas fa-rotate" style={{ fontSize:'.76rem' }}></i></button></div>
                  <div className="cp">
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.65rem', marginBottom:'.75rem' }}>
                      {[['Add',opStats.sA],['Subtract',opStats.sSub],['Divide',opStats.sD]].map(([l,v]) => (
                        <div key={l} className="pstat"><div className="pstat-val">{v}</div><div className="pstat-lbl">{l}</div></div>
                      ))}
                    </div>
                    <div style={{ background:'var(--bginp)', border:'1px solid var(--brd2)', borderRadius:9, padding:'.75rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <h4 style={{ fontSize:'.61rem', textTransform:'uppercase', letterSpacing:'.11em', color:'var(--text3)', fontWeight:800 }}>Most Used</h4>
                      <span style={{ fontWeight:800, fontSize:'1rem', color:'#60a5fa' }}>
                        {OPS[[opStats.sC,opStats.sA,opStats.sSub,opStats.sD,opStats.sCv].indexOf(Math.max(opStats.sC,opStats.sA,opStats.sSub,opStats.sD,opStats.sCv))] || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-hd"><h2><i className="fas fa-clock"></i> Recent Activity</h2></div>
                  <div className="cp">
                    {getHistory().slice(0,6).length === 0
                      ? <p style={{ color:'var(--text3)', fontSize:'.82rem' }}>No activity yet — run an operation in Converter.</p>
                      : getHistory().slice(0,6).map((r,i) => {
                          const op = (r.operation||'COMPARE').toUpperCase()
                          const c  = OP_COLORS[op]||'#3b82f6'
                          const ic = OP_ICONS[op]||'fas fa-calculator'
                          return (
                            <div key={i} className="act-item">
                              <div className="act-icon" style={{ background:`${c}18`, border:`1px solid ${c}30`, color:c }}><i className={ic}></i></div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:'.82rem', color:'var(--text2)' }}><strong>{op}</strong> — {fmtV(r.thisValue)} {r.thisUnit} → {fmtV(r.thatValue)} {r.thatUnit}</div>
                                <div style={{ fontSize:'.72rem', color:'var(--text3)' }}>{r.thisMeasurementType} • {r.resultString||fmtV(r.resultValue)} {r.resultUnit}</div>
                              </div>
                              <span style={{ fontSize:'.72rem', color:'var(--text3)', whiteSpace:'nowrap' }}>#{i+1}</span>
                            </div>
                          )
                        })
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Toast t={toast}/>
    </div>
  )
}
