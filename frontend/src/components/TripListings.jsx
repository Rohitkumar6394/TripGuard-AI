import { useState } from 'react'
import { BedDouble, Building2, Camera, CloudSun, ExternalLink, MapPin, Navigation, ShoppingBag, Star } from 'lucide-react'

const categories = [
  { id: 'hotels', label: 'Hotels', icon: BedDouble },
  { id: 'resorts', label: 'Resorts', icon: Building2 },
  { id: 'stores', label: 'Shopping', icon: ShoppingBag },
  { id: 'attractions', label: 'Attractions', icon: Camera },
]

function mapsSearch(query) {
  return 'https://www.google.com/maps/search/?' + new URLSearchParams({ api: 1, query })
}

export default function TripListings({ trip }) {
  const [category, setCategory] = useState('hotels')
  const [selected, selectPlace] = useState(null)
  const destination = trip.resolvedLocation || trip.destination
  const label = categories.find(item => item.id === category).label
  const places = trip.places?.[category]
  const active = places?.find(place => place.id === selected)
  const query = label + ' near ' + destination
  const embedKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY
  const embedParams = new URLSearchParams({ key: embedKey || '', q: active ? 'place_id:' + active.id : query })
  const mapLink = active?.mapUrl || mapsSearch(query)
  let empty = 'No matching places in this search area.'
  if (trip.placesStatus === 'unconfigured') empty = 'Live listings need a Google Places API key. You can browse this area in Google Maps.'
  else if (!trip.placesStatus) empty = 'Refresh this trip to look up current places.'
  else if (!places) empty = 'Google Places could not load this category. Try again or explore the area in Maps.'

  return <section className="overflow-hidden rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--bg-1)]">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--glass-border)] p-5 md:p-7">
      <div><div className="mb-2 flex items-center gap-2 text-sm text-[color:var(--text-muted)]"><MapPin size={16}/> Destination guide</div>
        <h2 className="text-2xl font-bold tracking-tight">{destination}</h2>
        {trip.checkedAt && <p className="mt-1 text-xs text-[color:var(--text-muted)]">Trip updated {new Date(trip.checkedAt).toLocaleString()}</p>}
      </div>
      <a href={mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-orange-400 px-4 py-2 text-sm font-bold text-black"><Navigation size={15}/> Open Google Maps</a>
    </header>
    <div className="p-5 md:p-7">
      <div aria-label="Place categories" role="group" className="mb-5 flex flex-wrap gap-2">
        {categories.map(({ id, label: title, icon: Icon }) => <button key={id} type="button" aria-pressed={category === id}
          onClick={() => { setCategory(id); selectPlace(null) }}
          className={'flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ' + (category === id ? 'border-orange-400 bg-orange-400/15' : 'border-[color:var(--glass-border)] hover:bg-[color:var(--glass)]')}>
          <Icon size={16}/>{title}
        </button>)}
      </div>
      {embedKey && <iframe title={'Google Maps for ' + (active?.name || query)} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
        className="mb-5 h-64 w-full rounded-2xl border-0" allowFullScreen src={'https://www.google.com/maps/embed/v1/' + (active ? 'place?' : 'search?') + embedParams}/>}
      {places?.length ? <>
        <div className="mb-3 flex justify-between text-sm"><b>{label} within {category === 'resorts' ? 25 : 5} km</b><span>Google Maps</span></div>
        <ul className="grid gap-3 md:grid-cols-2">{places.map(p => <li key={p.id} className="flex flex-col gap-2 rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-4">
          <h3 className="font-bold">{p.name}</h3>
          {p.address && <p className="text-sm text-[color:var(--text-muted)]">{p.address}</p>}
          {Number.isFinite(p.rating) && <p className="flex items-center gap-1 text-sm"><Star size={14} fill="currentColor" className="text-orange-400"/>{p.rating}{p.reviews != null && ' (' + p.reviews.toLocaleString() + ' reviews)'}</p>}
          {p.attributions?.map(a => <a key={a.provider + a.providerUri} href={a.providerUri} className="text-xs underline">{a.provider}</a>)}
          <div className="mt-auto flex gap-4 pt-2 text-sm font-semibold">
            <a className="inline-flex items-center gap-1" href={p.mapUrl || mapsSearch(p.name + ' ' + destination)} target="_blank" rel="noreferrer">Google Maps <ExternalLink size={13}/></a>
            {embedKey && <button type="button" onClick={() => selectPlace(p.id)}>Show on map</button>}
          </div>
        </li>)}</ul>
      </> : <div className="rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-5">
        <h3 className="font-bold">{label} near {destination.split(',')[0]}</h3>
        <p className="my-2 text-sm text-[color:var(--text-muted)]">{empty}</p>
        <a className="inline-flex items-center gap-1 text-sm font-bold underline" href={mapsSearch(query)} target="_blank" rel="noreferrer">Search Google Maps <ExternalLink size={13}/></a>
      </div>}
      {trip.weatherInsights && <section className="mt-6">
        <h3 className="mb-3 flex items-center gap-2 font-bold"><CloudSun size={18}/> Trip forecast <small className="font-normal text-[color:var(--text-muted)]">Open-Meteo</small></h3>
        <ul className="flex flex-wrap gap-2">{trip.weatherInsights.split('\n').map(line => <li className="rounded-xl bg-[color:var(--glass)] px-3 py-2 text-sm" key={line}>{line}</li>)}</ul>
      </section>}
      {trip.optimizedItinerary?.length > 0 && <section className="mt-6"><h3 className="mb-3 font-bold">Suggested stops by day</h3>
        <div className="grid gap-3 sm:grid-cols-2">{trip.optimizedItinerary.map(day => {
          const [heading, ...stops] = day.split('\n')
          return <div key={heading} className="rounded-xl border-l-2 border-orange-400 bg-[color:var(--glass)] p-4"><b>{heading}</b><ul className="mt-2 list-inside list-disc space-y-1 text-sm">{stops.map((s,i) => <li key={i}>{s}</li>)}</ul></div>
        })}</div></section>}
    </div>
  </section>
}
