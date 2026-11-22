import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, CloudSun, MapPin, MessageCircle, Plus, ShieldCheck, WalletCards } from 'lucide-react'
import { apiFetch } from '../lib/api.js'

function Card({children,className=''}){return <div className={`rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-5 shadow-[var(--shadow-soft)] ${className}`}>{children}</div>}

export default function DashboardPage(){
  const navigate=useNavigate()
  const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('tripguard-user')||'null'))
  const [trips,setTrips]=useState([])
  const [weather,setWeather]=useState(null)
  const [loading,setLoading]=useState(true)
  const [weatherLoading,setWeatherLoading]=useState(false)
  const [error,setError]=useState('')

  useEffect(()=>{(async()=>{
    try{
      const [me,data]=await Promise.all([apiFetch('/api/auth/me'),apiFetch('/api/trips')])
      setUser(me.user); localStorage.setItem('tripguard-user',JSON.stringify(me.user)); setTrips(data.trips||[])
    }catch(e){if(e.status===401){localStorage.clear();navigate('/login');return} setError(e.message||'Unable to load dashboard.')}
    finally{setLoading(false)}
  })()},[navigate])

  const loadWeather=async()=>{
    const destination=trips[0]?.destination
    if(!destination)return
    setWeatherLoading(true)
    try{const data=await apiFetch(`/api/weather?location=${encodeURIComponent(destination)}`);setWeather(data)}catch(e){setError(e.message||'Weather unavailable.')}finally{setWeatherLoading(false)}
  }

  const latest=trips[0]
  return <main className="mx-auto max-w-7xl px-4 py-10">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div><p className="text-sm font-semibold text-emerald-500">WELCOME BACK</p><h1 className="mt-1 text-4xl font-black">Hello, {user?.name||'Traveler'} 👋</h1><p className="mt-2 text-sm text-[color:var(--text-muted)]">Your AI travel control center.</p></div>
      <Link to="/plan" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-white"><Plus size={18}/> Plan New Trip</Link>
    </div>

    {error&&<div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>}

    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[['Trips Saved',trips.length,'🧳'],['Safe Score',latest?.safetyScore??'—','🛡️'],['Budget',latest?.budget?`₹${Number(latest.budget).toLocaleString()}`:'—','💰'],['AI Assistant','Ready','🤖']].map(([a,b,c])=><Card key={a}><div className="flex items-center justify-between"><span className="text-sm text-[color:var(--text-muted)]">{a}</span><span className="text-xl">{c}</span></div><div className="mt-3 text-2xl font-black">{b}</div></Card>)}
    </div>

    <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Recent Trips</h2><p className="text-sm text-[color:var(--text-muted)]">Saved in MongoDB under your account.</p></div><Link to="/plan" className="text-sm font-semibold text-emerald-500">New trip</Link></div>
        <div className="mt-5 space-y-3">
          {loading?<p className="text-sm text-[color:var(--text-muted)]">Loading trips...</p>:trips.length===0?<div className="rounded-2xl border border-dashed border-[color:var(--glass-border)] p-8 text-center"><p className="font-semibold">No trips yet</p><p className="mt-1 text-sm text-[color:var(--text-muted)]">Create your first AI-powered safe trip.</p><Link to="/plan" className="mt-4 inline-block text-sm font-bold text-emerald-500">Start planning →</Link></div>:trips.slice(0,5).map(trip=><div key={trip._id} className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--glass-border)] p-4"><div className="min-w-0"><div className="flex items-center gap-2 font-bold"><MapPin size={15} className="text-emerald-500"/><span className="truncate">{trip.origin} → {trip.destination}</span></div><div className="mt-1 flex gap-3 text-xs text-[color:var(--text-muted)]"><span><CalendarDays size={12} className="mr-1 inline"/> {new Date(trip.startDate).toLocaleDateString()}</span><span>Safety {trip.safetyScore}/100</span></div></div><Link to="/plan" className="rounded-xl bg-[color:var(--glass-hover)] p-2"><ChevronRight size={17}/></Link></div>)}
        </div>
      </Card>

      <div className="space-y-5">
        <Card><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500"><CloudSun/></div><div><h2 className="font-bold">Weather</h2><p className="text-xs text-[color:var(--text-muted)]">{latest?.destination||'Create a trip first'}</p></div></div>{latest&&<><button onClick={loadWeather} disabled={weatherLoading} className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white">{weatherLoading?'Checking...':'Check destination weather'}</button>{weather&&<div className="mt-4 rounded-2xl bg-[color:var(--glass-hover)] p-4 text-sm"><b>{weather.location}</b><div className="mt-2 grid grid-cols-3 gap-2"><span>🌡️ {weather.current?.temperature}°C</span><span>💨 {weather.current?.wind} km/h</span><span>☁️ {weather.current?.condition}</span></div></div>}</>}</Card>
        <Card><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10 text-red-500"><ShieldCheck/></div><div><h2 className="font-bold">Safety Center</h2><p className="text-xs text-[color:var(--text-muted)]">Risk alerts and emergency guidance</p></div></div><Link to="/safety-chat" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--glass-border)] px-4 py-2.5 text-sm font-semibold"><MessageCircle size={16}/> Open Safety Chatbot</Link></Card>
      </div>
    </div>

    <Card className="mt-5"><div className="grid gap-4 md:grid-cols-3"><Link to="/plan" className="rounded-2xl bg-emerald-500 p-5 text-white"><WalletCards/><h3 className="mt-3 font-bold">AI Trip Planning + Budget</h3><p className="mt-1 text-sm text-white/80">Build your next plan and cost estimate.</p></Link><Link to="/itinerary" className="rounded-2xl bg-[color:var(--glass-hover)] p-5"><CalendarDays/><h3 className="mt-3 font-bold">AI Itinerary</h3><p className="mt-1 text-sm text-[color:var(--text-muted)]">Day-wise travel schedule generated with your trip.</p></Link><Link to="/safety-chat" className="rounded-2xl bg-[color:var(--glass-hover)] p-5"><ShieldCheck/><h3 className="mt-3 font-bold">Safety / Risk Analysis</h3><p className="mt-1 text-sm text-[color:var(--text-muted)]">Ask safety questions using trip context.</p></Link></div></Card>
  </main>
}
