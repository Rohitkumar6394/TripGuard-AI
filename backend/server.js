import 'dotenv/config'
import { liveTrip, resolveDestination, weatherAt, LookupError } from './live-trip.js'
import { createServer } from 'node:http'
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'
import mongoose from 'mongoose'
const port = Number(process.env.PORT || 4000)
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripguard_ai'
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const tokenSecret = process.env.TOKEN_SECRET || randomBytes(32).toString('hex')

const User = mongoose.model(
  'User',
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
    },
    { timestamps: true }
  )
)

const Trip = mongoose.model(
  'Trip',
  new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      origin: { type: String, required: true },
      destination: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      budget: { type: Number, default: 0 },
      transportMode: { type: String, default: 'Flight' },
      travelType: { type: String, default: 'Solo' },
      people: { type: Number, default: 1 },
      preferences: { type: String, default: '' },
      itineraryId: { type: String, required: true, unique: true },
      checkedAt: Date,
      resolvedLocation: String,
      places: mongoose.Schema.Types.Mixed,
      weatherInsights: String,
      transportDetails: String,
      hotels: { type: Array, default: [] },
      costPredictor: String,
      aiRecommendations: String,
      safetyScore: Number,
      safetyAlerts: { type: Array, default: [] },
      emergencyInfo: { type: Array, default: [] },
      optimizedItinerary: { type: Array, default: [] },
    },
    { timestamps: true }
  )
)

const demoFields = ['hotels', 'transportDetails', 'costPredictor', 'safetyScore', 'safetyAlerts', 'emergencyInfo', 'aiRecommendations']

