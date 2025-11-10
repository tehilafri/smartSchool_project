import { useState } from "react"
import { Link , useLocation} from "react-router-dom";
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
                <Link to="/#features" className="nav-link">
                  תכונות
                </Link>
              </li>
              <li>
                <Link to="/#about" className="nav-link">
                  אודות
                </Link>
              </li>
              <li>
                <Link to="/#testimonials" className="nav-link">
                  המלצות
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="nav-link">
                  צור קשר
                </Link>
              </li>
            </ul>
          </nav>

          <div className="header-actions">
            <Link to="/login" className="btn btn-outline">
              התחברות למערכת
            </Link>
            <Link to="/admin-registration" className="btn btn-primary btn-large">
              בקשת הרשמת בית ספר חדש  
            </Link>
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
