import { useState } from "react"
import "./Dashboard.css"

const StudentDashboard = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState("overview")

  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "nextClass", label: "השיעור הבא", icon: "⏰" },
    { id: "schedule", label: "המערכת שלי", icon: "📅" },
    { id: "materials", label: "חומרי לימוד", icon: "📚" },
    { id: "exams", label: "מבחנים", icon: "📄" },
    { id: "events", label: "אירועים", icon: "🎉" },
    { id: "grades", label: "ציונים", icon: "📈" },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-content">
            <h2>סקירה כללית</h2>

            <div className="student-info-card">
              <div className="student-avatar">
                <span className="avatar-text">יכ</span>
              </div>
              <div className="student-details">
                <h3>יוסי כהן</h3>
                <p>כיתה ה' - תעודת זהות: 123456789</p>
                <p>מחנכת: רחל כהן</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>6</h3>
                  <p>שיעורים היום</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <h3>2</h3>
                  <p>מבחנים השבוע</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎉</div>
                <div className="stat-info">
                  <h3>1</h3>
                  <p>אירועים השבוע</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h3>87</h3>
                  <p>ממוצע ציונים</p>
                </div>
              </div>
            </div>

            <div className="student-quick-info">
              <div className="quick-info-card">
                <h3>השיעור הבא</h3>
                <div className="next-lesson-preview">
                  <div className="lesson-time">09:15 - 10:00</div>
                  <div className="lesson-subject">מתמטיקה</div>
                  <div className="lesson-teacher">רחל כהן</div>
                  <div className="lesson-room">כיתה 15</div>
                </div>
              </div>

              <div className="quick-info-card">
                <h3>מבחן הקרוב</h3>
                <div className="next-exam-preview">
                  <div className="exam-date">20/03/2024</div>
                  <div className="exam-subject">מתמטיקה - חילוק</div>
                  <div className="exam-time">09:00 - 10:30</div>
                  <div className="exam-countdown">בעוד 3 ימים</div>
                </div>
              </div>
            </div>

            <div className="recent-activities">
              <h3>עדכונים אחרונים</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-time">לפני שעה</span>
                  <span className="activity-text">נוסף חומר לימוד חדש במתמטיקה</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">אתמול</span>
                  <span className="activity-text">נקבע מבחן במתמטיקה ל-20/03</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">לפני יומיים</span>
                  <span className="activity-text">עודכן ציון במדעים - 95</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "nextClass":
        return (
          <div className="dashboard-content">
            <h2>השיעור הבא</h2>

            <div className="next-class-card">
              <div className="next-class-header">
                <h3>השיעור הבא שלך</h3>
                <span className="time-remaining">בעוד 15 דקות</span>
              </div>

              <div className="next-class-details">
                <div className="detail-item">
                  <span className="detail-label">מקצוע:</span>
                  <span className="detail-value">מתמטיקה</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">מורה:</span>
                  <span className="detail-value">רחל כהן</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">שעה:</span>
                  <span className="detail-value">09:15 - 10:00</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">כיתת לימוד:</span>
                  <span className="detail-value">כיתה 15</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">נושא השיעור:</span>
                  <span className="detail-value">חילוק עם שארית</span>
                </div>
              </div>

              <div className="next-class-actions">
                <button className="btn btn-primary">צפה בחומרים</button>
                <button className="btn btn-outline">הוסף לתזכורות</button>
              </div>
            </div>

            <div className="upcoming-classes">
              <h3>השיעורים הבאים היום</h3>
              <div className="upcoming-list">
                <div className="upcoming-item">
                  <span className="upcoming-time">10:45 - 11:30</span>
                  <span className="upcoming-subject">עברית - שרה לוי</span>
                  <span className="upcoming-room">כיתה 12</span>
                </div>
                <div className="upcoming-item">
                  <span className="upcoming-time">11:30 - 12:15</span>
                  <span className="upcoming-subject">מדעים - דנה גולד</span>
                  <span className="upcoming-room">מעבדה</span>
                </div>
                <div className="upcoming-item">
                  <span className="upcoming-time">13:00 - 13:45</span>
                  <span className="upcoming-subject">אנגלית - מיכל רוזן</span>
                  <span className="upcoming-room">כיתה 8</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "schedule":
        return (
          <div className="dashboard-content">
            <h2>המערכת שלי - כיתה ה'</h2>

            <div className="schedule-container">
              <div className="schedule-table">
                <table>
                  <thead>
                    <tr>
                      <th>שעה</th>
                      <th>ראשון</th>
                      <th>שני</th>
                      <th>שלישי</th>
                      <th>רביעי</th>
                      <th>חמישי</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="time-slot">08:30-09:15</td>
                      <td className="class-slot">
                        מתמטיקה
                        <br />
                        <small>רחל כהן</small>
                      </td>
                      <td className="class-slot">
                        עברית
                        <br />
                        <small>שרה לוי</small>
                      </td>
                      <td className="class-slot">
                        מתמטיקה
                        <br />
                        <small>רחל כהן</small>
                      </td>
                      <td className="class-slot">
                        מדעים
                        <br />
                        <small>דנה גולד</small>
                      </td>
                      <td className="class-slot">
                        אנגלית
                        <br />
                        <small>מיכל רוזן</small>
                      </td>
                    </tr>
                    <tr>
                      <td className="time-slot">09:15-10:00</td>
                      <td className="class-slot">
                        עברית
                        <br />
                        <small>שרה לוי</small>
                      </td>
                      <td className="class-slot">
                        מתמטיקה
                        <br />
                        <small>רחל כהן</small>
                      </td>
                      <td className="class-slot">
                        אנגלית
                        <br />
                        <small>מיכל רוזן</small>
                      </td>
                      <td className="class-slot">
                        עברית
                        <br />
                        <small>שרה לוי</small>
                      </td>
                      <td className="class-slot">
                        מתמטיקה
                        <br />
                        <small>רחל כהן</small>
                      </td>
                    </tr>
                    <tr>
                      <td className="time-slot">10:00-10:30</td>
                      <td className="class-slot empty" colspan="5">
                        הפסקה גדולה
                      </td>
                    </tr>
                    <tr>
                      <td className="time-slot">10:45-11:30</td>
                      <td className="class-slot">
                        מדעים
                        <br />
                        <small>דנה גולד</small>
                      </td>
                      <td className="class-slot">
                        אנגלית
                        <br />
                        <small>מיכל רוזן</small>
                      </td>
                      <td className="class-slot">
                        עברית
                        <br />
                        <small>שרה לוי</small>
                      </td>
                      <td className="class-slot">
                        מתמטיקה
                        <br />
                        <small>רחל כהן</small>
                      </td>
                      <td className="class-slot">
                        מדעים
                        <br />
                        <small>דנה גולד</small>
                      </td>
                    </tr>
                    <tr>
                      <td className="time-slot">11:30-12:15</td>
                      <td className="class-slot">
                        אנגלית
                        <br />
                        <small>מיכל רוזן</small>
                      </td>
                      <td className="class-slot">
                        מדעים
                        <br />
                        <small>דנה גולד</small>
                      </td>
                      <td className="class-slot">
                        ספורט
                        <br />
                        <small>אורי שמש</small>
                      </td>
                      <td className="class-slot">
                        אנגלית
                        <br />
                        <small>מיכל רוזן</small>
                      </td>
                      <td className="class-slot">
                        עברית
                        <br />
                        <small>שרה לוי</small>
                      </td>
                    </tr>
                    <tr>
                      <td className="time-slot">12:15-13:00</td>
                      <td className="class-slot empty" colspan="5">
                        הפסקת צהריים
                      </td>
                    </tr>
                    <tr>
                      <td className="time-slot">13:00-13:45</td>
                      <td className="class-slot">
                        היסטוריה
                        <br />
                        <small>אורי שמש</small>
                      </td>
                      <td className="class-slot">
                        אמנות
                        <br />
                        <small>מיכל רוזן</small>
                      </td>
                      <td className="class-slot">
                        מדעים
                        <br />
                        <small>דנה גולד</small>
                      </td>
                      <td className="class-slot">
                        ספורט
                        <br />
                        <small>אורי שמש</small>
                      </td>
                      <td className="class-slot">
                        היסטוריה
                        <br />
                        <small>אורי שמש</small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case "materials":
        return (
          <div className="dashboard-content">
            <h2>חומרי לימוד</h2>

            <div className="materials-by-subject">
              <div className="subject-materials">
                <h3>מתמטיקה</h3>
                <div className="materials-list">
                  <div className="material-item">
                    <div className="material-icon">📄</div>
                    <div className="material-info">
                      <h4>תרגילי חילוק עם שארית</h4>
                      <p>הועלה על ידי רחל כהן - לפני יום</p>
                    </div>
                    <div className="material-actions">
                      <button className="btn-small btn-primary">הורד</button>
                      <button className="btn-small btn-outline">צפה</button>
                    </div>
                  </div>

                  <div className="material-item">
                    <div className="material-icon">📄</div>
                    <div className="material-info">
                      <h4>דף עבודה - שברים</h4>
                      <p>הועלה על ידי רחל כהן - לפני 3 ימים</p>
                    </div>
                    <div className="material-actions">
                      <button className="btn-small btn-primary">הורד</button>
                      <button className="btn-small btn-outline">צפה</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="subject-materials">
                <h3>עברית</h3>
                <div className="materials-list">
                  <div className="material-item">
                    <div className="material-icon">📄</div>
                    <div className="material-info">
                      <h4>קריאה - סיפור קצר</h4>
                      <p>הועלה על ידי שרה לוי - לפני יומיים</p>
                    </div>
                    <div className="material-actions">
                      <button className="btn-small btn-primary">הורד</button>
                      <button className="btn-small btn-outline">צפה</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="subject-materials">
                <h3>מדעים</h3>
                <div className="materials-list">
                  <div className="material-item">
                    <div className="material-icon">📄</div>
                    <div className="material-info">
                      <h4>מערכת השמש</h4>
                      <p>הועלה על ידי דנה גולד - לפני שבוע</p>
                    </div>
                    <div className="material-actions">
                      <button className="btn-small btn-primary">הורד</button>
                      <button className="btn-small btn-outline">צפה</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "exams":
        return (
          <div className="dashboard-content">
            <h2>מבחנים</h2>

            <div className="exams-section">
              <h3>מבחנים קרובים</h3>
              <div className="exams-list">
                <div className="exam-card upcoming">
                  <div className="exam-header">
                    <h4>מבחן מתמטיקה</h4>
                    <span className="exam-date">20/03/2024</span>
                  </div>
                  <div className="exam-details">
                    <p>
                      <strong>מורה:</strong> רחל כהן
                    </p>
                    <p>
                      <strong>שעה:</strong> 09:00 - 10:30
                    </p>
                    <p>
                      <strong>נושאים:</strong> חילוק עם שארית, שברים
                    </p>
                    <p>
                      <strong>כיתת לימוד:</strong> כיתה 15
                    </p>
                  </div>
                  <div className="exam-countdown">
                    <span className="countdown-badge">בעוד 3 ימים</span>
                  </div>
                </div>

                <div className="exam-card upcoming">
                  <div className="exam-header">
                    <h4>מבחן עברית</h4>
                    <span className="exam-date">25/03/2024</span>
                  </div>
                  <div className="exam-details">
                    <p>
                      <strong>מורה:</strong> שרה לוי
                    </p>
                    <p>
                      <strong>שעה:</strong> 10:00 - 11:30
                    </p>
                    <p>
                      <strong>נושאים:</strong> הבנת הנקרא, כתיב
                    </p>
                    <p>
                      <strong>כיתת לימוד:</strong> כיתה 12
                    </p>
                  </div>
                  <div className="exam-countdown">
                    <span className="countdown-badge">בעוד שבוע</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="exams-section">
              <h3>מבחנים שעברו</h3>
              <div className="exams-list">
                <div className="exam-card past">
                  <div className="exam-header">
                    <h4>מבחן מדעים</h4>
                    <span className="exam-date">10/03/2024</span>
                  </div>
                  <div className="exam-details">
                    <p>
                      <strong>מורה:</strong> דנה גולד
                    </p>
                    <p>
                      <strong>נושאים:</strong> מערכת השמש
                    </p>
                    <p>
                      <strong>ציון:</strong> <span className="grade excellent">95</span>
                    </p>
                  </div>
                </div>

                <div className="exam-card past">
                  <div className="exam-header">
                    <h4>מבחן אנגלית</h4>
                    <span className="exam-date">05/03/2024</span>
                  </div>
                  <div className="exam-details">
                    <p>
                      <strong>מורה:</strong> מיכל רוזן
                    </p>
                    <p>
                      <strong>נושאים:</strong> אוצר מילים, דקדוק
                    </p>
                    <p>
                      <strong>ציון:</strong> <span className="grade good">82</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "events":
        return (
          <div className="dashboard-content">
            <h2>אירועים</h2>

            <div className="events-grid">
              <div className="event-card upcoming">
                <div className="event-header">
                  <h4>טיול לגן החיות</h4>
                  <span className="event-date">22/03/2024</span>
                </div>
                <div className="event-details">
                  <p>
                    <strong>שעה:</strong> 08:00 - 16:00
                  </p>
                  <p>
                    <strong>מקום:</strong> גן החיות התנכי
                  </p>
                  <p>
                    <strong>מלווים:</strong> רחל כהן, שרה לוי
                  </p>
                  <p>
                    <strong>הערות:</strong> להביא כובע וכריכים
                  </p>
                </div>
                <div className="event-status">
                  <span className="status-badge upcoming">קרוב</span>
                </div>
              </div>

              <div className="event-card today">
                <div className="event-header">
                  <h4>יום ספורט</h4>
                  <span className="event-date">היום</span>
                </div>
                <div className="event-details">
                  <p>
                    <strong>שעה:</strong> 13:00 - 15:00
                  </p>
                  <p>
                    <strong>מקום:</strong> מגרש בית הספר
                  </p>
                  <p>
                    <strong>פעילויות:</strong> כדורגל, כדורסל, ריצה
                  </p>
                  <p>
                    <strong>הערות:</strong> להביא בגדי ספורט
                  </p>
                </div>
                <div className="event-status">
                  <span className="status-badge today">היום</span>
                </div>
              </div>

              <div className="event-card past">
                <div className="event-header">
                  <h4>הצגה בבית הספר</h4>
                  <span className="event-date">15/03/2024</span>
                </div>
                <div className="event-details">
                  <p>
                    <strong>שעה:</strong> 10:00 - 11:30
                  </p>
                  <p>
                    <strong>מקום:</strong> אולם בית הספר
                  </p>
                  <p>
                    <strong>נושא:</strong> סיפורי התנך
                  </p>
                </div>
                <div className="event-status">
                  <span className="status-badge past">הסתיים</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "grades":
        return (
          <div className="dashboard-content">
            <h2>ציונים</h2>

            <div className="grades-summary">
              <div className="average-card">
                <h3>ממוצע כללי</h3>
                <div className="average-score">87</div>
                <p>מצוין!</p>
              </div>
            </div>

            <div className="grades-by-subject">
              <div className="subject-grades">
                <h3>מתמטיקה</h3>
                <div className="grades-list">
                  <div className="grade-item">
                    <span className="grade-date">15/03/2024</span>
                    <span className="grade-description">מבחן - חילוק</span>
                    <span className="grade-score excellent">92</span>
                  </div>
                  <div className="grade-item">
                    <span className="grade-date">08/03/2024</span>
                    <span className="grade-description">עבודה - שברים</span>
                    <span className="grade-score good">85</span>
                  </div>
                  <div className="grade-item">
                    <span className="grade-date">01/03/2024</span>
                    <span className="grade-description">בחינה חודשית</span>
                    <span className="grade-score excellent">90</span>
                  </div>
                </div>
                <div className="subject-average">
                  ממוצע: <span className="average excellent">89</span>
                </div>
              </div>

              <div className="subject-grades">
                <h3>עברית</h3>
                <div className="grades-list">
                  <div className="grade-item">
                    <span className="grade-date">12/03/2024</span>
                    <span className="grade-description">חיבור</span>
                    <span className="grade-score good">88</span>
                  </div>
                  <div className="grade-item">
                    <span className="grade-date">05/03/2024</span>
                    <span className="grade-description">הבנת הנקרא</span>
                    <span className="grade-score good">82</span>
                  </div>
                </div>
                <div className="subject-average">
                  ממוצע: <span className="average good">85</span>
                </div>
              </div>

              <div className="subject-grades">
                <h3>מדעים</h3>
                <div className="grades-list">
                  <div className="grade-item">
                    <span className="grade-date">10/03/2024</span>
                    <span className="grade-description">מבחן - מערכת השמש</span>
                    <span className="grade-score excellent">95</span>
                  </div>
                  <div className="grade-item">
                    <span className="grade-date">03/03/2024</span>
                    <span className="grade-description">פרויקט</span>
                    <span className="grade-score excellent">91</span>
                  </div>
                </div>
                <div className="subject-average">
                  ממוצע: <span className="average excellent">93</span>
                </div>
              </div>

              <div className="subject-grades">
                <h3>אנגלית</h3>
                <div className="grades-list">
                  <div className="grade-item">
                    <span className="grade-date">07/03/2024</span>
                    <span className="grade-description">מבחן אוצר מילים</span>
                    <span className="grade-score good">82</span>
                  </div>
                  <div className="grade-item">
                    <span className="grade-date">28/02/2024</span>
                    <span className="grade-description">עבודה בכיתה</span>
                    <span className="grade-score average">78</span>
                  </div>
                </div>
                <div className="subject-average">
                  ממוצע: <span className="average good">80</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="dashboard-content">
            <h2>{menuItems.find((item) => item.id === activeSection)?.label}</h2>
            <p>תוכן זה יפותח בקרוב...</p>
          </div>
        )
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Smart School</h2>
          <p>פאנל תלמיד</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-outline logout-btn" onClick={onLogout}>
            יציאה
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>ברוך הבא, יוסי כהן</h1>
          <div className="header-actions">
            <button className="btn btn-outline">הודעות</button>
            <button className="btn btn-primary">צ'אט</button>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  )
}

export default StudentDashboard