function tripForDisplay(trip) {
  if (trip.checkedAt) {
    const { places, optimizedItinerary, ...summary } = trip
    return summary
  }
  const summary = { ...trip }
  for (const field of [...demoFields, 'optimizedItinerary', 'weatherInsights']) delete summary[field]
  delete summary.places
  return summary
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function passwordMatches(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(':')
  if (!salt || !storedHash) return false
  const hash = scryptSync(password, salt, 64)
  const expected = Buffer.from(storedHash, 'hex')
  return expected.length === hash.length && timingSafeEqual(expected, hash)
}

function createToken(userId) {
  const payload = Buffer.from(JSON.stringify({ sub: String(userId), exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url')
  const signature = createHmac('sha256', tokenSecret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function getUserIdFromToken(request) {
  const header = request.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  const token = header.slice(7)
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = createHmac('sha256', tokenSecret).update(payload).digest('base64url')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.sub || data.exp < Date.now()) return null
    return data.sub
  } catch {
    return null
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': clientOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  response.end(JSON.stringify(body))
}

async function readBody(request) {
  let body = ''
  for await (const chunk of request) body += chunk
  if (!body) return {}
  return JSON.parse(body)
}

async function getWeather(location) {
  const query = String(location || '').trim()
  if (!query) throw new Error('Location is required.')
  const place = await resolveDestination(query)
  const data = await weatherAt(place)
  const code = data.current?.weather_code
  const conditionMap = {0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Foggy',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Rain showers',81:'Rain showers',82:'Heavy showers',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm'}
  return {
    location: `${place.name}${place.country ? `, ${place.country}` : ''}`,
    current: { temperature: data.current?.temperature_2m, wind: data.current?.wind_speed_10m, condition: conditionMap[code] || 'Variable' },
    forecast: (data.daily?.time || []).slice(0,5).map((date,i)=>({date,max:data.daily.temperature_2m_max[i],min:data.daily.temperature_2m_min[i],rain:data.daily.precipitation_probability_max[i]}))
  }
}

async function buildSafetyReply(message, trip) {
  const q = String(message || '').toLowerCase()
  const destination = trip?.destination || 'your destination'
  if (q.includes('emergency') || q.includes('police') || q.includes('ambulance')) {
    return 'TripGuard has no verified emergency number for this location. Contact local emergency services or ask nearby staff for immediate help.'
  }
  if (q.includes('night') || q.includes('dark')) {
    return `For ${destination}, avoid isolated areas after dark, use verified transport, keep your phone charged, and share your live location/itinerary with a trusted contact. Check local advisories before going out.`
  }
  if (q.includes('weather') || q.includes('rain') || q.includes('temperature')) {
    try {
      const weather = await getWeather(destination)
      return `Current ${weather.location} weather: ${weather.current.temperature}°C, ${weather.current.condition}, wind ${weather.current.wind} km/h. Check the forecast before outdoor activities and carry weather-appropriate gear.`
    } catch {
      return `I could not fetch live weather for ${destination}. Please check the latest local forecast before outdoor activities.`
    }
  }
  if (q.includes('document') || q.includes('passport') || q.includes('carry')) {
    return 'Carry a valid ID/passport, copies of important documents, emergency contacts, required tickets/booking details, medicines if needed, and a charged phone/power bank. Keep digital copies securely backed up.'
  }
  if (q.includes('transport') || q.includes('taxi') || q.includes('cab')) {
    return `Use verified transport providers for ${destination}, confirm the vehicle/driver details, avoid accepting unsolicited rides, and share your trip details with someone you trust.`
  }
  return `For ${destination}, prioritize official travel advisories, weather checks, verified transport, secure accommodation, and communication with a trusted contact. I can also answer questions about emergencies, night travel, documents, transport, and weather.`
}

async function requireUser(request, response) {
  const userId = getUserIdFromToken(request)
  if (!userId) {
    sendJson(response, 401, { message: 'Authentication required. Please sign in again.' })
    return null
  }
  const user = await User.findById(userId).lean()
  if (!user) {
    sendJson(response, 401, { message: 'User account was not found.' })
    return null
  }
  return user
}

async function handleAuth(request, response, mode) {
  const body = await readBody(request)
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!email || password.length < 6) {
    return sendJson(response, 400, { message: 'Enter a valid email and a password with at least 6 characters.' })
  }

  if (mode === 'signup') {
    const name = String(body.name || '').trim()
    if (!name) return sendJson(response, 400, { message: 'Name is required.' })

    const exists = await User.findOne({ email }).lean()
    if (exists) return sendJson(response, 409, { message: 'An account with this email already exists.' })

    const user = await User.create({ name, email, password: hashPassword(password) })
    return sendJson(response, 201, {
      token: createToken(user._id),
      user: { id: String(user._id), name: user.name, email: user.email },
    })
  }

  const user = await User.findOne({ email })
  if (!user || !passwordMatches(password, user.password)) {
    return sendJson(response, 401, { message: 'Incorrect email or password.' })
  }

  return sendJson(response, 200, {
    token: createToken(user._id),
    user: { id: String(user._id), name: user.name, email: user.email },
  })
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {})
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  try {
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      return await handleAuth(request, response, 'login')
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/signup') {
      return await handleAuth(request, response, 'signup')
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(response, 200, {
        ok: true,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      })
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      const user = await requireUser(request, response)
      if (!user) return
      return sendJson(response, 200, { user: { id: String(user._id), name: user.name, email: user.email } })
    }


    if (request.method === 'GET' && url.pathname === '/api/weather') {
      const location = url.searchParams.get('location') || ''
      const weather = await getWeather(location)
      return sendJson(response, 200, weather)
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      const user = await requireUser(request, response)
      if (!user) return
      const body = await readBody(request)
      let trip = null
      if (body.tripId) trip = await Trip.findOne({ _id: body.tripId, userId: user._id }).lean()
      const reply = await buildSafetyReply(body.message, trip)
      return sendJson(response, 200, { reply })
    }

    if (request.method === 'POST' && url.pathname === '/api/trips') {
      const user = await requireUser(request, response)
      if (!user) return

      const body = await readBody(request)
      const required = ['origin', 'destination', 'startDate', 'endDate']
      if (required.some((key) => !String(body[key] || '').trim())) {
        return sendJson(response, 400, { message: 'Origin, destination, start date and end date are required.' })
      }
      if (new Date(body.endDate) < new Date(body.startDate)) {
        return sendJson(response, 400, { message: 'End date must be on or after the start date.' })
      }

      if (![body.startDate, body.endDate].every(date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().startsWith(date))) {
        return sendJson(response, 400, { message: 'Enter valid trip dates.' })
      }
      const { places, placesStatus, optimizedItinerary, ...plan } = await liveTrip(body)

      const trip = await Trip.create({
        userId: user._id,
        origin: String(body.origin).trim(),
        destination: String(body.destination).trim(),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        budget: Number(body.budget) || 0,
        transportMode: String(body.transportMode || 'Flight'),
        travelType: String(body.travelType || 'Solo'),
        people: Math.max(1, Number(body.people) || 1),
        preferences: String(body.preferences || '').trim(),
        ...plan,
      })
      return sendJson(response, 201, { trip: { ...trip.toObject(), places, placesStatus, optimizedItinerary } })
    }

    if (request.method === 'GET' && url.pathname === '/api/trips') {
      const user = await requireUser(request, response)
      if (!user) return
      const trips = await Trip.find({ userId: user._id }).sort({ createdAt: -1 }).lean()
      return sendJson(response, 200, { trips: trips.map(tripForDisplay) })
    }

    const refreshMatch = url.pathname.match(/^\/api\/trips\/([a-f0-9]{24})\/refresh$/i)
    if (request.method === 'POST' && refreshMatch) {
      const user = await requireUser(request, response)
      if (!user) return
      const filter = { _id: refreshMatch[1], userId: user._id }
      const saved = await Trip.findOne(filter).lean()
      if (!saved) return sendJson(response, 404, { message: 'Trip not found.' })
      const { places, placesStatus, optimizedItinerary, ...update } = await liveTrip({ ...saved, startDate: saved.startDate.toISOString().slice(0, 10), endDate: saved.endDate.toISOString().slice(0, 10) })
      delete update.itineraryId
      const obsolete = Object.fromEntries([...demoFields, 'places', 'optimizedItinerary'].map(key => [key, 1]))
      const trip = await Trip.findOneAndUpdate(filter, { $set: update, $unset: obsolete }, { new: true }).lean()
      return sendJson(response, 200, { trip: { ...trip, places, placesStatus, optimizedItinerary } })
    }

    const tripMatch = url.pathname.match(/^\/api\/trips\/([^/]+)$/)
    if (request.method === 'GET' && tripMatch) {
      const user = await requireUser(request, response)
      if (!user) return
      const trip = await Trip.findOne({ _id: tripMatch[1], userId: user._id }).lean()
      if (!trip) return sendJson(response, 404, { message: 'Trip not found.' })
      return sendJson(response, 200, { trip: tripForDisplay(trip) })
    }

    return sendJson(response, 404, { message: 'Route not found.' })
  } catch (error) {
    if (error instanceof LookupError) return sendJson(response, error.status, { message: error.message })
    console.error(error)
    return sendJson(response, 500, { message: 'Something went wrong. Please try again.' })
  }
})

async function start() {
  await mongoose.connect(mongoUri)
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
  server.listen(port, () => console.log(`TripGuard API running at http://localhost:${port}`))
}

start().catch((error) => {
  console.error('MongoDB connection failed:', error.message)
  process.exit(1)
})
