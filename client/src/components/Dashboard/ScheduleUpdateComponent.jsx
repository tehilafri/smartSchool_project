import { useState, useEffect } from "react";
import { getAllTeachers } from "../../services/userService";
import { updateScheduleDay, createSchedule } from "../../services/scheduleService";
import "./ScheduleUpdate.css";

const ScheduleUpdateComponent = ({ 
  targetTeacherId = null, 
  targetClassName = null, 
  onSuccess, 
  showNotification,
  me 
}) => {
  const [activeTab, setActiveTab] = useState('updateDay');
  const [notification, setNotification] = useState(null);
  
  const showInternalNotification = (message, type = 'success', callback = null) => {
    setNotification({ message, type, callback });
    if (type !== 'confirm') {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSaveScheduleDay = async (updateData) => {
    try {
      await updateScheduleDay(updateData);
      setTimeout(async () => {
        if (onSuccess) onSuccess();
      }, 500);
      showInternalNotification("העדכון נשמר בהצלחה", 'success');
    } catch (err) {
      console.error("updateScheduleDay error", err);
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      const errorDetails = err.response?.data?.details;
      let fullMessage = serverMessage || err.message || 'שגיאה לא ידועה';
      if (errorDetails) {
        fullMessage += `: ${errorDetails}`;
      }
      showInternalNotification(fullMessage, 'error');
    }
  };

  const handleCreateSchedule = async (scheduleData) => {
    try {
      await createSchedule(scheduleData);
      setTimeout(async () => {
        if (onSuccess) onSuccess();
      }, 500);
      showInternalNotification("המערכת נשמרה בהצלחה!", 'success');
    } catch (err) {
      console.error("createSchedule error", err);
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      const errorDetails = err.response?.data?.details;
      let fullMessage = serverMessage || err.message || 'שגיאה לא ידועה';
      if (errorDetails) {
        fullMessage += `: ${errorDetails}`;
      }
      showInternalNotification(fullMessage, 'error');
    }
  };

  return (
    <div className="schedule-update-component">
      <div className="schedule-tabs">
        <button 
          className={`tab-button ${activeTab === 'updateDay' ? 'active' : ''}`}
          onClick={() => setActiveTab('updateDay')}
        >
          עדכון יום ספציפי
        </button>
        <button 
          className={`tab-button ${activeTab === 'createFull' ? 'active' : ''}`}
          onClick={() => setActiveTab('createFull')}
        >
          יצירת/עדכון מערכת שלמה
        </button>
      </div>

      {activeTab === 'updateDay' && (
        <div className="update-option-card">
          <h3>עדכון יום ספציפי</h3>
          <p>עדכן שיעורים ביום מסוים בשבוע</p>
          <UpdateDayForm 
            onSubmit={handleSaveScheduleDay} 
            showNotification={showInternalNotification} 
            me={me}
            targetTeacherId={targetTeacherId}
            targetClassName={targetClassName}
          />
        </div>
      )}
      
      {activeTab === 'createFull' && (
        <div className="update-option-card">
          <h3>יצירת/עדכון מערכת שלמה</h3>
          <p>יצירה או עדכון של כל המערכת</p>
          <CreateScheduleForm 
            onSubmit={handleCreateSchedule} 
            showNotification={showInternalNotification} 
            me={me}
            targetTeacherId={targetTeacherId}
            targetClassName={targetClassName}
          />
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          {notification.type === 'confirm' ? (
            <div className="notification-actions">
              <button className="confirm-btn" onClick={() => {
                if (notification.callback) notification.callback();
                setNotification(null);
              }}>אישור</button>
              <button className="cancel-btn" onClick={() => setNotification(null)}>ביטול</button>
            </div>
          ) : (
            <button onClick={() => setNotification(null)}>×</button>
          )}
        </div>
      )}
    </div>
  );
};

/* --- רכיב עזר ליצירת מערכת שלמה --- */
function CreateScheduleForm({ onSubmit, showNotification, me, targetTeacherId, targetClassName }) {
  const [weekPlan, setWeekPlan] = useState({
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: []
  });
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);

  const dayLabels = {
    sunday: "ראשון",
    monday: "שני",
    tuesday: "שלישי",
    wednesday: "רביעי",
    thursday: "חמישי",
    friday: "שישי"
  };

  // איניציאליזציה של המערכת לפי מספר השעות
  useEffect(() => {
    if (me?.schoolId?.scheduleHours) {
      const numHours = me.schoolId.scheduleHours.length;
      const emptyLessons = Array(numHours).fill().map(() => ({ teacherId: "", subject: "" }));
      
      const initialWeekPlan = {
        sunday: [...emptyLessons],
        monday: [...emptyLessons],
        tuesday: [...emptyLessons],
        wednesday: [...emptyLessons],
        thursday: [...emptyLessons],
        friday: [...emptyLessons]
      };
      
      setWeekPlan(initialWeekPlan);
      setLoading(false);
    }
  }, [me]);

  // שליפת רשימת המורים
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await getAllTeachers();
        setTeachers(response.data);
      } catch (err) {
        console.error('Error fetching teachers:', err);
      }
    };
    fetchTeachers();
  }, []);

  const updateLesson = (day, lessonIndex, field, value) => {
    setWeekPlan(prev => ({
      ...prev,
      [day]: prev[day].map((lesson, index) => 
        index === lessonIndex ? { ...lesson, [field]: value } : lesson
      )
    }));
  };

  const handleSubmit = () => {
    let payload;
    
    if (targetClassName) {
      // עדכון עבור כיתה ספציפית
      payload = { 
        className: targetClassName, 
        weekPlan 
      };
    } else if (targetTeacherId) {
      // עדכון עבור מורה ספציפית
      payload = { 
        teacherId: targetTeacherId, 
        weekPlan 
      };
    } else if (me?.ishomeroom) {
      // עדכון עבור כיתת החינוך של המורה
      const homeroomClass = me?.classes?.find(cls => 
        cls.homeroomTeacher && cls.homeroomTeacher._id === me._id
      );
      
      if (!homeroomClass) {
        if (showNotification) {
          showNotification("לא נמצאה כיתה שאתה מחנך בה", 'error');
        }
        return;
      }

      payload = { 
        className: homeroomClass.name, 
        weekPlan 
      };
    } else {
      if (showNotification) {
        showNotification("אין הרשאה לעדכן מערכת שעות", 'error');
      }
      return;
    }

    onSubmit(payload);
  };

  if (loading) {
    return <div className="schedule-form"><p>טוען...</p></div>;
  }

  const getTargetDisplayName = () => {
    if (targetClassName) return `כיתה: ${targetClassName}`;
    if (targetTeacherId) {
      const teacher = teachers.find(t => t._id === targetTeacherId);
      return teacher ? `מורה: ${teacher.firstName} ${teacher.lastName}` : "מורה נבחרת";
    }
    if (me?.ishomeroom) {
      const homeroomClass = me?.classes?.find(cls => cls.homeroomTeacher && cls.homeroomTeacher._id === me._id);
      return `כיתה: ${homeroomClass?.name || "לא נמצא"}`;
    }
    return "לא נמצא יעד";
  };

  return (
    <div className="schedule-form">
      <div className="form-header">
        <p>{getTargetDisplayName()}</p>
      </div>

      <div className="week-schedule">
        {Object.keys(weekPlan).map(day => (
          <div key={day} className="day-schedule">
            <h4>{dayLabels[day]}</h4>
            {weekPlan[day].map((lesson, lessonIndex) => {
              const scheduleHour = me?.schoolId?.scheduleHours?.[lessonIndex];
              return (
                <div key={lessonIndex} className="lesson-input-row">
                  <div className="lesson-info">
                    <span className="lesson-number">שעה {lessonIndex + 1}</span>
                    {scheduleHour && (
                      <span className="lesson-time">({scheduleHour.start} - {scheduleHour.end})</span>
                    )}
                  </div>
                  <div className="lesson-inputs">
                    <select
                      value={lesson.teacherId}
                      onChange={(e) => updateLesson(day, lessonIndex, 'teacherId', e.target.value)}
                    >
                      <option value="">בחר מורה</option>
                      {teachers.map(teacher => (
                        <option key={teacher._id} value={teacher.userId}>
                          {teacher.firstName} {teacher.lastName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="מקצוע"
                      value={lesson.subject}
                      onChange={(e) => updateLesson(day, lessonIndex, 'subject', e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={handleSubmit}>
          שמור מערכת
        </button>
      </div>
    </div>
  );
}

/* --- רכיב עזר לעדכון יום ספציפי --- */
function UpdateDayForm({ onSubmit, showNotification, me, targetTeacherId, targetClassName }) {
  const [day, setDay] = useState("sunday");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  
  // איניציאליזציה של השיעורים לפי מספר השעות בבית הספר
  useEffect(() => {
    if (me?.schoolId?.scheduleHours) {
      const numHours = me.schoolId.scheduleHours.length;
      const initialLessons = Array(numHours).fill().map(() => ({ teacherId: "", subject: "" }));
      setLessons(initialLessons);
      setLoading(false);
    }
  }, [me]);

  // שליפת רשימת המורים
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await getAllTeachers();
        setTeachers(response.data);
      } catch (err) {
        console.error('Error fetching teachers:', err);
      }
    };
    fetchTeachers();
  }, []);

  const dayOptions = [
    { value: "sunday", label: "ראשון" },
    { value: "monday", label: "שני" },
    { value: "tuesday", label: "שלישי" },
    { value: "wednesday", label: "רביעי" },
    { value: "thursday", label: "חמישי" },
    { value: "friday", label: "שישי" }
  ];

  const updateLesson = (index, field, value) => {
    const newLessons = [...lessons];
    newLessons[index][field] = value;
    setLessons(newLessons);
  };

  const handleSubmit = () => {
    let payload;
    
    if (targetClassName) {
      payload = { className: targetClassName, day, lessons };
    } else if (targetTeacherId) {
      payload = { teacherId: targetTeacherId, day, lessons };
    } else if (me?.ishomeroom) {
      const homeroomClass = me?.classes?.find(cls => 
        cls.homeroomTeacher && cls.homeroomTeacher._id === me._id
      );
      
      if (!homeroomClass) {
        if (showNotification) {
          showNotification("לא נמצאה כיתה שאתה מחנך בה", 'error');
        }
        return;
      }

      payload = { className: homeroomClass.name, day, lessons };
    } else {
      if (showNotification) {
        showNotification("אין הרשאה לעדכן מערכת שעות", 'error');
      }
      return;
    }

    onSubmit(payload);
  };

  const getTargetDisplayName = () => {
    if (targetClassName) return targetClassName;
    if (targetTeacherId) {
      const teacher = teachers.find(t => t._id === targetTeacherId);
      return teacher ? `${teacher.firstName} ${teacher.lastName}` : "מורה נבחרת";
    }
    if (me?.ishomeroom) {
      const homeroomClass = me?.classes?.find(cls => cls.homeroomTeacher && cls.homeroomTeacher._id === me._id);
      return homeroomClass?.name || "לא נמצאה כיתה שאתה מחנך בה";
    }
    return "אין הרשאה לעדכן מערכת";
  };

  return (
    <div className="update-day-form">
      <div className="form-row">
        <div className="form-group">
          <label>יעד העדכון</label>
          <input 
            type="text" 
            value={getTargetDisplayName()}
            disabled
            style={{ backgroundColor: '#f7fafc', color: '#4a5568' }}
          />
        </div>
        <div className="form-group">
          <label>יום בשבוע</label>
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            {dayOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <h4>שיעורים</h4>
      {loading ? (
        <p>טוען...</p>
      ) : (
        lessons.map((lesson, index) => {
          const scheduleHour = me?.schoolId?.scheduleHours?.[index];
          return (
            <div key={index} className="lesson-row">
              <div className="lesson-info">
                <span className="lesson-number">שעה {index + 1}</span>
                {scheduleHour && (
                  <span className="lesson-time">({scheduleHour.start} - {scheduleHour.end})</span>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <select 
                    value={lesson.teacherId} 
                    onChange={(e) => updateLesson(index, 'teacherId', e.target.value)}
                  >
                    <option value="">בחר מורה</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher.userId}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <input 
                    type="text" 
                    value={lesson.subject} 
                    onChange={(e) => updateLesson(index, 'subject', e.target.value)}
                    placeholder="מקצוע"
                  />
                </div>
              </div>
            </div>
          );
        })
      )}

      <button className="btn btn-primary" onClick={handleSubmit}>
        שמור עדכון יום
      </button>
    </div>
  );
}

export default ScheduleUpdateComponent;