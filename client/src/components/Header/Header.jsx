import { useState } from "react"
import "./Header.css"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
           <a href="/">
            <img src="/FullLogo.png" alt="Smart School Logo" className="logo-img" />
           </a>
          </div>

          <nav className={`nav ${isMenuOpen ? "nav-open" : ""}`}>
            <ul className="nav-list">
              <li>
                <a href="#features" className="nav-link">
                  תכונות
                </a>
              </li>
              <li>
                <a href="#about" className="nav-link">
                  אודות
                </a>
              </li>
              <li>
                <a href="#testimonials" className="nav-link">
                  המלצות
                </a>
              </li>
              <li>
                <a href="#contact" className="nav-link">
                  צור קשר
                </a>
              </li>
            </ul>
          </nav>

          <div className="header-actions">
            <a href="#login" className="btn btn-outline">
              התחברות
            </a>
            <a href="#signup" className="btn btn-primary">
              הרשמה
            </a>
          </div>

          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
