import { useState } from "react";
import { forgotPassword as forgotPasswordAPI } from "../../services/userService";
import "./Auth.css";

const ForgotPassword = ({ onBackToLogin, onResetPassword }) => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // נקה שגיאות קודמות

    try {
      await forgotPasswordAPI(email);  // קריאה לשרת
      setIsSubmitted(true);

      setTimeout(() => {
        onResetPassword(); // מעבר למסך איפוס סיסמה
      }, 2000);
    } catch (err) {
      console.error(err);
      // אם יש שגיאה מהשרת, נראה למשתמש
      setError(err.response?.data?.message || "שגיאה בשרת, נסה שוב");
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>בקשה נשלחה</h2>
            <p>נשלח אליך אימייל עם הוראות לאיפוס הסיסמה</p>
          </div>

          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>בדוק את תיבת האימייל שלך ופעל לפי ההוראות</p>
          </div>

          <button type="button" className="btn btn-primary" onClick={onBackToLogin}>
            חזור להתחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>שכחתי סיסמה</h2>
          <p>הכנס את כתובת האימייל שלך לאיפוס הסיסמה</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">כתובת אימייל</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="הכנס כתובת אימייל"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit">
            שלח קישור לאיפוס
          </button>

          <div className="auth-links">
            <button type="button" className="link-button" onClick={onBackToLogin}>
              חזור להתחברות
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
