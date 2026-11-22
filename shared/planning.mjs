// INR planning allowances. Travelers can replace every rate with a quote.
export const defaultRates = {
  occupancy: 2, room: 2000, meals: 500, local: 250, activity: 400, roundTrip: 0,
}

function whole(value, minimum, maximum) {
  return (typeof value === 'number' || typeof value === 'string' && value.trim() !== '') &&
    Number.isSafeInteger(Number(value)) && Number(value) >= minimum && Number(value) <= maximum
}

export function planningInputs(input) {
  const budget = input.budget
  const people = input.people ?? 1
  if (!whole(budget, 0, 1e9)) throw new Error('Enter a whole group budget between ₹0 and ₹1,000,000,000.')
  if (!whole(people, 1, 1000)) throw new Error('Enter a party size between 1 and 1,000.')
  if (input.travelType === 'Solo' && Number(people) !== 1 || input.travelType === 'Couple' && Number(people) !== 2)
    throw new Error('Solo trips need one traveler and couple trips need two.')
  if (['Family', 'Group/Friends'].includes(input.travelType) && Number(people) < 2)
    throw new Error('Enter at least two travelers for a family or group trip.')
  const rates = {}
  for (const [key, fallback] of Object.entries(defaultRates)) {
    const value = input.rates?.[key] ?? fallback
    const occupancy = key === 'occupancy'
    if (!whole(value, occupancy ? 1 : 0, occupancy ? 20 : 1e7)) throw new Error('Check the ' + key + ' planning value.')
    rates[key] = Number(value)
  }
  return { budget: Number(budget), people: Number(people), rates }
}

export function planTrip(input, places) {
  const { budget, people, rates } = planningInputs(input)
  const start = Date.parse(input.startDate)
  const nights = (Date.parse(input.endDate) - start) / 86400000
  if (!Number.isInteger(nights) || nights < 0) throw new Error('Choose a valid date range.')
  const days = nights + 1
  const rooms = nights ? Math.ceil(people / rates.occupancy) : 0
  const costs = {
    lodging: rooms * nights * rates.room,
    meals: people * days * rates.meals,
    local: people * days * rates.local,
    travel: people * rates.roundTrip,
  }
  const essentials = Object.values(costs).reduce((sum, n) => sum + n, 0)
  if (!Number.isSafeInteger(essentials)) throw new Error('The total exceeds the supported planning range.')
  const available = Math.max(0, budget - essentials)
  const groupTicket = rates.activity * people
  const dailyLimit = people >= 8 ? 1 : people >= 4 || input.travelType === 'Family' ? 2 : 3
  const capacity = days * dailyLimit
  const slots = essentials > budget ? 0 : Math.min(capacity, groupTicket ? Math.floor(available / groupTicket) : capacity)
  const shoppingFirst = /shop|market|retail/i.test(input.preferences || '')
  const groups = [places?.attractions || [], places?.stores || []]
  if (shoppingFirst) groups.reverse()
  const candidates = [...new Map(groups.flat().map(p => [p.id, p])).values()]
  const selected = candidates.slice(0, slots)
  const schedule = []
  selected.forEach((p, i) => {
    // Spread sparse activities across the trip, while keeping each day's load bounded.
    const day = Math.floor(i * days / selected.length) + 1
    const last = schedule.at(-1)
    if (last?.day === day) last.names.push(p.name)
    else schedule.push({ day, names: [p.name] })
  })
  const scheduled = places ? selected.length : Math.min(input.activityCount || 0, slots)
  costs.activities = scheduled * groupTicket
  const total = essentials + costs.activities
  return { days, nights, rooms, people, budget, costs, essentials, total, balance: budget - total,
    dailyLimit, slots, scheduled, activityCount: candidates.length, schedule }
}
