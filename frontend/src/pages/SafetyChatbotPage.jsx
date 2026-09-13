import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Send, ShieldCheck, UserRound } from 'lucide-react'
import { apiFetch } from '../lib/api.js'

export default function SafetyChatbotPage(){
  const [trips,setTrips]=useState([])
  const [tripId,setTripId]=useState('')
  const [input,setInput]=useState('')
  const [messages,setMessages]=useState([{role:'assistant',text:'Hi! I am TripGuard Safety Assistant. Ask me about weather, emergency help, transport, risky areas, documents, or safe travel practices.'}])
  const [loading,setLoading]=useState(false)

  useEffect(()=>{apiFetch('/api/trips').then(d=>{setTrips(d.trips||[]);if(d.trips?.[0])setTripId(d.trips[0]._id)}).catch(()=>{})},[])

  const send=async(e)=>{
    e?.preventDefault(); const question=input.trim(); if(!question||loading)return
    setMessages(m=>[...m,{role:'user',text:question}]);setInput('');setLoading(true)
    try{
      const d=await apiFetch('/api/chat',{method:'POST',body:JSON.stringify({message:question,tripId})})
      setMessages(m=>[...m,{role:'assistant',text:d.reply}])
    }catch(err){setMessages(m=>[...m,{role:'assistant',text:err.message||'I could not answer right now.'}])}
    finally{setLoading(false)}
  }

  return <main className="mx-auto max-w-5xl px-4 py-10">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-500"><ShieldCheck size={17}/> SAFETY CENTER</div><h1 className="mt-2 text-4xl font-black">TripGuard Safety Chatbot</h1><p className="mt-2 text-sm text-[color:var(--text-muted)]">Context-aware safety guidance based on your saved trip.</p></div><Link to="/dashboard" className="text-sm font-semibold text-emerald-500">← Dashboard</Link></div>
    <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_280px]">
      <section className="flex min-h-[560px] flex-col rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-4">
        <div className="flex-1 space-y-4 overflow-auto p-2">
          {messages.map((m,i)=><div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}><div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-6 ${m.role==='user'?'bg-emerald-500 text-white':'bg-[color:var(--glass-hover)]'}`}>{m.role==='assistant'?<Bot size={16} className="mb-2 text-emerald-500"/>:<UserRound size={16} className="mb-2"/>}{m.text}</div></div>)}
          {loading&&<div className="text-sm text-[color:var(--text-muted)]">Safety assistant is thinking...</div>}
        </div>
        <form onSubmit={send} className="mt-3 flex gap-2 border-t border-[color:var(--glass-border)] pt-4"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="e.g. Is it safe to travel at night?" className="min-w-0 flex-1 rounded-2xl bg-[color:var(--glass-hover)] px-4 py-3 text-sm outline-none"/><button className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white"><Send size={18}/></button></form>
      </section>
      <aside className="space-y-4">
        <div className="rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-5"><h2 className="font-bold">Trip Context</h2><select value={tripId} onChange={e=>setTripId(e.target.value)} className="mt-3 w-full rounded-xl bg-[color:var(--glass-hover)] p-3 text-sm outline-none"><option value="">General safety</option>{trips.map(t=><option key={t._id} value={t._id}>{t.origin} → {t.destination}</option>)}</select>{tripId&&trips.find(t=>t._id===tripId)&&<div className="mt-4 rounded-2xl bg-emerald-500/10 p-4 text-sm"><b>Safety score</b><div className="mt-1 text-2xl font-black text-emerald-500">{trips.find(t=>t._id===tripId).safetyScore}/100</div></div>}</div>
        <div className="rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-5 text-sm"><b>Try asking</b><div className="mt-3 space-y-2 text-[color:var(--text-muted)]">{['What safety precautions should I take?','What emergency number should I call?','Should I avoid traveling at night?','What should I carry for this trip?'].map(q=><button key={q} onClick={()=>setInput(q)} className="block text-left hover:text-emerald-500">{q}</button>)}</div></div>
      </aside>
    </div>
  </main>
}
