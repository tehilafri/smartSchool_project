"use client"

import { useState } from "react"
import "./Dashboard.css"

const TeacherDashboard = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState("overview")
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("")

  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "schedule", label: "המערכת שלי", icon: "📅" },
    { id: "nextClass", label: "השיעור הבא", icon: "⏰" },
    { id: "updateSchedule", label: "עדכון מערכת יומית", icon: "✏️" },
    { id: "materials", label: "חומרי לימוד", icon: "📚" },
    { id: "absences", label: "דיווח היעדרות", icon: "📝" },
    { id: "myAbsences", label: "ההיעדרויות שלי", icon: "📋" },
    { id: "exams", label: "מבחנים", icon: "📄" },
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
                <div className="stat-icon">🏫</div>
                <div className="stat-info">
                  <h3>5</h3>
                  <p>כיתות שלי</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>24</h3>
                  <p>שיעורים השבוע</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <h3>3</h3>
                  <p>מבחנים השבוע</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <h3>2</h3>
                  <p>בקשות היעדרות</p>
                </div>
              </div>
            </div>

            <div className="teacher-quick-actions">
              <h3>פעולות מהירות</h3>
              <div className="quick-actions-grid">
                <button className="quick-action-card" onClick={() => openModal("reportAbsence")}>
                  <span className="action-icon">📝</span>
                  <span className="action-text">דווח היעדרות</span>
                </button>
                <button className="quick-action-card" onClick={() => openModal("uploadMaterial")}>
                  <span className="action-icon">📚</span>
                  <span className="action-text">העלה חומר לימוד</span>
                </button>
                <button className="quick-action-card" onClick={() => openModal("scheduleExam")}>
                  <span className="action-icon">📄</span>
                  <span className="action-text">קבע מבחן</span>
                </button>
                <button className="quick-action-card" onClick={() => setActiveSection("updateSchedule")}>
                  <span className="action-icon">✏️</span>
                  <span className="action-text">עדכן מערכת</span>
                </button>
              </div>
            </div>

            <div className="recent-activities">
              <h3>פעילות אחרונה</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-time">לפני 30 דקות</span>
                  <span className="activity-text">העלית חומר לימוד לכיתה ה'</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">לפני שעתיים</span>
                  <span className="activity-text">עדכנת מערכת יומית</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">אתמול</span>
                  <span className="activity-text">דיווחת על היעדרות</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "schedule":
        return (
          <div className="dashboard-content">
            <h2>המערכת שלי</h2>

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
                      <td className="class-slot">מתמטיקה - כיתה ה'</td>
                      <td className="class-slot">מתמטיקה - כיתה ו'</td>
                      <td className="class-slot">מתמטיקה - כיתה ה'</td>
                      <td className="class-slot">מתמטיקה - כיתה ו'</td>
                      <td className="class-slot">מתמטיקה - כיתה ה'</td>
                    </tr>
                    <tr>
                      <td className="time-slot">09:15-10:00</td>
                      <td className="class-slot">מתמטיקה - כיתה ו'</td>
                      <td className="class-slot empty">הפסקה</td>
                      <td className="class-slot">מתמטיקה - כיתה ו'</td>
                      <td className="class-slot">מתמטיקה - כיתה ה'</td>
                      <td className="class-slot">מתמטיקה - כיתה ו'</td>
                    </tr>
                    <tr>
                      <td className="time-slot">10:00-10:45</td>
                      <td className="class-slot empty">הפסקה</td>
                      <td className="class-slot">מתמטיקה - כיתה ה'</td>
                      <td className="class-slot empty">הפסקה</td>
                      <td className="class-slot empty">הפסקה</td>
                      <td className="class-slot empty">הפסקה</td>
                    </tr>
                    <tr>
                      <td className="time-slot">10:45-11:30</td>
                      <td className="class-slot">מתמטיקה - כיתה ד'</td>
                      <td className="class-slot">מתמטיקה - כיתה ד'</td>
                      <td className="class-slot">מתמטיקה - כיתה ד'</td>
                      <td className="class-slot">מתמטיקה - כיתה ד'</td>
                      <td className="class-slot">מתמטיקה - כיתה ד'</td>
                    </tr>
                  </tbody>
                </table>
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
                  <span className="detail-label">כיתה:</span>
                  <span className="detail-value">כיתה ה'</span>
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
                <button className="btn btn-primary">התחל שיעור</button>
                <button className="btn btn-outline">צפה בחומרים</button>
              </div>
            </div>

            <div className="upcoming-classes">
              <h3>השיעורים הבאים היום</h3>
              <div className="upcoming-list">
                <div className="upcoming-item">
                  <span className="upcoming-time">10:45 - 11:30</span>
                  <span className="upcoming-subject">מתמטיקה - כיתה ד'</span>
                  <span className="upcoming-room">כיתה 12</span>
                </div>
                <div className="upcoming-item">
                  <span className="upcoming-time">11:30 - 12:15</span>
                  <span className="upcoming-subject">מתמטיקה - כיתה ו'</span>
                  <span className="upcoming-room">כיתה 15</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "materials":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>חומרי לימוד</h2>
              <button className="btn btn-primary" onClick={() => openModal("uploadMaterial")}>
                העלה חומר חדש
              </button>
            </div>

            <div className="materials-grid">
              <div className="material-card">
                <div className="material-icon">📄</div>
                <div className="material-info">
                  <h4>תרגילי חילוק - כיתה ה'</h4>
                  <p>הועלה לפני 2 ימים</p>
                  <span className="material-type">PDF</span>
                </div>
                <div className="material-actions">
                  <button className="btn-small btn-outline">צפה</button>
                  <button className="btn-small btn-danger">מחק</button>
                </div>
              </div>

              <div className="material-card">
                <div className="material-icon">📄</div>
                <div className="material-info">
                  <h4>דף עבודה - שברים</h4>
                  <p>הועלה לפני שבוע</p>
                  <span className="material-type">PDF</span>
                </div>
                <div className="material-actions">
                  <button className="btn-small btn-outline">צפה</button>
                  <button className="btn-small btn-danger">מחק</button>
                </div>
              </div>

              <div className="material-card">
                <div className="material-icon">📄</div>
                <div className="material-info">
                  <h4>מבחן לדוגמה - גיאומטריה</h4>
                  <p>הועלה לפני 3 ימים</p>
                  <span className="material-type">PDF</span>
                </div>
                <div className="material-actions">
                  <button className="btn-small btn-outline">צפה</button>
                  <button className="btn-small btn-danger">מחק</button>
                </div>
              </div>
            </div>
          </div>
        )

      case "myAbsences":
        return (
          <div className="dashboard-content">
            <h2>ההיעדרויות שלי</h2>

            <div className="absence-requests">
              <div className="absence-card pending">
                <div className="absence-header">
                  <h4>בקשת היעדרות - 15/03/2024</h4>
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
                  <p>
                    <strong>ממלא מקום:</strong> טרם נמצא
                  </p>
                </div>
              </div>

              <div className="absence-card approved">
                <div className="absence-header">
                  <h4>בקשת היעדרות - 10/03/2024</h4>
                  <span className="status-badge approved">אושר</span>
                </div>
                <div className="absence-details">
                  <p>
                    <strong>תאריך:</strong> 10/03/2024
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

      case "updateSchedule":
        return (
          <div className="dashboard-content">
            <h2>עדכון מערכת יומית</h2>

            <div className="update-schedule-form">
              <div className="form-row">
                <div className="form-group">
                  <label>תאריך</label>
                  <input type="date" defaultValue="2024-03-15" />
                </div>
                <div className="form-group">
                  <label>כיתה</label>
                  <select>
                    <option>כיתה ה'</option>
                    <option>כיתה ו'</option>
                    <option>כיתה ד'</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>שעה</label>
                  <select>
                    <option>08:30 - 09:15</option>
                    <option>09:15 - 10:00</option>
                    <option>10:45 - 11:30</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>מקצוע</label>
                  <input type="text" placeholder="הכנס מקצוע" />
                </div>
              </div>

              <div className="form-group">
                <label>נושא השיעור</label>
                <input type="text" placeholder="הכנס נושא השיעור" />
              </div>

              <div className="form-group">
                <label>הערות</label>
                <textarea placeholder="הערות נוספות (אופציונלי)" rows="3"></textarea>
              </div>

              <button className="btn btn-primary">שמור עדכון</button>
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
          <p>פאנל מורה</p>
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
          <h1>ברוכה הבאה, רחל כהן</h1>
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
                {modalType === "reportAbsence" && "דיווח היעדרות"}
                {modalType === "uploadMaterial" && "העלאת חומר לימוד"}
                {modalType === "scheduleExam" && "קביעת מבחן"}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {modalType === "reportAbsence" && (
                <div className="absence-form">
                  <div className="form-group">
                    <label>תאריך היעדרות</label>
                    <input type="date" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>שעת התחלה</label>
                      <input type="time" />
                    </div>
                    <div className="form-group">
                      <label>שעת סיום</label>
                      <input type="time" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>כיתות מושפעות</label>
                    <select multiple>
                      <option>כיתה ה'</option>
                      <option>כיתה ו'</option>
                      <option>כיתה ד'</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>סיבת ההיעדרות</label>
                    <textarea placeholder="הכנס סיבת ההיעדרות" rows="3"></textarea>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary">שלח בקשה</button>
                    <button className="btn btn-outline" onClick={closeModal}>
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {modalType === "uploadMaterial" && (
                <div className="upload-form">
                  <div className="form-group">
                    <label>כותרת החומר</label>
                    <input type="text" placeholder="הכנס כותרת" />
                  </div>
                  <div className="form-group">
                    <label>כיתה</label>
                    <select>
                      <option>כיתה ה'</option>
                      <option>כיתה ו'</option>
                      <option>כיתה ד'</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>קובץ PDF</label>
                    <input type="file" accept=".pdf" />
                  </div>
                  <div className="form-group">
                    <label>תיאור</label>
                    <textarea placeholder="תיאור החומר (אופציונלי)" rows="3"></textarea>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary">העלה</button>
                    <button className="btn btn-outline" onClick={closeModal}>
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {modalType === "scheduleExam" && (
                <div className="exam-form">
                  <div className="form-group">
                    <label>שם המבחן</label>
                    <input type="text" placeholder="הכנס שם המבחן" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>מקצוע</label>
                      <input type="text" defaultValue="מתמטיקה" />
                    </div>
                    <div className="form-group">
                      <label>כיתה</label>
                      <select>
                        <option>כיתה ה'</option>
                        <option>כיתה ו'</option>
                        <option>כיתה ד'</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>תאריך המבחן</label>
                      <input type="date" />
                    </div>
                    <div className="form-group">
                      <label>שעה</label>
                      <input type="time" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>נושאי המבחן</label>
                    <textarea placeholder="הכנס נושאי המבחן" rows="3"></textarea>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary">קבע מבחן</button>
                    <button className="btn btn-outline" onClick={closeModal}>
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard
