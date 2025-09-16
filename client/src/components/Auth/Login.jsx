import { useState } from "react"
import { loginUser } from "../../services/userService"
import { useNavigate } from "react-router-dom"
import "./Auth.css"

const Login = () => {

  const navigate = useNavigate();
  // פונקציה אחרי התחברות מוצלחת
  const onLogin = (role) => {
    // ניווט לפי תפקיד
    if (role === "admin") {
      console.log("Navigating to admin dashboard");
      navigate("/dashboard/admin");
    } else if (role === "teacher") {
      console.log("Navigating to teacher dashboard");
      navigate("/dashboard/teacher");
    } else if (role === "student") {
      console.log("Navigating to student dashboard");
      navigate("/dashboard/student");
    } else if (role === "secretary") {
      console.log("Navigating to secretary dashboard");
      navigate("/dashboard/secretary");
    } else {
      navigate("/");
    }
  };

  // מעבר לדף הרשמה
  const onSwitchToRegister = () => {
    navigate("/register");
  };

  // מעבר לדף איפוס סיסמה
  const onForgotPassword = () => {
    navigate("/forgot-password");
  };

  const [formData, setFormData] = useState({
    userName: "",
    password: "",
    schoolCode: "",
  })
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }
  console.log("Form Data:", formData) // בדיקת נתוני הטופס
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
      localStorage.setItem("user", JSON.stringify(response.data.user)) //שמירת המידע של המשתמש
      const role = response.data.user.role;
      console.log("Login successful, user role:", role)
      // קריאה לפונקציית ההצלחה
      onLogin(role)
      
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
