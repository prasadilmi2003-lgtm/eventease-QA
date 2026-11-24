/**
 * Member 2 - Black-box testing (Section 3.3)
 * Unit under test: POST /api/bookings  ->  createBooking() in src/controllers/bookingController.js
 *
 * Technique coverage:
 *   - Decision Table (rules R1..R10, see docs/qa/section-3.3-black-box-testing.md)
 *   - Boundary Value Analysis on ticket quantity (0/1/10/11) and on remaining stock
 * Only request body + authenticated user go in; only status code / message / stock
 * side effects are asserted. No MongoDB is required: the models are test doubles.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Booking from '../src/models/Booking.js'
import Event from '../src/models/Event.js'
import Ticket from '../src/models/Ticket.js'
import { createBooking } from '../src/controllers/bookingController.js'

const EVENT_ID = '507f1f77bcf86cd799439011' // valid ObjectId shape
const HOUR = 60 * 60 * 1000
const future = (ms) => new Date(Date.now() + ms)
const past = (ms) => new Date(Date.now() - ms)

const mockRes = () => {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

const ticketType = (over = {}) => ({
  _id: 'tt1',
  name: 'General',
  price: 1000,
  quantity: 100,
  sold: 0,
  salesStart: null,
  salesEnd: null,
  ...over,
})

const eventDoc = (over = {}) => ({
  _id: EVENT_ID,
  title: 'QA Conference',
  category: 'tech',
  status: 'published',
  startDate: future(72 * HOUR),
  endDate: future(96 * HOUR),
  venue: 'BMICH',
  city: 'Colombo',
  ticketTypes: [ticketType()],
  ...over,
})

const req = (items, eventId = EVENT_ID) => ({
  body: { eventId, items },
  user: { _id: 'u1', role: 'attendee' },
})

let res, next, event

// Wires up the data layer: real inventory rules, in memory, so oversell protection is observable
const givenEvent = (ev) => {
  event = ev
  vi.spyOn(Event, 'findById').mockResolvedValue(ev)

  // Mirrors the atomic guard in the controller: only decrement if enough stock is left
  vi.spyOn(Event, 'findOneAndUpdate').mockImplementation(async (filter, update) => {
    const id = filter['ticketTypes._id']
    const cap = filter['ticketTypes.sold'].$lte
    const tt = ev.ticketTypes.find((t) => t._id === id)
    if (!tt || tt.sold > cap) return null
    tt.sold += update.$inc['ticketTypes.$.sold']
    return ev
  })
  vi.spyOn(Event, 'updateOne').mockImplementation(async (filter, update) => {
    const tt = ev.ticketTypes.find((t) => t._id === filter['ticketTypes._id'])
    if (tt) tt.sold += update.$inc['ticketTypes.$.sold'] // rollback path
    return { modifiedCount: 1 }
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  res = mockRes()
  next = vi.fn()
  givenEvent(eventDoc())
  vi.spyOn(Booking, 'findOne').mockResolvedValue(null) // no duplicate, reference is unique
  vi.spyOn(Booking, 'create').mockImplementation(async (doc) => ({ ...doc, _id: 'b1' }))
  vi.spyOn(Ticket, 'insertMany').mockImplementation(async (docs) =>
    docs.map((d, i) => ({ ...d, _id: `t${i}` })),
  )
})

const message = () => res.json.mock.calls[0][0].message

describe('createBooking - Decision Table rules', () => {
  it('BB-BOOK-01 / R1: all conditions satisfied -> 201, stock decremented, tickets issued', async () => {
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 2 }]), res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(event.ticketTypes[0].sold).toBe(2)
    expect(Ticket.insertMany).toHaveBeenCalledWith(expect.arrayContaining([expect.anything()]))
    expect(Ticket.insertMany.mock.calls[0][0]).toHaveLength(2) // one ticket per seat
    expect(res.json.mock.calls[0][0].totalAmount).toBe(2000)
  })

  it('BB-BOOK-02 / R2: malformed event id -> 404', async () => {
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 1 }], 'not-an-id'), res, next)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(message()).toBe('Event not found or not open for booking')
  })

  it('BB-BOOK-03 / R3: event is a draft (not published) -> 404', async () => {
    givenEvent(eventDoc({ status: 'draft' }))
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 1 }]), res, next)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('BB-BOOK-04 / R4: event already ended -> 400', async () => {
    givenEvent(eventDoc({ startDate: past(48 * HOUR), endDate: past(24 * HOUR) }))
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 1 }]), res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(message()).toBe('This event has already ended')
  })

  it('BB-BOOK-05 / R5: empty items array -> 400', async () => {
    await createBooking(req([]), res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(message()).toBe('Select at least one ticket')
  })

  it('BB-BOOK-06 / R6: unknown ticket type -> 400', async () => {
    await createBooking(req([{ ticketTypeId: 'does-not-exist', quantity: 1 }]), res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(message()).toBe('Invalid ticket type')
  })

  it('BB-BOOK-07 / R7: sales not open yet -> 400', async () => {
    givenEvent(eventDoc({ ticketTypes: [ticketType({ salesStart: future(24 * HOUR) })] }))
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 1 }]), res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(message()).toBe('General is not on sale yet')
  })

  it('BB-BOOK-08 / R8: sales already closed -> 400', async () => {
    givenEvent(eventDoc({ ticketTypes: [ticketType({ salesEnd: past(HOUR) })] }))
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 1 }]), res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(message()).toBe('Sales have ended for General')
  })

  it('BB-BOOK-09 / R9: requested more than remaining -> 409, stock untouched', async () => {
    givenEvent(eventDoc({ ticketTypes: [ticketType({ quantity: 10, sold: 8 })] }))
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 3 }]), res, next)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(message()).toBe('Only 2 left for General')
    expect(event.ticketTypes[0].sold).toBe(8)
  })

  it('BB-BOOK-10 / R10: free event booked twice -> 409 duplicate registration', async () => {
    givenEvent(eventDoc({ ticketTypes: [ticketType({ price: 0 })] }))
    Booking.findOne.mockResolvedValue({ _id: 'b0' }) // an earlier free booking exists
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 1 }]), res, next)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(message()).toBe('You are already registered for this event')
    expect(event.ticketTypes[0].sold).toBe(0)
  })

  it('BB-BOOK-11: unexpected database failure -> passed to the error handler', async () => {
    const dbError = new Error('DB down')
    Event.findById.mockRejectedValue(dbError)
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 1 }]), res, next)
    expect(next).toHaveBeenCalledWith(dbError)
  })
})

describe('createBooking - Boundary Value Analysis on quantity', () => {
  it.each([
    ['BB-BOOK-12', 0, 400, 'Invalid quantity'],
    ['BB-BOOK-13', 1, 201, null],
    ['BB-BOOK-14', 10, 201, null],
    ['BB-BOOK-15', 11, 400, 'You can book at most 10 tickets at once'],
  ])('%s: quantity %i -> %i', async (_id, quantity, status, msg) => {
    await createBooking(req([{ ticketTypeId: 'tt1', quantity }]), res, next)
    expect(res.status).toHaveBeenCalledWith(status)
    if (msg) expect(message()).toBe(msg)
  })

  it.each([
    ['BB-BOOK-16', -1],
    ['BB-BOOK-17', 1.5],
    ['BB-BOOK-18', 'two'],
  ])('%s: non-integer / negative quantity %s -> 400 Invalid quantity', async (_id, quantity) => {
    await createBooking(req([{ ticketTypeId: 'tt1', quantity }]), res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(message()).toBe('Invalid quantity')
  })

  it('BB-BOOK-19: quantity equals remaining stock (last tickets) -> 201, sold out after', async () => {
    givenEvent(eventDoc({ ticketTypes: [ticketType({ quantity: 10, sold: 8 })] }))
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 2 }]), res, next)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(event.ticketTypes[0].sold).toBe(10)
  })

  it('BB-BOOK-20: two lines of the same type exceeding stock -> 409 and stock rolled back', async () => {
    givenEvent(eventDoc({ ticketTypes: [ticketType({ quantity: 5, sold: 0 })] }))
    await createBooking(
      req([
        { ticketTypeId: 'tt1', quantity: 3 },
        { ticketTypeId: 'tt1', quantity: 3 },
      ]),
      res,
      next,
    )
    expect(res.status).toHaveBeenCalledWith(409)
    expect(event.ticketTypes[0].sold).toBe(0) // no overselling, first decrement rolled back
    expect(Booking.create).not.toHaveBeenCalled()
  })

  it('BB-BOOK-21 / OBS-1: 11 requested while only 2 remain -> stock rule wins, 409 before the 10-ticket cap', async () => {
    givenEvent(eventDoc({ ticketTypes: [ticketType({ quantity: 10, sold: 8 })] }))
    await createBooking(req([{ ticketTypeId: 'tt1', quantity: 11 }]), res, next)
    // Documents the check order reported as OBS-1: the cap message is never shown here
    expect(res.status).toHaveBeenCalledWith(409)
    expect(message()).toBe('Only 2 left for General')
  })
})
