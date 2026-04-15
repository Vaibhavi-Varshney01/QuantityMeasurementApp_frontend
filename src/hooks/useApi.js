import { useState, useCallback, useEffect } from 'react'

const HTTP_API_BASE  = 'http://localhost:5207'
const HTTPS_API_BASE = 'https://localhost:7106'

const getFallbackApiBase = () => {
  if (typeof window === 'undefined') return HTTP_API_BASE
  return window.location.protocol === 'https:' ? HTTPS_API_BASE : HTTP_API_BASE
}

const API_BASE = import.meta.env.VITE_API_BASE || getFallbackApiBase()
const API_BACKEND_LABEL = API_BASE.replace(/^https?:\/\//, '').replace(/\/$/, '')
const NETWORK_ERROR_MESSAGE = `Cannot reach backend at ${API_BACKEND_LABEL}. Is the .NET server running?`

const NETWORK_ERROR_KEYWORDS = [
  'failed to fetch', 'networkerror', 'net::err',
  'mixed content', 'cors', 'connection refused', 'connection reset',
]

const isNetworkError = (err) => {
  if (!err) return false
  if (err instanceof TypeError) return true
  const normalized = typeof err === 'string'
    ? err.toLowerCase()
    : err?.message?.toLowerCase() ?? err?.name?.toLowerCase()
  if (!normalized) return false
  return NETWORK_ERROR_KEYWORDS.some(k => normalized.includes(k))
}

const transformNetworkError = (err) => {
  if (isNetworkError(err)) return new Error(NETWORK_ERROR_MESSAGE)
  return err instanceof Error ? err : new Error(String(err))
}

export const UNITS = {
  LengthUnit:      ['Feet', 'Inch', 'Yard', 'Cm', 'Meter'],
  WeightUnit:      ['Kilogram', 'Gram', 'Pound', 'Tonne'],
  VolumeUnit:      ['Litre', 'Millilitre', 'Gallon'],
  TemperatureUnit: ['Celsius', 'Fahrenheit', 'Kelvin'],
}

const EP = {
  compare:  '/api/v1/quantities/compare',
  add:      '/api/v1/quantities/add',
  subtract: '/api/v1/quantities/subtract',
  divide:   '/api/v1/quantities/divide',
  convert:  '/api/v1/quantities/convert',
  history:  '/api/v1/quantities/history',
  histOp:   (op)   => `/api/v1/quantities/history/operation/${op}`,
  histType: (type) => `/api/v1/quantities/history/type/${type}`,
  errored:  '/api/v1/quantities/history/errored',
  count:    (op)   => `/api/v1/quantities/count/${op}`,
  health:   '/actuator/health',
}

// NOTE: With Clerk, pass the Clerk session token instead of old JWT.
// Call useAuth().getToken() from Clerk and pass it here, or set it globally.
let _clerkToken = null
export function setClerkToken(token) { _clerkToken = token }

async function req(url, opts = {}) {
  const res = await fetch(API_BASE + url, {
    headers: {
      'Content-Type': 'application/json',
      ...(_clerkToken ? { Authorization: `Bearer ${_clerkToken}` } : {}),
    },
    ...opts,
  })
  if (res.status === 204) return null
  let json
  try { json = await res.json() } catch { json = {} }
  if (!res.ok) {
    const msg = json?.message || json?.title || json?.errors
      ? (json.message || json.title || Object.values(json.errors || {}).flat().join('; '))
      : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return json
}

function unwrap(res) {
  if (Array.isArray(res))       return res
  if (Array.isArray(res?.data)) return res.data
  if (res?.data !== undefined)  return res.data
  return res
}

export function useApi() {
  const [history,   setHistory]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [backendOk, setBackendOk] = useState(null)

  const checkBackend = useCallback(async () => {
    try {
      const r = await fetch(API_BASE + EP.health)
      setBackendOk(r.ok)
      return r.ok
    } catch { setBackendOk(false); return false }
  }, [])

  const reload = useCallback(async () => {
    try {
      const res  = await req(EP.history)
      const rows = unwrap(res)
      setHistory(Array.isArray(rows) ? rows : [])
    } catch {
      try {
        const res  = await req(EP.histOp(''))
        const rows = unwrap(res)
        setHistory(Array.isArray(rows) ? rows : [])
      } catch { setHistory([]) }
    }
  }, [])

  useEffect(() => { checkBackend(); reload() }, [checkBackend, reload])

  const execute = useCallback(async (operation, type, v1, u1, v2, u2) => {
    setLoading(true)
    const op  = operation.toLowerCase()
    const url = EP[op]
    if (!url) throw new Error(`Unknown operation: ${operation}`)
    const body = {
      thisQuantityDTO: { value: Number(v1), unit: u1, measurementType: type },
      thatQuantityDTO: { value: op === 'convert' ? 0 : Number(v2), unit: u2, measurementType: type },
    }
    try {
      const res    = await req(url, { method: 'POST', body: JSON.stringify(body) })
      const result = unwrap(res)
      await reload()
      return { data: result ?? res }
    } catch(e) {
      throw transformNetworkError(e)
    } finally { setLoading(false) }
  }, [reload])

  const getHistory = useCallback((filter = {}) => {
    if (filter.operation) return history.filter(r => (r.operation || '').toUpperCase() === filter.operation.toUpperCase())
    if (filter.type)      return history.filter(r => r.thisMeasurementType === filter.type)
    return history
  }, [history])

  const getErrors = useCallback(async () => {
    try {
      const res  = await req(EP.errored)
      const rows = unwrap(res)
      return Array.isArray(rows) ? rows : []
    } catch { return history.filter(r => r.isError) }
  }, [history])

  const getCounts = useCallback(async (ops = []) => {
    return Promise.all(
      ops.map(op =>
        req(EP.count(op))
          .then(r => { const v = unwrap(r); return typeof v === 'number' ? v : (v?.count ?? 0) })
          .catch(() => 0)
      )
    )
  }, [])

  const getHistoryByOp = useCallback(async (op) => {
    try { const r = await req(EP.histOp(op)); const rows = unwrap(r); return Array.isArray(rows) ? rows : [] }
    catch { return [] }
  }, [])

  const getHistoryByType = useCallback(async (type) => {
    try { const r = await req(EP.histType(type)); const rows = unwrap(r); return Array.isArray(rows) ? rows : [] }
    catch { return [] }
  }, [])

  const getUnits = useCallback((type) => UNITS[type] || [], [])

  return {
    history, loading, backendOk,
    execute, getHistory, getErrors, getCounts,
    getHistoryByOp, getHistoryByType, getUnits,
    reload, checkBackend,
  }
}
