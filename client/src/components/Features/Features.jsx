import "./Features.css"

const Features = () => {
  const features = [
    {
      icon: "🔄",
      title: "ניהול מחליפים אוטומטי",
      description: "מערכת חכמה למציאת מחליפים למורים שלא יכולים להגיע, עם התראות אוטומטיות ומעקב בזמן אמת.",
    },
    {
      icon: "📅",
      title: "מערכת שעות דינמית",
      description: "מערכת שעות חכמה שמתעדכנת אוטומטית בהתאם לשינויים, מבחנים ואירועים בית ספריים.",
    },
    {
      icon: "📱",
      title: "התראות חכמות",
      description: "התראות אוטומטיות למורים, תלמידים והורים דרך WhatsApp, אימייל והודעות SMS.",
    },
    {
      icon: "📊",
      title: "ניהול מבחנים ואירועים",
      description: "תכנון מבחנים חכם שמונע חפיפות, ניהול אירועים בית ספריים ועדכון אוטומטי של המערכת.",
    },
      {
    icon: "🧭",
    title: "יועץ תזמון חכם",
    description: "AI מתקדם המנתח את לוח האירועים וממליץ מתי נכון לקבוע מבחנים, טיולים או פעילויות – כדי למנוע עומסים ולתכנן שבוע מאוזן.",
  },
   {
    icon: "👥",
    title: "ניהול משתמשים מתקדם",
    description:"מערכת רישום וניהול חכמה למורים, תלמידים ומזכירים עם הרשאות מותאמות אישית, עריכת פרטים בזמן אמת ומעקב אחר פעילות המשתמשים.",
  },
  ]

  return (
    <section id="features" className="features section">
      <div className="container">
        <div className="features-header">
          <h2 className="section-title">תכונות מתקדמות</h2>
          <p className="section-subtitle">גלו את הכלים החכמים שיהפכו את ניהול בית הספר שלכם לפשוט ויעיל</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
