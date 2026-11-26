function MatchCard({ match }) {
  return (
    <article className="match-card">
      <div className="match-card-topline">
        <span>FEATURED MATCH</span>
        <span className="match-status">Tickets available</span>
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
    </article>
  )
}

export default MatchCard
