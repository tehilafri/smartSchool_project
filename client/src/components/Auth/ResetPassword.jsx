// client/src/components/auth/ResetPassword.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword as resetPasswordAPI} from "../../services/userService";
import "./Auth.css";

const ResetPassword = () => {
  const { token } = useParams(); // הטוקן מה-URL
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("הסיסמאות לא תואמות");
      return;
    }

    try {
      await resetPasswordAPI(token, password);
      setSuccess(true);

      setTimeout(() => {
        navigate("/login"); // אחרי הצלחה חוזרים למסך כניסה
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בשרת, נסה שוב");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {success ? (
          <div>
            <h2>סיסמה עודכנה בהצלחה</h2>
            <p>חזור למסך ההתחברות</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>איפוס סיסמה</h2>
            <div className="form-group">
              <label htmlFor="password">סיסמה חדשה</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">אימות סיסמה</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="btn btn-primary">עדכן סיסמה</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
