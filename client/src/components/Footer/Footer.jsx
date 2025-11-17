import { useState } from "react"
import api from "../../services/api"
import "./Footer.css"
import { setApiBaseUrl } from "../../services/api"

const Footer = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage('אנא הכנס כתובת אימייל')
      return
    }
    
    setLoading(true)
    try {
      const apiUrl = setApiBaseUrl();
      await api.post('/mailing-list/subscribe', { email })
      setMessage('נרשמת בהצלחה לרשימת התפוצה!')
      setEmail('')
    } catch (err) {
      setMessage('שגיאה בהרשמה. נסה שוב')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }
  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Smart School</h3>
            <p className="footer-description">
              מערכת ניהול בית ספר חכמה ומתקדמת שמפשטת את הניהול היומיומי ומשפרת את החוויה החינוכית.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                📧
              </a>
              <a href="#" className="social-link">
                📱
              </a>
              <a href="#" className="social-link">
                💬
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">קישורים מהירים</h4>
            <ul className="footer-links">
              <li>
                <a href="/#features">תכונות</a>
              </li>
              <li>
                <a href="/#about">אודות</a>
              </li>
              <li>
                <a href="/#testimonials">המלצות</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">תמיכה</h4>
            <ul className="footer-links">
              <li>
                <a href="/#help">מרכז עזרה</a>
              </li>
              <li>
                <a href="/#docs">תיעוד</a>
              </li>
              <li>
                <a href="/#support">צור קשר</a>
              </li>
              <li>
                <a href="/#training">הדרכות</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">צרו קשר</h4>
            <div className="contact-info">
              <p>📧 info@smartschool.co.il</p>
              <p>📱 03-1234567</p>
              <p>🌍 תל אביב, ישראל</p>
            </div>
            <div className="newsletter">
              <h5>הירשמו לעדכונים</h5>
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <input 
                  type="email" 
                  placeholder="כתובת אימייל" 
                  className="newsletter-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary newsletter-btn"
                  disabled={loading}
                >
                  {loading ? 'מרשם...' : 'הרשמה'}
                </button>
              </form>
              {message && (
                <p className={`newsletter-message ${message.includes('שגיאה') ? 'error' : 'success'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2025 Smart School. כל הזכויות שמורות.</p>
            <div className="footer-bottom-links">
              <a href="#privacy">מדיניות פרטיות</a>
              <a href="#terms">תנאי שימוש</a>
              <a href="#cookies">מדיניות עוגיות</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
