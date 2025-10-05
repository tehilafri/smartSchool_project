import { useState } from "react";
import { registerUser } from "../../services/userService"; // הפונקציה שלך שמדברת עם השרת
import "./RegisterUser.css"; 

const RegisterUser = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    userId: "",
    email: "",
    phone: "",
    birthDate: "",
    password: "",
    role: "",
    classes: "",
    subjects: "",
    ishomeroom: false,
  });

  const [message, setMessage] = useState("");

  // שינוי ערכים בטופס
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // שליחה לשרת
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // המרה של classes ו-subjects לרשימות
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
        role: "",
        classes: "",
        subjects: "",
        ishomeroom: false,
      });
    } catch (err) {
      console.error(err);
      setMessage("❌ שגיאה: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="register-container">
      <h2>הוספת משתמש חדש</h2>
      {message && <p className="register-message">{message}</p>}
      <form className="register-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstName"
          placeholder="שם פרטי"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="שם משפחה"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
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
        <input
          type="text"
          name="userId"
          placeholder="תעודת זהות"
          value={formData.userId}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="אימייל"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="טלפון"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="סיסמה"
          value={formData.password}
          onChange={handleChange}
          required
        />
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
        <input
          type="text"
          name="classes"
          placeholder="כיתות (מופרדות בפסיקים)"
          value={formData.classes}
          onChange={handleChange}
        />
        <input
          type="text"
          name="subjects"
          placeholder="מקצועות (מופרדים בפסיקים)"
          value={formData.subjects}
          onChange={handleChange}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="ishomeroom"
            checked={formData.ishomeroom}
            onChange={handleChange}
          />
          מחנכת כיתה
        </label>
        <button type="submit" className="register-button">
          צור משתמש
        </button>
      </form>
    </div>
  );
};

export default RegisterUser;
