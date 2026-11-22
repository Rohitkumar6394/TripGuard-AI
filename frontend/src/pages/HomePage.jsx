import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Brain, CalendarDays, CloudSun, Coins, MapPinned, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import homeImg from '../images/home1.png'

const features = [
  { icon: Brain, title: 'AI Trip Planning', text: 'Create a personalized trip plan from destination, dates, budget and interests.' },
  { icon: CalendarDays, title: 'AI Itinerary', text: 'Get a practical day-by-day itinerary with activities and travel suggestions.' },
  { icon: Coins, title: 'Budget Planner', text: 'Estimate accommodation, food, transport, activities and miscellaneous costs.' },
  { icon: ShieldCheck, title: 'Safety / Risk Analysis', text: 'Receive a safety score, risk alerts, precautions and emergency information.' },
  { icon: CloudSun, title: 'Weather', text: 'Check destination weather before you decide what to pack and where to go.' },
  { icon: MessageCircle, title: 'Safety Chatbot', text: 'Ask travel-safety questions and get guidance using your saved trip context.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const start = () => navigate(localStorage.getItem('tripguard-authenticated') === 'true' ? '/dashboard' : '/login')

  return (
    <main>
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={homeImg} alt="Travel destination" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-slate-450/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-emerald-950/40" />
        </div>
        <div className="relative mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-4 py-24 lg:grid-cols-2">
          <motion.div initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold text-emerald-200">
              <Sparkles size={15}/> AI-powered travel safety platform
            </div>
            <h1 className="text-5xl font-black leading-tight text-white md:text-7xl">
              Travel smart.<br/><span className="text-emerald-300">Travel safe.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-200">
              TripGuard AI plans your journey, builds an AI itinerary, manages your budget, checks weather and analyzes travel risks — all in one dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={start} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 font-bold text-white shadow-xl hover:bg-emerald-400">
                Start Planning <ArrowRight size={18}/>
              </button>
              <Link to="/#features" className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 font-semibold text-white backdrop-blur hover:bg-white/15">Explore Features</Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {['AI Planning','Risk Analysis','Budget Control'].map((x,i)=><div key={x} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><div className="text-lg font-bold text-white">{i===0?'🤖':i===1?'🛡️':'💰'}</div><div className="mt-1 text-xs text-slate-300">{x}</div></div>)}
            </div>
          </motion.div>
          {/* <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{duration:.7,delay:.15}} className="hidden lg:block"> */}
            {/* <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl"> */}
              {/* <div className="rounded-3xl bg-slate-950/70 p-6">
                {/* <div className="flex items-center justify-between"><div><p className="text-xs text-slate-400">TRIPGUARD AI</p><h2 className="mt-1 text-2xl font-bold text-white">Your safe trip, organized.</h2></div><ShieldCheck className="text-emerald-300"/></div> */}
                {/* <div className="mt-6 grid grid-cols-2 gap-3"> */}
                  {/* {['AI Itinerary','₹ Budget','Weather','Safety 92/100'].map(x=><div key={x} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-200">{x}</div>)} */}
                {/* </div> */}
                {/* <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">✓ Trip checked — ready to explore safely.</div> */}
              {/* </div> */}
            {/* </div> */}
          {/* </motion.div> */}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20">
        <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.25em] text-emerald-500">Everything in one place</p><h2 className="mt-3 text-4xl font-black">Powerful travel intelligence</h2><p className="mt-4 text-[color:var(--text-muted)]">From planning to safety, every important part of a trip is connected.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({icon:Icon,title,text})=><motion.div key={title} whileHover={{y:-5}} className="rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-6 shadow-[var(--shadow-soft)]"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500"><Icon size={23}/></div><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">{text}</p></motion.div>)}
        </div>
      </section>

      <section id="safety" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-2 md:items-center">
          <div><p className="text-sm font-bold uppercase tracking-[.25em] text-emerald-300">Safety first</p><h2 className="mt-3 text-4xl font-black">Your trip plan should protect you, too.</h2><p className="mt-5 leading-7 text-slate-300">TripGuard combines trip context with weather and rule-based risk signals to surface precautions, emergency contacts and safer travel suggestions.</p><button onClick={start} className="mt-7 rounded-2xl bg-emerald-500 px-6 py-3 font-bold hover:bg-emerald-400">Build a Safe Trip</button></div>
          <div className="grid gap-4 sm:grid-cols-3">{[['🛡️','Risk Score'],['🌦️','Weather'],['🚨','Emergency']].map(([a,b])=><div key={b} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center"><div className="text-3xl">{a}</div><div className="mt-3 font-semibold">{b}</div></div>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20">
        <p className="text-sm font-bold uppercase tracking-[.25em] text-emerald-500">Simple workflow</p><h2 className="mt-3 text-4xl font-black">How TripGuard works</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-4">{['Create account','Enter trip details','AI analyzes your trip','Explore safely'].map((x,i)=><div key={x} className="rounded-3xl border border-[color:var(--glass-border)] p-6"><div className="text-4xl font-black text-emerald-500">0{i+1}</div><h3 className="mt-4 font-bold">{x}</h3><p className="mt-2 text-sm text-[color:var(--text-muted)]">{['Your trips stay linked to your account.','Destination, dates, budget and preferences.','Itinerary, budget, weather and risk signals.','Use your dashboard and safety chatbot.'][i]}</p></div>)}</div>
      </section>
    </main>
  )
}
