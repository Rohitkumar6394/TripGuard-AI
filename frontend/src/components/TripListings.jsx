const categories = { resorts: 'Resorts', hotels: 'Hotels and guesthouses', stores: 'Stores', attractions: 'Things to see' }

export default function TripListings({ trip }) {
  if (!trip.checkedAt) return <p>This trip predates live listings. Refresh it to look up places.</p>
  return <section className="space-y-4">
    <header>
      <h2 className="text-xl font-bold">{trip.resolvedLocation}</h2>
      <p className="text-sm text-[color:var(--text-muted)]">Within 5 km of the destination center. Checked {new Date(trip.checkedAt).toLocaleString()}.</p>
      <a href="https://www.openstreetmap.org/copyright" className="text-sm underline">© OpenStreetMap contributors</a>
    </header>
    <div className="grid gap-4 sm:grid-cols-2">
      {Object.entries(categories).map(([key, label]) => <section key={key} className="rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-4">
        <h3 className="mb-2 font-bold">{label}</h3>
        {trip.places?.[key]?.length ? <ul className="space-y-2">{trip.places[key].map(place =>
          <li key={place.mapUrl}><a className="text-sm underline" target="_blank" rel="noreferrer" href={place.mapUrl}>{place.name}</a>
          </li>)}</ul> : <p className="text-sm text-[color:var(--text-muted)]">No matching listings nearby.</p>}
      </section>)}
    </div>
    <section><h3 className="font-bold">Trip forecast · Open-Meteo</h3><p className="whitespace-pre-line text-sm">{trip.weatherInsights}</p></section>
    <p className="text-sm text-[color:var(--text-muted)]">Check directly with the venue for prices, availability and opening hours.</p>
  </section>
}
