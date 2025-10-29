import React, { useState } from 'react';
import './PasswordInput.css'; // נייבא את העיצוב שיצרנו

const PasswordInput = ({ value, onChange, placeholder, ...rest }) => {
  // משתנה state שקובע אם הסיסמה גלויה
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // פונקציה שמחליפה את המצב
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    // קונטיינר עם מיקום יחסי
    <div className="password-input-container">
      <input
        // ה-type משתנה בהתאם למצב (טקסט או סיסמה)
        type={isPasswordVisible ? "text" : "password"}
        className="password-input-field"
        
        // אלו המאפיינים (props) שקיבלנו מבחוץ
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        
        // מעביר את כל השאר (כמו id, name, required)
        {...rest} 
      />
      
      {/* כפתור העיינית */}
      <button
        type="button" // מונע שליחת טופס בלחיצה
        className="password-toggle-icon"
        onClick={togglePasswordVisibility}
      >
        {/* הצגת אייקון שונה בהתאם למצב */}
        {isPasswordVisible ? '🙈' : '👁️'}
      </button>
    </div>
  );
};

export default PasswordInput;