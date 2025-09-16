import { useState } from "react"
import { loginUser } from "../../services/userService"
import "./Auth.css"
import { useNavigate } from "react-router-dom"

const Login = ({ onLogin, onSwitchToRegister, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    userName: "",
    password: "",
    schoolCode: "",
  })
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const response = await loginUser(
        formData.userName,
        formData.password,
        formData.schoolCode
      )
      // שמירת JWT
      localStorage.setItem("token", response.data.token)

      // קריאה לפונקציית ההצלחה
      onLogin(response.data.user.role)

      // ניווט למסך המתאים לפי תפקיד
      navigate("/dashboard") 
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בשרת, נסה שוב")
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>התחברות למערכת</h2>
          <p>הכנס את פרטיך כדי להתחבר</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="userName">שם משתמש</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              required
              placeholder="הכנס שם משתמש"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="הכנס סיסמה"
            />
          </div>

          <div className="form-group">
            <label htmlFor="schoolCode">קוד בית ספר</label>
            <input
              type="text"
              id="schoolCode"
              name="schoolCode"
              value={formData.schoolCode}
              onChange={handleChange}
              required
              placeholder="הכנס קוד בית ספר"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit">
            התחבר
          </button>

          <div className="auth-links">
            <button type="button" className="link-button" onClick={onForgotPassword}>
              שכחתי סיסמה
            </button>
            <button type="button" className="link-button" onClick={onSwitchToRegister}>
              אין לך חשבון? הירשם כאן
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
