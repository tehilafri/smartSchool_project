import { useState } from "react"
import "./Dashboard.css"

const AdminDashboard = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState("overview")
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("")

  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "teachers", label: "ניהול מורות", icon: "👩‍🏫" },
    { id: "secretaries", label: "ניהול מזכירות", icon: "👩‍💼" },
    { id: "classes", label: "ניהול כיתות", icon: "🏫" },
    { id: "schedule", label: "מערכת שעות", icon: "📅" },
    { id: "events", label: "אירועים", icon: "🎉" },
    { id: "substitutes", label: "ממלאי מקום", icon: "🔄" },
    { id: "absences", label: "בקשות היעדרות", icon: "📝" },
    { id: "settings", label: "הגדרות בית ספר", icon: "⚙️" },
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
                <div className="stat-icon">👩‍🏫</div>
                <div className="stat-info">
                  <h3>25</h3>
                  <p>מורות</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👩‍💼</div>
                <div className="stat-info">
                  <h3>3</h3>
                  <p>מזכירות</p>
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
                <div className="stat-icon">👨‍🎓</div>
                <div className="stat-info">
                  <h3>320</h3>
                  <p>תלמידים</p>
                </div>
              </div>
            </div>

            <div className="recent-activities">
              <h3>פעילות אחרונה</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-time">לפני 10 דקות</span>
                  <span className="activity-text">מורה חדשה נוספה למערכת</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">לפני שעה</span>
                  <span className="activity-text">בקשת היעדרות חדשה התקבלה</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">לפני 2 שעות</span>
                  <span className="activity-text">מערכת שעות עודכנה</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "teachers":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול מורות</h2>
              <button className="btn btn-primary" onClick={() => openModal("addTeacher")}>
                הוסף מורה חדשה
              </button>
            </div>

            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>מקצוע</th>
                    <th>כיתות</th>
                    <th>טלפון</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>רחל כהן</td>
                    <td>מתמטיקה</td>
                    <td>ה', ו'</td>
                    <td>050-1234567</td>
                    <td>
                      <button className="btn-small btn-outline">עריכה</button>
                      <button className="btn-small btn-danger">מחיקה</button>
                    </td>
                  </tr>
                  <tr>
                    <td>שרה לוי</td>
                    <td>עברית</td>
                    <td>ג', ד'</td>
                    <td>052-9876543</td>
                    <td>
                      <button className="btn-small btn-outline">עריכה</button>
                      <button className="btn-small btn-danger">מחיקה</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )

      case "classes":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול כיתות</h2>
              <button className="btn btn-primary" onClick={() => openModal("addClass")}>
                הוסף כיתה חדשה
              </button>
            </div>

            <div className="classes-grid">
              <div className="class-card">
                <h3>כיתה א'</h3>
                <p>
                  <strong>מחנכת:</strong> מרים דוד
                </p>
                <p>
                  <strong>מספר תלמידים:</strong> 28
                </p>
                <div className="class-actions">
                  <button className="btn-small btn-outline">עריכה</button>
                  <button className="btn-small btn-secondary">הוסף תלמיד</button>
                  <button className="btn-small btn-danger">מחיקה</button>
                </div>
              </div>

              <div className="class-card">
                <h3>כיתה ב'</h3>
                <p>
                  <strong>מחנכת:</strong> יעל אברהם
                </p>
                <p>
                  <strong>מספר תלמידים:</strong> 26
                </p>
                <div className="class-actions">
                  <button className="btn-small btn-outline">עריכה</button>
                  <button className="btn-small btn-secondary">הוסף תלמיד</button>
                  <button className="btn-small btn-danger">מחיקה</button>
                </div>
              </div>
            </div>
          </div>
        )

      case "absences":
        return (
          <div className="dashboard-content">
            <h2>בקשות היעדרות</h2>

            <div className="absence-requests">
              <div className="absence-card pending">
                <div className="absence-header">
                  <h4>רחל כהן - מתמטיקה</h4>
                  <span className="status-badge pending">ממתין לאישור</span>
                </div>
                <div className="absence-details">
                  <p>
                    <strong>תאריך:</strong> 15/03/2024
                  </p>
                  <p>
                    <strong>שעות:</strong> 08:30 - 12:00
                  </p>
                  <p>
                    <strong>סיבה:</strong> ביקור רופא
                  </p>
                  <p>
                    <strong>כיתות מושפעות:</strong> ה', ו'
                  </p>
                </div>
                <div className="absence-actions">
                  <button className="btn-small btn-primary">אשר</button>
                  <button className="btn-small btn-danger">דחה</button>
                </div>
              </div>

              <div className="absence-card approved">
                <div className="absence-header">
                  <h4>שרה לוי - עברית</h4>
                  <span className="status-badge approved">אושר</span>
                </div>
                <div className="absence-details">
                  <p>
                    <strong>תאריך:</strong> 12/03/2024
                  </p>
                  <p>
                    <strong>שעות:</strong> 10:00 - 14:00
                  </p>
                  <p>
                    <strong>סיבה:</strong> אירוע משפחתי
                  </p>
                  <p>
                    <strong>ממלא מקום:</strong> דנה גולד
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="dashboard-content">
            <h2>הגדרות בית ספר</h2>

            <div className="settings-form">
              <div className="form-group">
                <label>שם בית הספר</label>
                <input type="text" defaultValue="בית ספר יסודי הרצל" />
              </div>

              <div className="form-group">
                <label>כתובת</label>
                <input type="text" defaultValue="רחוב הרצל 15, תל אביב" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>טלפון</label>
                  <input type="tel" defaultValue="03-1234567" />
                </div>

                <div className="form-group">
                  <label>אימייל</label>
                  <input type="email" defaultValue="info@herzl-school.co.il" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>שעת התחלה</label>
                  <input type="time" defaultValue="08:30" />
                </div>

                <div className="form-group">
                  <label>שעת סיום</label>
                  <input type="time" defaultValue="16:00" />
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn btn-primary">שמור שינויים</button>
                <button className="btn btn-danger" onClick={() => openModal("deleteSchool")}>
                  מחק בית ספר
                </button>
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
          <p>פאנל מנהלת</p>
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
          <h1>ברוכה הבאה, מנהלת</h1>
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
                {modalType === "addTeacher" && "הוספת מורה חדשה"}
                {modalType === "addClass" && "הוספת כיתה חדשה"}
                {modalType === "deleteSchool" && "מחיקת בית ספר"}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {modalType === "deleteSchool" ? (
                <div className="danger-zone">
                  <p>האם אתה בטוח שברצונך למחוק את בית הספר?</p>
                  <p className="warning-text">פעולה זו תמחק את כל הנתונים ולא ניתן לבטלה!</p>
                  <div className="modal-actions">
                    <button className="btn btn-danger">כן, מחק</button>
                    <button className="btn btn-outline" onClick={closeModal}>
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <p>טופס זה יפותח בקרוב...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
