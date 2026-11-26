import Hero from './Components/Hero.jsx'
import MatchCard from './Components/MatchCard.jsx'
import Navbar from './Components/Navbar.jsx'
import './App.css'

const matches = [
  {
    id: 'match-01',
    homeTeam: 'Chennai Super Kings',
    awayTeam: 'Mumbai Indians',
    date: '28 March 2026',
    time: '7:30 PM IST',
    venue: 'M. A. Chidambaram Stadium, Chennai',
    startingPrice: 800,
  },
  {
    id: 'match-02',
    homeTeam: 'Royal Challengers Bengaluru',
    awayTeam: 'Kolkata Knight Riders',
    date: '29 March 2026',
    time: '7:30 PM IST',
    venue: 'M. Chinnaswamy Stadium, Bengaluru',
    startingPrice: 800,
  },
  {
    id: 'match-03',
    homeTeam: 'Rajasthan Royals',
    awayTeam: 'Sunrisers Hyderabad',
    date: '30 March 2026',
    time: '7:30 PM IST',
    venue: 'Sawai Mansingh Stadium, Jaipur',
    startingPrice: 800,
  },
  {
    id: 'match-04',
    homeTeam: 'Delhi Capitals',
    awayTeam: 'Punjab Kings',
    date: '31 March 2026',
    time: '7:30 PM IST',
    venue: 'Arun Jaitley Stadium, Delhi',
    startingPrice: 800,
  },
]

function App() {
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
          <div className="matches-grid">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

export default App
