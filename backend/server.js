import { createServer } from 'node:http'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'
import mongoose from 'mongoose'

const port = Number(process.env.PORT || 4000)
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripguard_ai'
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const tokenSecret = process.env.TOKEN_SECRET || 'change-this-in-production'

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
      fullName: String,
      email: String,
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
      weatherInsights: String,
      transportDetails: String,
      hotels: { type: Array, default: [] },
      costPredictor: String,
      aiRecommendations: String,
      safetyScore: { type: Number, default: 85 },
      safetyAlerts: { type: Array, default: [] },
      emergencyInfo: { type: Array, default: [] },
      optimizedItinerary: { type: Array, default: [] },
    },
    { timestamps: true }
  )
)

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

function travelDays(startDate, endDate) {
  return Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
}

function buildTripPlan(input) {
  const destination = String(input.destination).trim()
  const origin = String(input.origin).trim()
  const people = Math.max(1, Number(input.people) || 1)
  const days = travelDays(input.startDate, input.endDate)
  const transportMode = String(input.transportMode || 'Flight')
  const preferences = String(input.preferences || '').trim()

  const accommodation = 95 * days
  const food = 40 * days * people
  const localTransport = 25 * days * people
  const activities = 45 * days * people
  const roundTripTravel = 250 * people
  const subtotal = accommodation + food + localTransport + activities + roundTripTravel
  const miscellaneous = Math.round(subtotal * 0.1)
  const total = subtotal + miscellaneous

  const safetyAlerts = [
    `Check the latest weather and local travel advisories for ${destination} before departure.`,
    `Keep your phone charged, carry identification, and share your itinerary with a trusted contact.`,
    `Avoid isolated areas after dark and use verified transport services.`
  ]
  const safetyScore = preferences.toLowerCase().includes('adventure') ? 78 : 88

  return {
    itineraryId: `trip-${randomUUID()}`,
    safetyScore,
    safetyAlerts,
    emergencyInfo: [
      { service: 'Emergency', number: '112', note: 'India emergency response number' },
      { service: 'Police', number: '100', note: 'Police assistance' },
      { service: 'Ambulance', number: '108', note: 'Medical emergency assistance' }
    ],
    weatherInsights: `Safety weather check for ${destination}: conditions can vary by season. Check the local forecast and official advisories before departure.`,
    transportDetails: `${transportMode} is selected for ${origin} → ${destination}. Estimated transport cost is included in the budget summary.`,
    hotels: [
      {
        name: `${destination} Grand Hotel`,
        price: 95,
        rating: 4.4,
        location: destination,
        mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`,
      },
      {
        name: `${destination} Comfort Stay`,
        price: 70,
        rating: 4.2,
        location: destination,
        mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`,
      },
      {
        name: `${destination} Premium Resort`,
        price: 145,
        rating: 4.7,
        location: destination,
        mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`,
      },
    ],
    costPredictor: `Accommodation: $${accommodation}
Food: $${food}
Local Transport: $${localTransport}
Sightseeing & Activities: $${activities}
Round Trip Travel: $${roundTripTravel}
Miscellaneous: $${miscellaneous}
Total Estimated Budget: $${total}`,
    aiRecommendations: `Start your day early to explore ${destination} comfortably.
Try local food and reserve popular attractions in advance.
Keep some flexible time for unexpected discoveries.
${preferences ? `Focus your activities around: ${preferences}.` : 'Balance sightseeing with enough rest time.'}`,
    optimizedItinerary: Array.from({ length: days }, (_, index) =>
      `Day ${index + 1}
• Explore a major attraction in ${destination}
• Enjoy local food and nearby experiences
• Relax and prepare for the next day`
    ),
  }
}

async function getWeather(location) {
  const query = String(location || '').trim()
  if (!query) throw new Error('Location is required.')
  const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`)
  if (!geoResponse.ok) throw new Error('Weather location lookup failed.')
  const geo = await geoResponse.json()
  const place = geo.results?.[0]
  if (!place) throw new Error('Could not find that destination.')
  const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`)
  if (!weatherResponse.ok) throw new Error('Weather service unavailable.')
  const data = await weatherResponse.json()
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
    return 'For India, call 112 for emergency response. Police: 100. Ambulance: 108. If you are abroad, use the local emergency number and contact your embassy/consulate when appropriate.'
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
  if (trip?.safetyAlerts?.length) {
    return `For your ${trip.destination} trip, your current safety score is ${trip.safetyScore}/100. Key advice: ${trip.safetyAlerts[0]}`
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

      const plan = buildTripPlan(body)
      const trip = await Trip.create({
        userId: user._id,
        fullName: String(body.fullName || user.name),
        email: String(body.email || user.email).toLowerCase(),
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
      return sendJson(response, 201, { trip })
    }

    if (request.method === 'GET' && url.pathname === '/api/trips') {
      const user = await requireUser(request, response)
      if (!user) return
      const trips = await Trip.find({ userId: user._id }).sort({ createdAt: -1 }).lean()
      return sendJson(response, 200, { trips })
    }

    const tripMatch = url.pathname.match(/^\/api\/trips\/([^/]+)$/)
    if (request.method === 'GET' && tripMatch) {
      const user = await requireUser(request, response)
      if (!user) return
      const trip = await Trip.findOne({ _id: tripMatch[1], userId: user._id }).lean()
      if (!trip) return sendJson(response, 404, { message: 'Trip not found.' })
      return sendJson(response, 200, { trip })
    }

    return sendJson(response, 404, { message: 'Route not found.' })
  } catch (error) {
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
