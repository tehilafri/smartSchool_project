import { useState } from "react"
import { createSchool } from "../../services/schoolService"
import "./Auth.css"

const Register = ({ token, onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    schoolName: "",
    principalId: "", // ת"ז המנהלת
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    phone: "",
    website: "",
    description: "",
  })

  const [scheduleHours, setScheduleHours] = useState([
    { start: "", end: "" }
  ])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLessonChange = (index, field, value) => {
    const updated = [...scheduleHours]
    updated[index][field] = value
    setScheduleHours(updated)
  }

  const handleAddLesson = () => {
    setScheduleHours([...scheduleHours, { start: "", end: "" }])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("הסיסמאות אינן תואמות")
      return
    }

    try {
      const payload = {
        name: formData.schoolName,
        principalId: formData.principalId,
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        website: formData.website,
        description: formData.description,
        scheduleHours: scheduleHours,
      }

      const result = await createSchool(payload, token)
      console.log("✅ School created:", result)
      onRegister("principal") // את יכולה לשנות לפי ההיגיון שלך
    } catch (err) {
      console.error("❌ Error creating school:", err)
      alert("קרתה שגיאה ביצירת בית הספר")
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>הרשמה למערכת</h2>
          <p>צור חשבון חדש עבור בית הספר שלך</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>שם בית הספר</label>
            <input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>ת"ז מנהלת</label>
            <input type="text" name="principalId" value={formData.principalId} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>כתובת אימייל</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>סיסמה</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>אימות סיסמה</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>כתובת</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>טלפון</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>אתר</label>
            <input type="text" name="website" value={formData.website} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>תיאור</label>
            <textarea name="description" value={formData.description} onChange={handleChange} />
          </div>

          <h3>מערכת שעות</h3>
          {scheduleHours.map((lesson, index) => (
            <div key={index} className="form-row">
              <div className="form-group">
                <label>שיעור {index + 1} - התחלה</label>
                <input
                  type="time"
                  value={lesson.start}
                  onChange={(e) => handleLessonChange(index, "start", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>שיעור {index + 1} - סיום</label>
                <input
                  type="time"
                  value={lesson.end}
                  onChange={(e) => handleLessonChange(index, "end", e.target.value)}
                  required
                />
              </div>
            </div>
          ))}

          <button type="button" onClick={handleAddLesson}>
            ➕ הוסף שיעור
          </button>

          <button type="submit" className="btn btn-primary auth-submit">
            הירשם
          </button>

          <div className="auth-links">
            <button type="button" className="link-button" onClick={onSwitchToLogin}>
              יש לך כבר חשבון? התחבר כאן
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
