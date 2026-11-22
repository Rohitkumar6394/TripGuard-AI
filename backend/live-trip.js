import { planTrip } from '../shared/planning.mjs'
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
  resorts: ['resort_hotel'],
  hotels: ['hotel', 'guest_house', 'hostel'],
  stores: ['shopping_mall', 'market', 'store'],
  attractions: ['tourist_attraction', 'museum', 'art_gallery'],
}

async function nearbyPlaces(place) {
  if (!process.env.GOOGLE_PLACES_API_KEY) return { places: {}, placesStatus: 'unconfigured' }
  const results = await Promise.all(Object.entries(categories).map(async ([category, types]) => {
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.attributions',
        },
        body: JSON.stringify({
          includedPrimaryTypes: types, maxResultCount: 8,
          locationRestriction: { circle: { center: { latitude: place.latitude, longitude: place.longitude }, radius: category === 'resorts' ? 25000 : 5000 } },
        }),
        signal: AbortSignal.timeout(12000),
      })
      if (!response.ok) throw new Error('HTTP ' + response.status)
      const data = await response.json()
      return [category, (data.places || []).filter(p => p.id && p.displayName?.text).map(p => ({
        id: p.id, name: p.displayName.text, address: p.formattedAddress, rating: p.rating,
        reviews: p.userRatingCount, mapUrl: p.googleMapsUri, attributions: p.attributions,
      }))]
    } catch (error) {
      console.warn('Google Places lookup failed for', category, error.message)
      return [category, null]
    }
  }))
  return { places: Object.fromEntries(results), placesStatus: 'requested' }
}

export async function liveTrip(input) {
  const place = await resolveDestination(input.destination)
  const [listings, weather] = await Promise.all([nearbyPlaces(place), weatherAt(place).catch(() => null)])
  const forecast = (weather?.daily?.time || []).flatMap((date, i) => {
    if (date < input.startDate || date > input.endDate) return []
    const low = weather.daily.temperature_2m_min?.[i]
    const high = weather.daily.temperature_2m_max?.[i]
    return Number.isFinite(low) && Number.isFinite(high) ? [date + ' · ' + low + ' to ' + high + ' °C'] : []
  })
  const plan = planTrip(input, listings.places)
  return {
    itineraryId: randomUUID(), checkedAt: new Date(), activityCount: plan.activityCount, ...listings,
    resolvedLocation: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
    weatherInsights: forecast.join('\n') || (weather ? 'No forecast covers these trip dates yet.' : 'Weather lookup unavailable.'),
    optimizedItinerary: plan.schedule.map(({ day, names }) => ['Day ' + day, ...names].join('\n')),
  }
}
