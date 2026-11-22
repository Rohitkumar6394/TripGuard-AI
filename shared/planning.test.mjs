import test from 'node:test'
import assert from 'node:assert/strict'
import { planTrip } from './planning.mjs'

const base = { budget: 20000, people: 2, startDate: '2026-12-01', endDate: '2026-12-03' }
const attractions = Array.from({ length: 9 }, (_, id) => ({ id, name: 'Museum ' + id }))
const places = { attractions, stores: [attractions[0], { id: 10, name: 'Market' }] }

test('sharing, extra rooms, group tickets and budget shortfall', () => {
  const couple = planTrip(base, places)
  assert.equal(couple.rooms, 1)
  assert.equal(couple.costs.lodging, 4000)
  assert.equal(couple.costs.activities, 9 * 2 * 400)
  const family = planTrip({ ...base, people: 5 }, places)
  assert.equal(family.rooms, 3)
  assert.equal(family.balance, -3250)
  assert.equal(family.scheduled, 0)
  assert.equal(planTrip({ ...base, budget: 9300 }, places).scheduled, 1)
})

test('day trips need no rooms and prepaid admissions are still pace limited', () => {
  const trip = planTrip({ ...base, people: 8, endDate: base.startDate, rates: { activity: 0 } }, places)
  assert.equal(trip.rooms, 0)
  assert.equal(trip.scheduled, 1)
  assert.equal(trip.costs.activities, 0)
})

test('saved count, missing listings, preferences and fares', () => {
  const input = { ...base, preferences: 'shopping', rates: { roundTrip: 1000 } }
  const fresh = planTrip(input, places)
  assert.equal(fresh.activityCount, 10)
  assert.ok(fresh.schedule[0].names.includes('Market'))
  assert.equal(fresh.costs.travel, 2000)
  assert.equal(planTrip({ ...input, activityCount: fresh.activityCount }).total, fresh.total)
  assert.equal(planTrip(input, {}).scheduled, 0)
})

test('invalid and incomplete numbers cannot produce a plan', () => {
  for (const values of [{people: 1.5}, {budget: ''}, {rates: {occupancy: 0}}, {budget: -1}, {endDate: '2025-01-01'}]) {
    assert.throws(() => planTrip({ ...base, ...values }, places))
  }
})
