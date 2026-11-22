import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Route, Sparkles } from 'lucide-react'
import TripBudget from '../components/TripBudget.jsx'
import TripListings from '../components/TripListings.jsx'
import { apiFetch } from '../lib/api.js'

export default function ItineraryPage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [tripId, setTripId] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiFetch('/api/trips')
        const list = data.trips || []
        setTrips(list)
        setTripId(list[0]?._id || '')
      } catch (e) {
        if (e.status === 401) {
          localStorage.clear()
          navigate('/login')
          return
        }
        setError(e.message || 'Unable to load your itineraries.')
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate])

  const trip = useMemo(() => trips.find((t) => t._id === tripId), [trips, tripId])
  async function refresh() {
    setRefreshing(true)
    setError('')
    try {
      const data = await apiFetch('/api/trips/' + tripId + '/refresh', { method: 'POST' })
      setTrips(current => current.map(item => item._id === data.trip._id ? data.trip : item))
    } catch (e) {
      setError(e.message || 'Refresh failed.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-500">
            <Route size={17} /> SAVED ITINERARIES
          </div>
          <h1 className="mt-2 text-4xl font-black">Your Day-wise Itinerary</h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">
            Pick a saved trip to view its listings and suggested stops.
          </p>
        </div>
        <Link to="/dashboard" className="text-sm font-semibold text-emerald-500">← Dashboard</Link>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-6 text-sm text-[color:var(--text-muted)]">
            Loading your trips...
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[color:var(--glass-border)] p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CalendarDays size={26} />
            </div>
            <h2 className="mt-4 text-xl font-bold">No trips yet</h2>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">
              Create a trip to look up places.
            </p>
            <Link
              to="/plan"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-white hover:bg-emerald-400"
            >
              <Sparkles size={18} /> Plan New Trip
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-3 lg:max-h-[70vh] lg:overflow-auto lg:pr-1">
              <h2 className="px-1 text-sm font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                Saved Trips
              </h2>
              {trips.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setTripId(t._id)}
                  className={
                    'w-full rounded-2xl border p-4 text-left transition ' +
                    (t._id === tripId
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : 'border-[color:var(--glass-border)] bg-[color:var(--glass)] hover:border-emerald-500/40 hover:bg-[color:var(--glass-hover)]')
                  }
                >
                  <div className="flex items-center gap-2 font-bold">
                    <MapPin size={15} className="shrink-0 text-emerald-500" />
                    <span className="truncate">{t.origin} → {t.destination}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
                    <span>{new Date(t.startDate).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </aside>

            <section>
              {trip ? (
                <>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold">{trip.origin} → {trip.destination}</h2>
                    <div className="flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
                      <span className="rounded-full bg-[color:var(--glass-strong)] px-3 py-1">
                        {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
                      </span>
                      <span className="rounded-full bg-[color:var(--glass-strong)] px-3 py-1">{trip.transportMode}</span>
                      <span className="rounded-full bg-[color:var(--glass-strong)] px-3 py-1">₹{Number(trip.budget).toLocaleString()}</span>
                      <span className="rounded-full bg-[color:var(--glass-strong)] px-3 py-1">{trip.travelType}</span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-5 backdrop-blur-xl">
                    {trip.preferences ? (
                      <p className="mb-5 rounded-2xl bg-[color:var(--glass-strong)] p-3 text-sm text-[color:var(--text-soft)]">
                        ✦ Focus areas: {trip.preferences}
                      </p>
                    ) : null}

                    <button type="button" disabled={refreshing} onClick={refresh} className="mb-4 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white">{refreshing ? 'Checking…' : 'Refresh destination listings'}</button>
                    <Link to="/plan" state={{ trip }} className="ml-3 text-sm font-semibold underline">Adjust trip budget and party</Link>
                    <div className="mb-4"><TripBudget trip={trip} places={trip.places}/></div>
                    <TripListings key={trip._id} trip={trip} />
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-[color:var(--glass-border)] bg-[color:var(--glass)] p-10 text-center text-sm text-[color:var(--text-muted)]">
                  Select a trip from the list to view its itinerary.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}