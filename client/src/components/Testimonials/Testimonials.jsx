import { useState } from "react"
import "./Testimonials.css"

const Testimonials = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const testimonials = [
    {
      name: "רחל כהן",
      role: "מנהלת בית ספר יסודי",
      school: "בית ספר אורט",
      content:
        "Smart School שינתה לחלוטין את הדרך שבה אנחנו מנהלים את בית הספר. החיסכון בזמן והפחתת הטעויות מדהימים. המערכת פשוט עובדת!",
      rating: 5,
    },
    {
      name: "דוד לוי",
      role: "מורה למתמטיקה",
      school: "תיכון הרצל",
      content: "כמורה שמלמד בכמה כיתות, המערכת עוזרת לי לעקוב אחר השינויים במערכת השעות בזמן אמת. פשוט מושלם!",
      rating: 5,
    },
    {
      name: "מירי אברהם",
      role: "מזכירת בית ספר",
      school: "בית ספר אלון",
      content: "המערכת החכמה למציאת מחליפים חסכה לנו שעות של עבודה כל שבוע. התהליך שהיה לוקח שעות, עכשיו נעשה בדקות.",
      rating: 5,
    },
    {
      name: "טליה בן שושן",
      role: "מורה לאנגלית",
      school: "חטיבת הביניים נוף הרים",
      content: "המערכת עוזרת לי לקבוע מועדי מבחנים – ה-AI מזהה עומס ואירועים ומציע תאריך חלופי מושלם. מדויק ונוח!",
      rating: 5,
    },
  ]

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

 const goToTestimonial = (index) => {
  setCurrentTestimonial(index)
}

  return (
    <section id="testimonials" className="testimonials section">
      <div className="container">
        <div className="testimonials-header">
          <h2 className="section-title">מה אומרים הלקוחות</h2>
          <p className="section-subtitle">שמעו מבתי ספר שכבר חווים את היתרונות של Smart School</p>
        </div>

        <div className="testimonials-carousel">
          <button className="carousel-btn prev-btn" onClick={prevTestimonial}>
            ‹
          </button>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <div className="stars">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <span key={i} className="star">
                    ★
                  </span>
                ))}
              </div>
              <p className="testimonial-text">"{testimonials[currentTestimonial].content}"</p>
              <div className="testimonial-author">
                <div className="author-info">
                  <h4 className="author-name">{testimonials[currentTestimonial].name}</h4>
                  <p className="author-role">{testimonials[currentTestimonial].role}</p>
                  <p className="author-school">{testimonials[currentTestimonial].school}</p>
                </div>
              </div>
            </div>
          </div>

          <button className="carousel-btn next-btn" onClick={nextTestimonial}>
            ›
          </button>
        </div>

        <div className="testimonials-dots">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentTestimonial ? "active" : ""}`}
              onClick={() => goToTestimonial(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
