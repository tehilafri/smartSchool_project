import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const AdminRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    userId: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://smartschool-project-node.onrender.com/api/admin-requests/submit", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "שגיאה בשליחת הבקשה");
      }
    } catch (err) {
      setError("שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-message">
            <h2>✅ הבקשה נשלחה בהצלחה!</h2>
            <p>פרטיך נשלחו למערכת ונמצאים בבדיקה.</p>
            <p>תיענה בהקדם האפשרי במייל שצירפת.</p>
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
        <div className="auth-header">
          <h2>הרשמה כמנהל חדש</h2>
          <p>מלא את פרטיך כדי ליצור בית ספר חדש</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="firstName">שם פרטי</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="הכנס שם פרטי"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">שם משפחה</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="הכנס שם משפחה"
            />
          </div>

          <div className="form-group">
            <label htmlFor="userId">תעודת זהות</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
              placeholder="הכנס תעודת זהות"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">אימייל</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="הכנס אימייל"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">טלפון</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="הכנס מספר טלפון"
            />
          </div>

          <div className="form-group">
            <label htmlFor="birthDate">תאריך לידה</label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">מין</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">בחר מין</option>
              <option value="female">נקבה</option>
              <option value="male">זכר</option>
            </select>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            type="submit" 
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? "שולח..." : "שלח בקשה"}
          </button>

          <div className="auth-links">
            <button 
              type="button" 
              className="link-button" 
              onClick={() => navigate("/")}
            >
              חזור לדף הבית
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegistration;