import { useState, useEffect } from 'react';
import { updateUser, getMe } from '../../services/userService';
import PasswordInput from '../Auth/PasswordInput';
import './UserProfile.css';

const UserProfile = ({ user, onClose, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        password: ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      await updateUser(user._id, updateData);
      
      // שליפת נתונים מעודכנים
      const updatedUserResponse = await getMe();
      onUserUpdate(updatedUserResponse.data);
      
      setMessage('הפרטים עודכנו בהצלחה');
      setIsEditing(false);
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage('שגיאה בעדכון הפרטים: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'לא צוין';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const getRoleInHebrew = (role) => {
    const roles = {
      'admin': 'מנהל',
      'secretary': 'מזכירה',
      'teacher': 'מורה',
      'student': 'תלמיד'
    };
    return roles[role] || role;
  };

  return (
    <div className="profile-overlay">
      <div className="profile-modal">
        <div className="profile-header">
          <h2>{isEditing ? 'עריכת פרטים אישיים' : 'פרטים אישיים'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="profile-content">
          {message && (
            <div className={`message ${message.includes('שגיאה') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {!isEditing ? (
            <div className="profile-view">
              <div className="profile-field">
                <label>שם פרטי:</label>
                <span>{user?.firstName}</span>
              </div>
              
              <div className="profile-field">
                <label>שם משפחה:</label>
                <span>{user?.lastName}</span>
              </div>
              
              <div className="profile-field">
                <label>תעודת זהות:</label>
                <span>{user?.userId}</span>
              </div>
              
              <div className="profile-field">
                <label>אימייל:</label>
                <span>{user?.email}</span>
              </div>
              
              <div className="profile-field">
                <label>טלפון:</label>
                <span>{user?.phone || 'לא צוין'}</span>
              </div>
              
              <div className="profile-field">
                <label>תאריך לידה:</label>
                <span>{formatDate(user?.birthDate)}</span>
              </div>
              
              <div className="profile-field">
                <label>מין:</label>
                <span>{user?.gender === 'male' ? 'זכר' : 'נקבה'}</span>
              </div>
              
              <div className="profile-field">
                <label>תפקיד:</label>
                <span>{getRoleInHebrew(user?.role)}</span>
              </div>
              
              {user?.classes && user.classes.length > 0 && (
                <div className="profile-field">
                  <label>כיתות:</label>
                  <span>{user.classes.map(cls => cls.name || cls).join(', ')}</span>
                </div>
              )}
              
              {user?.subjects && user.subjects.length > 0 && (
                <div className="profile-field">
                  <label>מקצועות:</label>
                  <span>{user.subjects.join(', ')}</span>
                </div>
              )}

              <div className="profile-actions">
                <button 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  עריכת פרטים
                </button>
              </div>
            </div>
          ) : (
            <form className="profile-edit" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>שם פרטי:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>שם משפחה:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>אימייל:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>טלפון:</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>תאריך לידה:</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>סיסמה חדשה (אופציונלי):</label>
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="השאר ריק אם לא רוצה לשנות"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'שומר...' : 'שמור שינויים'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  ביטול
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;