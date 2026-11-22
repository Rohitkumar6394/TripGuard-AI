import { randomUUID } from 'node:crypto'

export class LookupError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function readJson(url, service, timeout = 12000) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TripGuard-AI/1.0 (destination travel planner)', Accept: 'application/json' },
      signal: AbortSignal.timeout(timeout),
    })
    if (response.ok) return await response.json()
  } catch { /* Timeouts and invalid responses are service failures. */ }
  throw new LookupError(503, service + ' is unavailable. Please try again.')
}

export async function resolveDestination(query) {
  const [name, ...qualifiers] = String(query).split(',').map(value => value.trim().toLowerCase())
  if (!name) throw new LookupError(400, 'Enter a city or town.')
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.search = new URLSearchParams({ name, count: 100, language: 'en', format: 'json' })
  const data = await readJson(url, 'Destination search')
  const aliases = { usa: 'us', uk: 'gb', uae: 'ae' }
  const place = data.results?.find(candidate => {
    const fields = [candidate.country, candidate.country_code, candidate.admin1, candidate.admin2].map(v => v?.toLowerCase())
    return qualifiers.filter(Boolean).every(q => fields.includes(aliases[q] || q))
  })
  if (!place) throw new LookupError(422, 'Destination not found. Enter a town or city, optionally followed by its region or country.')
  return place
}

export async function weatherAt(place) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: place.latitude, longitude: place.longitude, timezone: 'auto', forecast_days: 16,
    current: 'temperature_2m,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  })
  return readJson(url, 'Weather')
}

const categories = {
  resorts: ['tourism:resort', 'leisure:resort'],
  hotels: ['tourism:hotel', 'tourism:guest_house', 'tourism:hostel'],
  stores: ['shop'],
  attractions: ['tourism:attraction', 'tourism:museum', 'tourism:viewpoint', 'tourism:gallery'],
}

async function nearbyPlaces(place) {
  const groups = await Promise.all(Object.entries(categories).map(async ([category, tags]) => {
    const url = new URL('reverse', (process.env.PHOTON_URL || 'https://photon.komoot.io').replace(/\/?$/, '/'))
    url.search = new URLSearchParams({ lat: place.latitude, lon: place.longitude, radius: 5, limit: 8 })
    for (const tag of tags) url.searchParams.append('osm_tag', tag)
    const data = await readJson(url, 'Place search')
    if (!Array.isArray(data.features)) throw new LookupError(503, 'Invalid response from place search.')
    const places = data.features.flatMap(({ properties: p }) => {
      const type = { N: 'node', W: 'way', R: 'relation' }[p?.osm_type]
      if (!p?.name || !type || !p.osm_id || !tags.some(tag => tag === p.osm_key || tag === p.osm_key + ':' + p.osm_value)) return []
      return [{ name: p.name, kind: p.osm_value, mapUrl: 'https://www.openstreetmap.org/' + type + '/' + p.osm_id }]
    })
    return [category, places]
  }))
  return Object.fromEntries(groups)
}

export async function liveTrip(input) {
  const place = await resolveDestination(input.destination)
  const [places, weather] = await Promise.all([nearbyPlaces(place), weatherAt(place).catch(() => null)])
  const forecast = (weather?.daily?.time || []).flatMap((date, i) => {
    if (date < input.startDate || date > input.endDate) return []
    const low = weather.daily.temperature_2m_min?.[i]
    const high = weather.daily.temperature_2m_max?.[i]
    return Number.isFinite(low) && Number.isFinite(high) ? [date + ' · ' + low + ' to ' + high + ' °C'] : []
  })
  const days = Math.round((Date.parse(input.endDate) - Date.parse(input.startDate)) / 86400000) + 1
  const stops = [...places.attractions, ...places.stores]
  const dayCount = Math.min(days, stops.length)
  const itinerary = Array.from({length: dayCount}, (_, i) => 'Day ' + (i + 1))
  stops.forEach((stop, i) => { itinerary[i % dayCount] += '\n' + stop.name })
  return {
    itineraryId: randomUUID(), checkedAt: new Date(), places,
    resolvedLocation: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
    weatherInsights: forecast.join('\n') || (weather ? 'No forecast covers these trip dates yet.' : 'Weather lookup unavailable.'),
    optimizedItinerary: itinerary,
  }
}
