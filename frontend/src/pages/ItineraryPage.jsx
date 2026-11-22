import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Route, Sparkles } from 'lucide-react'
import { apiFetch } from '../lib/api.js'

function daysArrayFromItinerary(itinerary) {
  if (!itinerary) return []
  if (Array.isArray(itinerary)) return itinerary
  if (Array.isArray(itinerary.days)) return itinerary.days
  if (typeof itinerary === 'string') return itinerary.split('\n').filter(Boolean)
  return []
}

export default function ItineraryPage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [tripId, setTripId] = useState('')
  const [loading, setLoading] = useState(true)
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
  const days = useMemo(() => daysArrayFromItinerary(trip?.optimizedItinerary), [trip?.optimizedItinerary])

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-500">
            <Route size={17} /> AI ITINERARY
          </div>
          <h1 className="mt-2 text-4xl font-black">Your Day-wise Itinerary</h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">
            Pick a saved trip to view its full AI-generated travel schedule.
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
              Create a trip to generate an AI itinerary.
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
                    <span>{daysArrayFromItinerary(t.optimizedItinerary).length} days</span>
                    <span>Safety {t.safetyScore}/100</span>
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

                    <div className="grid gap-6">
                      {days.map((d, idx) => {
                        const lines = String(d).split('\n').filter((l) => l.trim())
                        const title = lines[0] || `Day ${idx + 1}`
                        const activities = lines.slice(1)

                        return (
                          <div key={idx} className="relative ml-2 border-l-2 border-orange-500/30 pl-8">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-[color:var(--glass-strong)] bg-orange-500" />
                            <h3 className="mb-3 text-sm font-bold text-orange-200">{title}</h3>
                            <div className="space-y-3">
                              {activities.length ? (
                                activities.map((act, i) => (
                                  <div
                                    key={i}
                                    className="flex gap-3 rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-strong)] p-3 text-sm text-[color:var(--text-soft)] transition hover:border-orange-500/40"
                                  >
                                    <span className="shrink-0 text-orange-400">•</span>
                                    <span className="leading-relaxed">{act.replace(/^[•*-]\s*/, '')}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs italic text-[color:var(--text-muted)]">
                                  Detailed plan for this day is coming soon...
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {days.length === 0 ? (
                        <div className="text-sm text-[color:var(--text-muted)]">No itinerary returned.</div>
                      ) : null}
                    </div>
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