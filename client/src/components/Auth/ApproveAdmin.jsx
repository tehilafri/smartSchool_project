import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Auth.css";

const ApproveAdmin = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const approveRequest = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin-requests/approve/${token}`);
        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
        } else {
          setError(data.message || "שגיאה באישור הבקשה");
        }
      } catch (err) {
        setError("שגיאה בחיבור לשרת");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      approveRequest();
    } else {
      setError("טוקן לא תקין");
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-message">
            <h2>מעבד בקשה...</h2>
            <p>אנא המתן</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-message">
            <h2>✅ הבקשה אושרה בהצלחה!</h2>
            <p>נשלח מייל למנהל/ת עם פרטי ההתחברות למערכת.</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate("/")}
            >
              חזור לדף הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="error-message">
          <h2>❌ שגיאה באישור הבקשה</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate("/")}
          >
            חזור לדף הבית
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveAdmin;