function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-content">
        <p className="eyebrow">THE BIGGEST CRICKET FESTIVAL</p>
        <h1 id="hero-title">Feel every moment.<br />Live every match.</h1>
        <p className="hero-description">
          Get closer to the action and experience the energy of IPL live.
        </p>
        <a className="hero-cta" href="#matches">Explore matches <span aria-hidden="true">→</span></a>
      </div>
      <div className="hero-badge" aria-hidden="true">
        <span>20</span>
        <span>OVER</span>
        <span>FEVER</span>
      </div>
    </section>
  )
}

export default Hero
