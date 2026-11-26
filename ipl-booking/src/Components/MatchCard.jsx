import { useState } from 'react'

function MatchCard({ match, onBook }) {
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [tickets, setTickets] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState('')
  const isSoldOut = match.availableSeats === 0

  async function handleSubmit(event) {
    event.preventDefault()
    setBookingMessage('')
    setBookingError('')
    setIsSubmitting(true)

    try {
      await onBook(match, {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        tickets: Number(tickets),
      })
      setBookingMessage('Booking confirmed.')
      setCustomerName('')
      setCustomerEmail('')
      setTickets(1)
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : 'Booking failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="match-card">
      <div className="match-card-topline">
        <span>FEATURED MATCH</span>
        <span className={`match-status${isSoldOut ? ' match-status-sold-out' : ''}`}>
          {isSoldOut ? 'Sold out' : `${match.availableSeats} seats available`}
        </span>
      </div>
      <h3 className="match-teams">
        <span>{match.homeTeam}</span>
        <span className="match-versus">VS</span>
        <span>{match.awayTeam}</span>
      </h3>
      <div className="match-details">
        <p><strong>Date &amp; time</strong><span>{match.date} · {match.time}</span></p>
        <p><strong>Venue</strong><span>{match.venue}</span></p>
      </div>
      <p className="match-price">
        Tickets from <strong>₹{match.startingPrice.toLocaleString('en-IN')}</strong>
      </p>

      <form className="booking-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            autoComplete="name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            required
            maxLength={100}
            disabled={isSoldOut || isSubmitting}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            required
            maxLength={254}
            disabled={isSoldOut || isSubmitting}
          />
        </label>
        <label>
          Tickets
          <input
            type="number"
            min="1"
            max={Math.min(10, match.availableSeats)}
            value={tickets}
            onChange={(event) => setTickets(event.target.value)}
            required
            disabled={isSoldOut || isSubmitting}
          />
        </label>
        <button type="submit" disabled={isSoldOut || isSubmitting}>
          {isSubmitting ? 'Booking…' : 'Book tickets'}
        </button>
      </form>

      {bookingMessage && (
        <p className="booking-message" role="status">{bookingMessage}</p>
      )}
      {bookingError && (
        <p className="booking-error" role="alert">{bookingError}</p>
      )}
    </article>
  )
}

export default MatchCard
