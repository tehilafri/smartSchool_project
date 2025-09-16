import { useState } from "react"
import "./Dashboard.css"

const SecretaryDashboard = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState("overview")
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("")

  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "students", label: "ניהול תלמידים", icon: "👨‍🎓" },
    { id: "events", label: "ניהול אירועים", icon: "🎉" },
    { id: "classes", label: "ניהול כיתות", icon: "🏫" },
    { id: "substitutes", label: "ממלאי מקום", icon: "🔄" },
    { id: "calendar", label: "יומן בית ספרי", icon: "📅" },
    { id: "reports", label: "דוחות", icon: "📈" },
  ]

  const openModal = (type) => {
    setModalType(type)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalType("")
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-content">
            <h2>סקירה כללית</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👨‍🎓</div>
                <div className="stat-info">
                  <h3>320</h3>
                  <p>תלמידים</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏫</div>
                <div className="stat-info">
                  <h3>12</h3>
                  <p>כיתות</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎉</div>
                <div className="stat-info">
                  <h3>5</h3>
                  <p>אירועים השבוע</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <h3>8</h3>
                  <p>ממלאי מקום</p>
                </div>
              </div>
            </div>

            <div className="secretary-quick-actions">
              <h3>פעולות מהירות</h3>
              <div className="quick-actions-grid">
                <button className="quick-action-card" onClick={() => openModal("addStudent")}>
                  <span className="action-icon">👨‍🎓</span>
                  <span className="action-text">הוסף תלמיד</span>
                </button>
                <button className="quick-action-card" onClick={() => openModal("addEvent")}>
                  <span className="action-icon">🎉</span>
                  <span className="action-text">הוסף אירוע</span>
                </button>
                <button className="quick-action-card" onClick={() => openModal("addSubstitute")}>
                  <span className="action-icon">🔄</span>
                  <span className="action-text">הוסף ממלא מקום</span>
                </button>
                <button className="quick-action-card" onClick={() => setActiveSection("classes")}>
                  <span className="action-icon">🏫</span>
                  <span className="action-text">נהל כיתות</span>
                </button>
              </div>
            </div>

            <div className="recent-activities">
              <h3>פעילות אחרונה</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-time">לפני 20 דקות</span>
                  <span className="activity-text">נוסף תלמיד חדש לכיתה ג'</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">לפני שעה</span>
                  <span className="activity-text">נוסף אירוע טיול לכיתה ה'</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">לפני 3 שעות</span>
                  <span className="activity-text">עודכנה מחנכת כיתה ב'</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "students":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול תלמידים</h2>
              <button className="btn btn-primary" onClick={() => openModal("addStudent")}>
                הוסף תלמיד חדש
              </button>
            </div>

            <div className="students-filters">
              <div className="filter-group">
                <label>סינון לפי כיתה:</label>
                <select>
                  <option value="">כל הכיתות</option>
                  <option value="א">כיתה א'</option>
                  <option value="ב">כיתה ב'</option>
                  <option value="ג">כיתה ג'</option>
                  <option value="ד">כיתה ד'</option>
                  <option value="ה">כיתה ה'</option>
                  <option value="ו">כיתה ו'</option>
                </select>
              </div>
              <div className="filter-group">
                <label>חיפוש:</label>
                <input type="text" placeholder="חפש תלמיד..." />
              </div>
            </div>

            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>שם התלמיד</th>
                    <th>כיתה</th>
                    <th>תעודת זהות</th>
                    <th>הורים</th>
                    <th>טלפון</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>יוסי כהן</td>
                    <td>כיתה ה'</td>
                    <td>123456789</td>
                    <td>דוד ושרה כהן</td>
                    <td>050-1234567</td>
                    <td>
                      <button className="btn-small btn-outline">עריכה</button>
                      <button className="btn-small btn-secondary">העבר כיתה</button>
                      <button className="btn-small btn-danger">מחק</button>
                    </td>
                  </tr>
                  <tr>
                    <td>מיכל לוי</td>
                    <td>כיתה ו'</td>
                    <td>987654321</td>
                    <td>אבי ורחל לוי</td>
                    <td>052-9876543</td>
                    <td>
                      <button className="btn-small btn-outline">עריכה</button>
                      <button className="btn-small btn-secondary">העבר כיתה</button>
                      <button className="btn-small btn-danger">מחק</button>
                    </td>
                  </tr>
                  <tr>
                    <td>דני אברהם</td>
                    <td>כיתה ד'</td>
                    <td>456789123</td>
                    <td>משה ויעל אברהם</td>
                    <td>054-4567891</td>
                    <td>
                      <button className="btn-small btn-outline">עריכה</button>
                      <button className="btn-small btn-secondary">העבר כיתה</button>
                      <button className="btn-small btn-danger">מחק</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )

      case "events":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול אירועים</h2>
              <button className="btn btn-primary" onClick={() => openModal("addEvent")}>
                הוסף אירוע חדש
              </button>
            </div>

            <div className="events-grid">
              <div className="event-card upcoming">
                <div className="event-header">
                  <h4>טיול לגן החיות</h4>
                  <span className="event-date">20/03/2024</span>
                </div>
                <div className="event-details">
                  <p>
                    <strong>כיתות:</strong> ה', ו'
                  </p>
                  <p>
                    <strong>שעה:</strong> 08:00 - 16:00
                  </p>
                  <p>
                    <strong>מקום:</strong> גן החיות התנכי
                  </p>
                  <p>
                    <strong>מלווים:</strong> רחל כהן, שרה לוי
                  </p>
                </div>
                <div className="event-actions">
                  <button className="btn-small btn-outline">עריכה</button>
                  <button className="btn-small btn-secondary">פרטים</button>
                  <button className="btn-small btn-danger">ביטול</button>
                </div>
              </div>

              <div className="event-card today">
                <div className="event-header">
                  <h4>מבחן מתמטיקה</h4>
                  <span className="event-date">היום</span>
                </div>
                <div className="event-details">
                  <p>
                    <strong>כיתות:</strong> ה'
                  </p>
                  <p>
                    <strong>שעה:</strong> 09:00 - 10:30
                  </p>
                  <p>
                    <strong>מקום:</strong> כיתה 15
                  </p>
                  <p>
                    <strong>מורה:</strong> רחל כהן
                  </p>
                </div>
                <div className="event-actions">
                  <button className="btn-small btn-outline">עריכה</button>
                  <button className="btn-small btn-secondary">פרטים</button>
                </div>
              </div>

              <div className="event-card past">
                <div className="event-header">
                  <h4>יום ספורט</h4>
                  <span className="event-date">10/03/2024</span>
                </div>
                <div className="event-details">
                  <p>
                    <strong>כיתות:</strong> כל בית הספר
                  </p>
                  <p>
                    <strong>שעה:</strong> 08:30 - 14:00
                  </p>
                  <p>
                    <strong>מקום:</strong> מגרש בית הספר
                  </p>
                  <p>
                    <strong>סטטוס:</strong> הסתיים בהצלחה
                  </p>
                </div>
                <div className="event-actions">
                  <button className="btn-small btn-outline">צפה</button>
                </div>
              </div>
            </div>
          </div>
        )

      case "classes":
        return (
          <div className="dashboard-content">
            <h2>ניהול כיתות</h2>

            <div className="classes-management">
              <div className="class-management-card">
                <div className="class-header">
                  <h3>כיתה א'</h3>
                  <span className="student-count">28 תלמידים</span>
                </div>
                <div className="class-info">
                  <p>
                    <strong>מחנכת:</strong> מרים דוד
                  </p>
                  <p>
                    <strong>כיתת לימוד:</strong> כיתה 5
                  </p>
                </div>
                <div className="class-management-actions">
                  <button className="btn-small btn-primary" onClick={() => openModal("changeTeacher")}>
                    שנה מחנכת
                  </button>
                  <button className="btn-small btn-secondary" onClick={() => openModal("addStudentToClass")}>
                    הוסף תלמיד
                  </button>
                  <button className="btn-small btn-outline" onClick={() => openModal("removeStudentFromClass")}>
                    הסר תלמיד
                  </button>
                  <button className="btn-small btn-danger">מחק כיתה</button>
                </div>
              </div>

              <div className="class-management-card">
                <div className="class-header">
                  <h3>כיתה ב'</h3>
                  <span className="student-count">26 תלמידים</span>
                </div>
                <div className="class-info">
                  <p>
                    <strong>מחנכת:</strong> יעל אברהם
                  </p>
                  <p>
                    <strong>כיתת לימוד:</strong> כיתה 8
                  </p>
                </div>
                <div className="class-management-actions">
                  <button className="btn-small btn-primary" onClick={() => openModal("changeTeacher")}>
                    שנה מחנכת
                  </button>
                  <button className="btn-small btn-secondary" onClick={() => openModal("addStudentToClass")}>
                    הוסף תלמיד
                  </button>
                  <button className="btn-small btn-outline" onClick={() => openModal("removeStudentFromClass")}>
                    הסר תלמיד
                  </button>
                  <button className="btn-small btn-danger">מחק כיתה</button>
                </div>
              </div>

              <div className="class-management-card">
                <div className="class-header">
                  <h3>כיתה ג'</h3>
                  <span className="student-count">30 תלמידים</span>
                </div>
                <div className="class-info">
                  <p>
                    <strong>מחנכת:</strong> דנה גולד
                  </p>
                  <p>
                    <strong>כיתת לימוד:</strong> כיתה 12
                  </p>
                </div>
                <div className="class-management-actions">
                  <button className="btn-small btn-primary" onClick={() => openModal("changeTeacher")}>
                    שנה מחנכת
                  </button>
                  <button className="btn-small btn-secondary" onClick={() => openModal("addStudentToClass")}>
                    הוסף תלמיד
                  </button>
                  <button className="btn-small btn-outline" onClick={() => openModal("removeStudentFromClass")}>
                    הסר תלמיד
                  </button>
                  <button className="btn-small btn-danger">מחק כיתה</button>
                </div>
              </div>
            </div>
          </div>
        )

      case "substitutes":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ממלאי מקום</h2>
              <button className="btn btn-primary" onClick={() => openModal("addSubstitute")}>
                הוסף ממלא מקום
              </button>
            </div>

            <div className="substitutes-grid">
              <div className="substitute-card available">
                <div className="substitute-header">
                  <h4>דנה גולד</h4>
                  <span className="availability-badge available">זמינה</span>
                </div>
                <div className="substitute-details">
                  <p>
                    <strong>מקצועות:</strong> מתמטיקה, מדעים
                  </p>
                  <p>
                    <strong>כיתות:</strong> ד'-ו'
                  </p>
                  <p>
                    <strong>טלפון:</strong> 050-1111111
                  </p>
                  <p>
                    <strong>אימייל:</strong> dana@email.com
                  </p>
                </div>
                <div className="substitute-actions">
                  <button className="btn-small btn-primary">הזמן</button>
                  <button className="btn-small btn-outline">עריכה</button>
                  <button className="btn-small btn-danger">מחק</button>
                </div>
              </div>

              <div className="substitute-card busy">
                <div className="substitute-header">
                  <h4>אורי שמש</h4>
                  <span className="availability-badge busy">עסוק</span>
                </div>
                <div className="substitute-details">
                  <p>
                    <strong>מקצועות:</strong> עברית, היסטוריה
                  </p>
                  <p>
                    <strong>כיתות:</strong> א'-ה'
                  </p>
                  <p>
                    <strong>טלפון:</strong> 052-2222222
                  </p>
                  <p>
                    <strong>עסוק עד:</strong> 20/03/2024
                  </p>
                </div>
                <div className="substitute-actions">
                  <button className="btn-small btn-outline">עריכה</button>
                  <button className="btn-small btn-danger">מחק</button>
                </div>
              </div>

              <div className="substitute-card available">
                <div className="substitute-header">
                  <h4>מיכל רוזן</h4>
                  <span className="availability-badge available">זמינה</span>
                </div>
                <div className="substitute-details">
                  <p>
                    <strong>מקצועות:</strong> אנגלית, אמנות
                  </p>
                  <p>
                    <strong>כיתות:</strong> א'-ו'
                  </p>
                  <p>
                    <strong>טלפון:</strong> 054-3333333
                  </p>
                  <p>
                    <strong>אימייל:</strong> michal@email.com
                  </p>
                </div>
                <div className="substitute-actions">
                  <button className="btn-small btn-primary">הזמן</button>
                  <button className="btn-small btn-outline">עריכה</button>
                  <button className="btn-small btn-danger">מחק</button>
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
          <p>פאנל מזכירה</p>
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
          <h1>ברוכה הבאה, לאה דוד</h1>
          <div className="header-actions">
            <button className="btn btn-outline">הודעות</button>
            <button className="btn btn-primary">צ'אט</button>
          </div>
        </div>

        {renderContent()}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === "addStudent" && "הוספת תלמיד חדש"}
                {modalType === "addEvent" && "הוספת אירוע חדש"}
                {modalType === "addSubstitute" && "הוספת ממלא מקום"}
                {modalType === "changeTeacher" && "שינוי מחנכת"}
                {modalType === "addStudentToClass" && "הוספת תלמיד לכיתה"}
                {modalType === "removeStudentFromClass" && "הסרת תלמיד מכיתה"}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {modalType === "addStudent" && (
                <div className="student-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>שם פרטי</label>
                      <input type="text" placeholder="הכנס שם פרטי" />
                    </div>
                    <div className="form-group">
                      <label>שם משפחה</label>
                      <input type="text" placeholder="הכנס שם משפחה" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>תעודת זהות</label>
                      <input type="text" placeholder="הכנס תעודת זהות" />
                    </div>
                    <div className="form-group">
                      <label>כיתה</label>
                      <select>
                        <option>בחר כיתה</option>
                        <option>כיתה א'</option>
                        <option>כיתה ב'</option>
                        <option>כיתה ג'</option>
                        <option>כיתה ד'</option>
                        <option>כיתה ה'</option>
                        <option>כיתה ו'</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>שם האב</label>
                      <input type="text" placeholder="הכנס שם האב" />
                    </div>
                    <div className="form-group">
                      <label>שם האם</label>
                      <input type="text" placeholder="הכנס שם האם" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>טלפון</label>
                      <input type="tel" placeholder="הכנס מספר טלפון" />
                    </div>
                    <div className="form-group">
                      <label>אימייל</label>
                      <input type="email" placeholder="הכנס כתובת אימייל" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>כתובת</label>
                    <input type="text" placeholder="הכנס כתובת מגורים" />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary">הוסף תלמיד</button>
                    <button className="btn btn-outline" onClick={closeModal}>
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {modalType === "addEvent" && (
                <div className="event-form">
                  <div className="form-group">
                    <label>שם האירוע</label>
                    <input type="text" placeholder="הכנס שם האירוע" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>תאריך</label>
                      <input type="date" />
                    </div>
                    <div className="form-group">
                      <label>שעה</label>
                      <input type="time" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>כיתות משתתפות</label>
                    <select multiple>
                      <option>כיתה א'</option>
                      <option>כיתה ב'</option>
                      <option>כיתה ג'</option>
                      <option>כיתה ד'</option>
                      <option>כיתה ה'</option>
                      <option>כיתה ו'</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>מקום</label>
                    <input type="text" placeholder="הכנס מקום האירוע" />
                  </div>
                  <div className="form-group">
                    <label>תיאור</label>
                    <textarea placeholder="תיאור האירוע" rows="3"></textarea>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary">הוסף אירוע</button>
                    <button className="btn btn-outline" onClick={closeModal}>
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {modalType === "addSubstitute" && (
                <div className="substitute-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>שם פרטי</label>
                      <input type="text" placeholder="הכנס שם פרטי" />
                    </div>
                    <div className="form-group">
                      <label>שם משפחה</label>
                      <input type="text" placeholder="הכנס שם משפחה" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>טלפון</label>
                      <input type="tel" placeholder="הכנס מספר טלפון" />
                    </div>
                    <div className="form-group">
                      <label>אימייל</label>
                      <input type="email" placeholder="הכנס כתובת אימייל" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>מקצועות</label>
                    <input type="text" placeholder="הכנס מקצועות (מופרדים בפסיק)" />
                  </div>
                  <div className="form-group">
                    <label>כיתות</label>
                    <input type="text" placeholder="הכנס כיתות (לדוגמה: א'-ו')" />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary">הוסף ממלא מקום</button>
                    <button className="btn btn-outline" onClick={closeModal}>
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {(modalType === "changeTeacher" ||
                modalType === "addStudentToClass" ||
                modalType === "removeStudentFromClass") && <p>טופס זה יפותח בקרוב...</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecretaryDashboard
