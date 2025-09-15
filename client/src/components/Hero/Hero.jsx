import "./Hero.css"

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">מערכת ניהול בית ספר חכמה ומתקדמת</h1>
          <p className="hero-subtitle">
            Smart School מספקת פתרון מקיף לניהול בית הספר שלכם - מניהול מערכת שעות דינמית ועד התראות אוטומטיות חכמות.
            הפכו את הניהול היומיומי לפשוט ויעיל יותר.
          </p>
          <div className="hero-actions">
            <a href="#signup" className="btn btn-primary btn-large">
              התחילו עכשיו בחינם
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">בתי ספר</span>
            </div>
            <div className="stat">
              <span className="stat-number">50,000+</span>
              <span className="stat-label">תלמידים</span>
            </div>
            <div className="stat">
              <span className="stat-number">5,000+</span>
              <span className="stat-label">מורים</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
