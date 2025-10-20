import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { registerUser, getMe } from "../../services/userService";
import DashboardHeader from "../Dashboard/DashboardHeader";
import "./RegisterUser.css"; 

const RegisterUser = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleParam = searchParams.get('role') || '';
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    userId: "",
    email: "",
    phone: "",
    birthDate: "",
    password: "",
    role: roleParam
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getMe();
        setMe(userData?.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (roleParam) {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
  }, [roleParam]);

  // שינוי ערכים בטופס
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // נקה שגיאות קודמות
    try {
      const payload = {
        ...formData,
        classes: formData.classes
          ? formData.classes.split(",").map((c) => c.trim())
          : [],
        subjects: formData.subjects
          ? formData.subjects.split(",").map((s) => s.trim())
          : [],
      };

      await registerUser(payload);
      setMessage("✅ המשתמש נוצר בהצלחה!");
      setFormData({
        firstName: "",
        lastName: "",
        gender: "",
        userId: "",
        email: "",
        phone: "",
        birthDate: "",
        password: "",
        role: roleParam,
        classes: "",
        subjects: "",
        ishomeroom: false,
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "שגיאה לא ידועה");
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      teacher: 'מורה',
      student: 'תלמיד',
      secretary: 'מזכירה',
      admin: 'מנהל'
    };
    return roleNames[role] || 'משתמש';
  };

  const getDashboardPath = () => {
    const userRole = me?.role;
    return `/dashboard/${userRole}`;
  };

  if (loading) {
    return <div className="loading-container">טוען...</div>;
  }

  return (
    <div className="register-page">
      {me?.schoolId && <DashboardHeader schoolId={me.schoolId._id} />}
      
      <div className="register-container">
        <div className="register-header">
          <button 
            className="back-button"
            onClick={() => navigate(getDashboardPath())}
          >
            ← חזרה לדשבורד
          </button>
          <h2>הוספת {getRoleDisplayName(formData.role)} חדש</h2>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
            {message.includes('✅') && (
              <button 
                className="btn-link"
                onClick={() => navigate(getDashboardPath())}
              >
                חזרה לדשבורד
              </button>
            )}
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>שם פרטי *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>שם משפחה *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>מין *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">בחר מין</option>
                <option value="male">זכר</option>
                <option value="female">נקבה</option>
              </select>
            </div>
            <div className="form-group">
              <label>תעודת זהות *</label>
              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>אימייל *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>טלפון</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>תאריך לידה</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>סיסמה *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {!roleParam && (
            <div className="form-group">
              <label>תפקיד *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="">בחר תפקיד</option>
                <option value="student">תלמיד</option>
                <option value="teacher">מורה</option>
                <option value="secretary">מזכירה</option>
                <option value="admin">מנהל</option>
              </select>
            </div>
          )}

          {(formData.role === 'student') && (
            <div className="form-group">
              <label>כיתת לימוד</label>
              <input
                type="text"
                name="classes"
                value={formData.classes}
                onChange={handleChange}
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              צור {getRoleDisplayName(formData.role)}
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate(getDashboardPath())}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterUser;
