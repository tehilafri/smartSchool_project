import "./About.css"

const About = () => {
  return (
    <section id="about" className="about section">
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <h2 className="section-title">למה Smart School?</h2>
            <p className="about-description">
              Smart School נוצרה מתוך הבנה עמוקה של האתגרים היומיומיים שעומדים בפני מנהלי בתי ספר, מורים ותלמידים.
              המערכת שלנו מספקת פתרון מקיף וחכם שחוסך זמן יקר ומפחית טעויות אנושיות.
            </p>

            <div className="about-highlights">
              <div className="highlight">
                <h4>🎯 פתרון מותאם</h4>
                <p>מערכת שפותחה במיוחד עבור מערכת החינוך הישראלית</p>
              </div>
              <div className="highlight">
                <h4>⚡ חיסכון בזמן</h4>
                <p>אוטומציה מלאה של תהליכים שלוקחים שעות רבות</p>
              </div>
              <div className="highlight">
                <h4>🔒 אמינות מלאה</h4>
                <p>מערכת יציבה ובטוחה עם גיבוי מתמיד של המידע</p>
              </div>
            </div>

            <div className="about-actions">
              <a href="#contact" className="btn btn-outline">
                צרו קשר
              </a>
            </div>
          </div>

          <div className="about-image">
            <div className="image-placeholder">
              <div className="placeholder-content">
                <h3>Smart School</h3>
                <p>מערכת ניהול חכמה</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
