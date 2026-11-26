import { useCallback, useEffect, useRef, useState } from 'react'
import Hero from './Components/Hero.jsx'
import MatchCard from './Components/MatchCard.jsx'
import Navbar from './Components/Navbar.jsx'
import { supabase } from './supabase.js'
import './App.css'

const MATCH_COLUMNS =
  'id, team1, team2, date, time, venue, price, available_seats, premium_price, vip_price'

const MONTHS = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
}

function mapMatch(row) {
  return {
    id: row.id,
    homeTeam: row.team1,
    awayTeam: row.team2,
    date: row.date,
    time: row.time,
    venue: row.venue,
    startingPrice: row.price,
    availableSeats: row.available_seats,
    premiumPrice: row.premium_price,
    vipPrice: row.vip_price,
  }
}

function getMatchTimestamp(match) {
  const date = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(match.date)
  const time = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(match.time)

  if (!date || !time || MONTHS[date[1]] === undefined) {
    return Number.MAX_SAFE_INTEGER
  }

  let hour = Number(time[1]) % 12
  if (time[3].toUpperCase() === 'PM') {
    hour += 12
  }

  return Date.UTC(
    Number(date[3]),
    MONTHS[date[1]],
    Number(date[2]),
    hour,
    Number(time[2]),
  )
}

function sortMatches(rows) {
  return rows
    .map(mapMatch)
    .sort((a, b) => getMatchTimestamp(a) - getMatchTimestamp(b) || a.id - b.id)
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

async function fetchMatchRows() {
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_COLUMNS)
    .order('id')

  if (error) {
    throw error
  }

  return data ?? []
}

async function restoreSeats(matchId, ticketCount) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: match, error: readError } = await supabase
      .from('matches')
      .select('available_seats')
      .eq('id', matchId)
      .maybeSingle()

    if (readError) {
      throw new Error(`Could not restore seats: ${readError.message}`)
    }

    if (!match) {
      throw new Error('Could not restore seats because the match no longer exists.')
    }

    const { data: restoredMatch, error: updateError } = await supabase
      .from('matches')
      .update({ available_seats: match.available_seats + ticketCount })
      .eq('id', matchId)
      .eq('available_seats', match.available_seats)
      .select('id')
      .maybeSingle()

    if (updateError) {
      throw new Error(`Could not restore seats: ${updateError.message}`)
    }

    if (restoredMatch) {
      return
    }
  }

  throw new Error('Could not restore seats after repeated concurrent updates.')
}

function App() {
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [realtimeError, setRealtimeError] = useState('')
  const isMounted = useRef(false)

  const refreshMatches = useCallback(async () => {
    try {
      const rows = await fetchMatchRows()

      if (isMounted.current) {
        setMatches(sortMatches(rows))
        setLoadError('')
      }
      return true
    } catch (error) {
      if (isMounted.current) {
        setLoadError(getErrorMessage(error))
      }
      return false
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadInitialMatches = async () => {
      try {
        const rows = await fetchMatchRows()
        if (active) {
          setMatches(sortMatches(rows))
          setLoadError('')
        }
      } catch (error) {
        if (active) {
          setLoadError(getErrorMessage(error))
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialMatches()

    const channel = supabase
      .channel('ipl-booking-live-updates', { config: { private: false } })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          void refreshMatches()
        },
      )
      .on(
        'broadcast',
        { event: 'booking_created' },
        () => {
          void refreshMatches()
        },
      )
      .subscribe((status, error) => {
        if (!active) {
          return
        }

        if (status === 'SUBSCRIBED') {
          setRealtimeError('')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeError(
            error?.message || 'Live updates are unavailable. Refresh to see changes.',
          )
        }
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [refreshMatches])

  const bookTickets = useCallback(
    async (match, booking) => {
      let reserved = false
      let unitPrice = match.startingPrice

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { data: currentMatch, error: readError } = await supabase
          .from('matches')
          .select('available_seats, price')
          .eq('id', match.id)
          .maybeSingle()

        if (readError) {
          throw new Error(`Could not check availability: ${readError.message}`)
        }

        if (!currentMatch) {
          throw new Error('This match is no longer available.')
        }

        if (currentMatch.available_seats < booking.tickets) {
          throw new Error(
            `Only ${currentMatch.available_seats} ticket(s) remain for this match.`,
          )
        }

        const { data: updatedMatch, error: updateError } = await supabase
          .from('matches')
          .update({
            available_seats: currentMatch.available_seats - booking.tickets,
          })
          .eq('id', match.id)
          .eq('available_seats', currentMatch.available_seats)
          .select('id')
          .maybeSingle()

        if (updateError) {
          throw new Error(`Could not reserve seats: ${updateError.message}`)
        }

        if (updatedMatch) {
          reserved = true
          unitPrice = currentMatch.price
          break
        }
      }

      if (!reserved) {
        throw new Error('Availability changed repeatedly. Please try booking again.')
      }

      const { error: bookingError } = await supabase.from('bookings').insert({
        match_id: match.id,
        customer_name: booking.customerName,
        customer_email: booking.customerEmail,
        tickets: booking.tickets,
        unit_price: unitPrice,
      })

      if (bookingError) {
        try {
          await restoreSeats(match.id, booking.tickets)
        } catch (restoreError) {
          throw new Error(
            `Booking failed: ${bookingError.message}. ${getErrorMessage(restoreError)}`,
            { cause: restoreError },
          )
        }

        throw new Error(`Booking failed: ${bookingError.message}`)
      }

      await refreshMatches()
    },
    [refreshMatches],
  )

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <section className="matches-section" id="matches" aria-labelledby="matches-title">
          <div className="matches-heading">
            <p className="eyebrow">DON'T MISS THE ACTION</p>
            <h2 id="matches-title">Upcoming matches</h2>
          </div>

          {isLoading && <p role="status">Loading matches…</p>}
          {loadError && (
            <p className="matches-error" role="alert">
              Could not load matches: {loadError}
            </p>
          )}
          {realtimeError && (
            <p className="matches-error" role="status">
              Live updates unavailable: {realtimeError}
            </p>
          )}
          {!isLoading && !loadError && matches.length === 0 && (
            <p>No matches are currently available.</p>
          )}

          {matches.length > 0 && (
            <div className="matches-grid">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} onBook={bookTickets} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}

export default App
