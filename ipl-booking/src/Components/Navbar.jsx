function Navbar() {
  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="IPL Tickets home">
        <span className="brand-mark" aria-hidden="true">IPL</span>
        <span>IPL Tickets</span>
      </a>
      <nav className="site-nav" aria-label="Main navigation">
        <a href="#home">Home</a>
        <a href="#matches">Matches</a>
        <a className="nav-cta" href="#matches">Book tickets</a>
      </nav>
    </header>
  )
}

export default Navbar
