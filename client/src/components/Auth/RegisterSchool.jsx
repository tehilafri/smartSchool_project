import { useState } from "react"
import { createSchool } from "../../services/schoolService"
import "./Auth.css"
import PasswordInput from './PasswordInput';  

const gradeOptions = [
  'א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב','יג','יד'
];

const RegisterSchool = ({ onRegister }) => {
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
    minGrade: "א",
    maxGrade: "ח",
  })
  const [logo, setLogo] = useState(null);
  const [message, setMessage] = useState("");  // הודעה כללית
  const [isError, setIsError] = useState(false); // האם ההודעה היא שגיאה

  const onSwitchToLogin = function() {
    window.location.href = "/login";
  }

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
    try {
      const form = new FormData();
      form.append("name", formData.schoolName);
      form.append("principalId", formData.principalId);
      form.append("email", formData.email);
      form.append("address", formData.address);
      form.append("phone", formData.phone);
      form.append("website", formData.website);
      form.append("description", formData.description);
      form.append("scheduleHours", JSON.stringify(scheduleHours));
      form.append("minGrade", formData.minGrade);
      form.append("maxGrade", formData.maxGrade);
      if (logo) {
        form.append("logo", logo);
      }

      const result = await createSchool(form);
      console.log("✅ School created:", result)

      setMessage("✅ בית הספר נרשם בהצלחה!\nהתחבר באמצעות הפרטים שנשלחים אליך כרגע במייל");
      setIsError(false)

      if (typeof onRegister === "function") {
        onRegister("principal");
      }
    } catch (err) {
      console.error("❌ Error creating school:", err);
      let msg = "קרתה שגיאה ביצירת בית הספר";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setMessage(`❌ ${msg}`)
      setIsError(true)
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

          <div className="form-group">
            <label>טווח כיתות (נמוך - גבוה)</label>
            <select name="minGrade" value={formData.minGrade} onChange={handleChange}>
              {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select name="maxGrade" value={formData.maxGrade} onChange={handleChange}>
              {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>לוגו בית הספר</label>
            <input type="file" accept="image/*" onChange={e => setLogo(e.target.files[0])} />
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

          {message && (
          <p className={isError ? "error-message" : "success-message"}>
            {message}
          </p>
        )}

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

export default RegisterSchool
