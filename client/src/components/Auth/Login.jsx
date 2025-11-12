import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { loginUser, clearError } from "../../store/slices/authSlice"
import "./Auth.css"
import PasswordInput from './PasswordInput';  
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  // פונקציה אחרי התחברות מוצלחת
  const onLogin = (role) => {
    const schoolCode = localStorage.getItem("schoolCode");
    console.log("-schoolCode:", schoolCode);
    //אם המנהלת עדיין לא רשמה את בית הספר שלה
    if (role === "admin" && schoolCode.startsWith('TEMP_')) {
      navigate("/register_school"); // נווט לדף הרשמת בית ספר
      return;
    }
    // ניווט לפי תפקיד
    if (role === "admin") {
      navigate("/dashboard/admin");
    } else if (role === "teacher") {
      navigate("/dashboard/teacher");
    } else if (role === "student") {
      navigate("/dashboard/student");
    } else if (role === "secretary") {
      navigate("/dashboard/secretary");
    } else {
      navigate("/");
    }
  };

  // מעבר לבקשת הרשמה
  const onSwitchToRegister = () => {
    navigate("/admin-registration");
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

   const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      const result = await dispatch(loginUser({
        userName: formData.userName,
        password: formData.password,
        schoolCode: formData.schoolCode
      })).unwrap();
      
      // קריאה לפונקציית ההצלחה
      onLogin(result.user.role);
    } catch (err) {
      // השגיאה מוצגת דרך Redux state
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
            <PasswordInput
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

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>

          <div className="auth-links">
            <button type="button" className="link-button" onClick={onForgotPassword}>
              שכחתי סיסמה
            </button>
            <button type="button" className="link-button" onClick={onSwitchToRegister}>
              אין לך חשבון? בקש הרשמת בית ספר כאן
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
