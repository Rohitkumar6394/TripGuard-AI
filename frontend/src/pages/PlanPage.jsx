import { useState } from 'react'
import TripListings from '../components/TripListings.jsx'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'


export default function PlanPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState(() => ({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    transportMode: 'Flight',
    travelType: 'Solo',
    people: 1,
    preferences: ''
  }))

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const peopleEditable = form.travelType === 'Family' || form.travelType === 'Group/Friends'

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!form.origin.trim() || !form.destination.trim()) {
      setError('Please enter origin and destination.')
      return
    }
    if (!form.startDate || !form.endDate) {
      setError('Please select start and end dates.')
      return
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date must be on or after the start date.')
      return
    }

    setGenerating(true)

    try {
      const response = await apiFetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      setResult(response.trip)
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem('tripguard-auth-token')
        localStorage.removeItem('tripguard-authenticated')
        localStorage.removeItem('tripguard-user')
        navigate('/login')
        return
      }
      setError(error.message || 'Unable to generate your trip plan.')
    } finally {
      setGenerating(false)
    }
  }

  const isFormValid = form.origin && form.destination && form.startDate && form.endDate && form.budget && form.transportMode && form.travelType && form.people

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      <div className="mb-4 flex items-center gap-3">
        <button
          className="rounded-xl bg-[color:var(--glass)] px-4 py-2 text-sm ring-1 ring-[color:var(--glass-border)] transition hover:bg-[color:var(--glass-hover)]"
          onClick={() => navigate('/')}
          type="button"
        >
          ← Back to home
        </button>
      </div>

      <div className="rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-5 backdrop-blur-xl">
          <h1 className="text-2xl font-extrabold">Travel Planning Form</h1>
          <div className="text-sm text-[color:var(--text-muted)]">Fill your details and preferences to get a personalized travel plan.</div>

          <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="relative md:col-span-1">
            <label className="text-sm text-[color:var(--text-soft)]">
              Origin
              <input
                className="mt-1 w-full rounded-xl bg-[color:var(--glass)] px-3 py-2 outline-none ring-1 ring-[color:var(--glass-border)]"
                value={form.origin}
                onChange={(e) => {
                  setForm((f) => ({ ...f, origin: e.target.value }))
                }}
                placeholder="e.g. Bareilly, India"
                required
              />
            </label>

          </div>

          <div className="relative md:col-span-1">
            <label className="text-sm text-[color:var(--text-soft)]">
              Destination
              <input
                className="mt-1 w-full rounded-xl bg-[color:var(--glass)] px-3 py-2 outline-none ring-1 ring-[color:var(--glass-border)]"
                value={form.destination}
                onChange={(e) => {
                  setForm((f) => ({ ...f, destination: e.target.value }))
                }}
                placeholder="e.g. Delhi, India"
                required
              />
            </label>

          </div>

          <label className="text-sm text-[color:var(--text-soft)]">
            Start Date
            <input
              className="mt-1 w-full rounded-xl bg-[color:var(--glass)] px-3 py-2 outline-none ring-1 ring-[color:var(--glass-border)]"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </label>

          <label className="text-sm text-[color:var(--text-soft)]">
            End Date
            <input
              className="mt-1 w-full rounded-xl bg-[color:var(--glass)] px-3 py-2 outline-none ring-1 ring-[color:var(--glass-border)]"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              required
              min={form.startDate || new Date().toISOString().split('T')[0]}
            />
          </label>

          <label className="text-sm text-[color:var(--text-soft)]">
            Budget (₹ )
            <input
              className="mt-1 w-full rounded-xl bg-[color:var(--glass)] px-3 py-2 outline-none ring-1 ring-[color:var(--glass-border)]"
              type="number"
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              required
              min={0}
            />
          </label>

          <label className="text-sm text-[color:var(--text-soft)]">
            Transport Mode
            <select
              className="mt-1 w-full rounded-xl bg-[color:var(--glass)] px-3 py-2 outline-none ring-1 ring-[color:var(--glass-border)]"
              value={form.transportMode}
              onChange={(e) => setForm((f) => ({ ...f, transportMode: e.target.value }))}
            >
              <option value="Flight">Flight</option>
              <option value="Train">Train</option>
              <option value="Bus">Bus</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <div className="text-sm font-semibold text-[color:var(--text-muted)]">
              Travel Type
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  value: 'Solo',
                  title: 'Solo Traveler',
                  description: 'Exploring at your own pace',
                  icon: '🧳'
                },
                {
                  value: 'Couple',
                  title: 'Couple',
                  description: 'Romantic getaways',
                  icon: '❤️'
                },
                {
                  value: 'Family',
                  title: 'Family',
                  description: 'Kid-friendly activities',
                  icon: '👨‍👩‍👧‍👦'
                },
                {
                  value: 'Group/Friends',
                  title: 'Group/Friends',
                  description: 'Thrill-seekers group',
                  icon: '🎉'
                }
              ].map((option) => {
                const active = form.travelType === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, travelType: option.value, people: option.value === 'Couple' ? 2 : option.value === 'Solo' ? 1 : f.people }))}
                    className={
                      'group rounded-3xl border p-4 text-left transition-all ' +
                      (active
                        ? 'border-2 border-orange-300 bg-[color:var(--glass-hover)] shadow-[0_18px_40px_rgba(255,130,0,0.18)]'
                        : 'border-[color:var(--glass-border)] bg-[color:var(--glass)] hover:border-orange-300/60 hover:bg-[color:var(--glass-hover)]')
                    }
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl shadow-sm ring-1 ring-[color:var(--glass-border)]">
                      {option.icon}
                    </div>
                    <div className="mt-4 text-sm font-semibold text-[color:var(--text)]">
                      {option.title}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--text-soft)]">
                      {option.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="md:col-span-2 text-sm text-[color:var(--text-soft)]">
            Number of people
            <input
              className="mt-1 w-full rounded-xl bg-[color:var(--glass)] px-3 py-2 outline-none ring-1 ring-[color:var(--glass-border)]"
              type="number"
              value={form.people}
              disabled={!peopleEditable}
              onChange={(e) => setForm((f) => ({ ...f, people: e.target.value }))}
              required
              min={1}
            />
            {!peopleEditable ? <div className="mt-1 text-xs text-[color:var(--text-muted)]">Auto-set based on travel type.</div> : null}
          </label>

          <label className="md:col-span-2 text-sm text-[color:var(--text-soft)]">
            Preferences
            <textarea
              className="mt-1 min-h-[110px] w-full resize-y rounded-xl bg-[color:var(--glass)] px-3 py-2 outline-none ring-1 ring-[color:var(--glass-border)]"
              value={form.preferences}
              onChange={(e) => setForm((f) => ({ ...f, preferences: e.target.value }))}
              placeholder="e.g. food, adventure, history, beaches, off-the-beaten-path..."
            />
          </label>

          {error ? (
            <div className="md:col-span-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          ) : null}

          <div className="md:col-span-2">
            <button
              className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={generating || !isFormValid}
              type="submit"
              title={!isFormValid ? "Please fill all required details" : ""}
            >
              {generating ? 'Generating Plan...' : 'Generate Plan'}
            </button>
          </div>
        </form>
      </div>

      {result && <div className="mt-6 space-y-5">
        <TripListings trip={result} />
        <h2 className="text-xl font-bold">Suggested stops by day</h2>
        {result.optimizedItinerary.length ? result.optimizedItinerary.map(day => <p key={day} className="whitespace-pre-line">{day}</p>) : <p>No mapped stops found.</p>}
      </div>}
    </main>
  )
}
