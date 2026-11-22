import { planTrip } from '../../../shared/planning.mjs'

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const labels = { lodging: 'Rooms', meals: 'Meals', local: 'Local travel', travel: 'Round-trip fares', activities: 'Scheduled activities' }

export default function TripBudget({ trip, places }) {
  let plan
  try { plan = planTrip(trip, places) }
  catch (error) { return <p className="text-sm text-[color:var(--text-muted)]">{error.message}</p> }
  const { rooms, nights, people, balance, costs, scheduled } = plan
  return <section className="space-y-3 rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-4" aria-label="Group budget estimate">
    <h3 className="text-lg font-bold">Group budget estimate</h3>
    <p>{people} {people === 1 ? 'traveler' : 'travelers'} · {plan.days} {plan.days === 1 ? 'day' : 'days'} · {rooms ? rooms + ' room' + (rooms === 1 ? '' : 's') + ' for ' + nights + ' night' + (nights === 1 ? '' : 's') : 'No overnight stay'}</p>
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(costs).map(([key, amount]) => <div key={key}>
      <dt className="text-xs text-[color:var(--text-muted)]">{labels[key]}</dt><dd className="font-semibold">{rupees.format(amount)}</dd>
    </div>)}</dl>
    <p aria-live="polite" className="border-t border-[color:var(--glass-border)] pt-3 font-semibold">
      {rupees.format(plan.total)} estimated · {rupees.format(Math.abs(balance))} {balance < 0 ? 'over budget' : 'remaining'}
    </p>
    <p className="text-sm text-[color:var(--text-muted)]">{balance < 0 ? 'Essential expenses exceed the group budget. Adjust costs, dates, or budget to add activities.' :
      scheduled + ' stops scheduled. Budget and group pace allow up to ' + plan.slots + ' group activities, capped at ' + plan.dailyLimit + ' per day.'}
      {!Number(trip.rates?.roundTrip) && ' Round-trip fares are excluded until entered.'}
    </p>
  </section>
}
