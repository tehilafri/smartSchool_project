import { useState, useEffect, useMemo } from "react";
import "./Dashboard.css";
import "./AdminDashboard.css";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUser } from "../../store/slices/userSlice";
import { 
  fetchAllSchoolData, 
  fetchTeachers, 
  fetchStudents, 
  fetchSecretaries, 
  fetchClasses, 
  fetchEvents,
  addTeacher,
  updateTeacher,
  removeTeacher,
  addStudent,
  updateStudent,
  removeStudent,
  addEvent as addEventToStore,
  updateEvent as updateEventInStore,
  removeEvent
} from "../../store/slices/schoolDataSlice";
import { fetchTeacherSchedule, fetchClassSchedule } from "../../store/slices/scheduleSlice";
import { updateUser, deleteUser } from "../../services/userService";
import { createClass, addStudentToClass, getStudentsByName, removeStudentFromClass, deleteClass, updateHomeroomTeacher } from "../../services/classService";
import { addEvent, deleteEvent, updateEvent, reviewEventAI } from "../../services/eventService";
import { getSubstituteRequests } from "../../services/substituteRequestsSercive";
import { getSchoolById, updateSchool, deleteSchool } from "../../services/schoolService";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import SchoolDirectionsButton from "../SchoolDirectionsButton";
import ScheduleUpdateComponent from "./ScheduleUpdateComponent";
import ScheduleTable, { TeacherScheduleView } from "./ScheduleTable";
import ScheduleSection from "./ScheduleSection";
import EventDetailsModal from "./EventDetailsModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";



const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { currentUser: me, loading: loadingMe } = useAppSelector((state) => state.user);
  const { teachers, students, secretaries, classes, events, loading } = useAppSelector((state) => state.schoolData);
  const { teacherSchedules, classSchedules, loading: scheduleLoading } = useAppSelector((state) => state.schedule);

  useEffect(() => {
    document.body.classList.add("sidebar-active");
    return () => {
      document.body.classList.remove("sidebar-active");
    };
  }, []);

  const [activeSection, setActiveSection] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedClass, setExpandedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]); 
  const [absences, setAbsences] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [activeScheduleTab, setActiveScheduleTab] = useState('teachers');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showScheduleUpdate, setShowScheduleUpdate] = useState(false);
  const [scheduleUpdateTarget, setScheduleUpdateTarget] = useState({ type: null, id: null, name: null });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: '', item: null, action: null });
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Computed values from Redux
  const selectedTeacherSchedule = selectedTeacherId ? teacherSchedules[selectedTeacherId]?.schedule : null;
  const selectedClassSchedule = selectedClassId ? classSchedules[selectedClassId]?.schedule : null;

  // טען נתונים מהשרת דרך Redux
  const fetchAllData = async () => {
    try {
      // טעינת נתוני המשתמש הנוכחי
      await dispatch(fetchCurrentUser());
      
      // טעינת כל נתוני בית הספר
      await dispatch(fetchAllSchoolData());
      
      // טעינת בקשות היעדרות (עדיין לא ב-Redux)
      const absencesRes = await getSubstituteRequests();
      setAbsences(absencesRes || []);
    } catch (err) {
      console.error("שגיאה בשליפת נתונים:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [dispatch]);

  // Modal control
  const openModal = (type, data = null) => {
    // אל תשנה את data המקורי!
    let modalDataCopy = data ? { ...data } : null;
    if (modalDataCopy?.date) {
      modalDataCopy.date = new Date(modalDataCopy.date).toISOString().split("T")[0];
    }
    if (modalDataCopy?.startTime) {
      modalDataCopy.startTime = modalDataCopy.startTime.slice(0,5); // פורמט HH:MM
    }
    if (modalDataCopy?.endTime) {
      modalDataCopy.endTime = modalDataCopy.endTime.slice(0,5);
    }
    if (modalDataCopy?.classes && Array.isArray(modalDataCopy.classes) && modalDataCopy.classes.length > 0) {
      // אם זה אובייקטים, תוציא שמות, אם כבר שמות תשאיר
      if (typeof modalDataCopy.classes[0] === "object" && modalDataCopy.classes[0] !== null) {
        modalDataCopy.classes = modalDataCopy.classes.map(c => c.name);
      }
    }
    setModalType(type);
    setModalData(modalDataCopy);
    setFormData(modalDataCopy || {});
    setShowModal(true);
  };
 
  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setModalData(null);
    setFormData({});
  };

  // מחיקת משתמש  
  const handleDeleteUser = async (id) => {
    const userToDelete = [...teachers, ...students, ...secretaries].find(u => u._id === id);
    setConfirmDelete({
      show: true,
      type: 'user',
      item: userToDelete,
      action: async () => {
        try {
          await deleteUser(id);
          if (userToDelete) {
            if (userToDelete.role === 'teacher') {
              dispatch(removeTeacher(id));
            } else if (userToDelete.role === 'student') {
              dispatch(removeStudent(id));
            }
          }
          setConfirmDelete({ show: false, type: '', item: null, action: null });
        } catch (err) {
          console.error('Error deleting user:', err);
        }
      }
    });
  };

  // עדכון משתמש
  const handleUpdateUser = async (id) => {
    try {
      await updateUser(id, formData);
      // ריענון כל הנתונים כדי לקבל את הכיתות המעודכנות
      await fetchAllData();
      closeModal();
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

   // מחיקת כיתה
  const handleDeleteClass = async (className) => {
    const classToDelete = classes.find(c => c.name === className);
    setConfirmDelete({
      show: true,
      type: 'class',
      item: classToDelete,
      action: async () => {
        try {
          await deleteClass(className);
          fetchAllData();
          setConfirmDelete({ show: false, type: '', item: null, action: null });
        } catch (err) {
          console.error('Error deleting class:', err);
        }
      }
    });
  };

  // יצירת כיתה חדשה
  const handleAddClass = async () => {
    await createClass(formData);
    closeModal();
    fetchAllData();
  };

  // הוספת תלמיד לכיתה
  const handleAddStudentToClass = async (className, studentId) => {
    await addStudentToClass({className, studentId });
    closeModal();
    fetchAllData();
  };

  // הסרת תלמיד מכיתה  
  const handleRemoveStudentFromClass = async (className, studentId) => {
    await removeStudentFromClass({ className, studentId });
    closeModal();
    fetchAllData();
  };

  // עדכון כיתה
  const handleUpdateClass = async (id) => {
    await updateClass(id, formData);
    closeModal();
    fetchAllData();
  };

  // עדכון מחנכ/ת לכיתה
  const handleUpdateHomeroomTeacher = async (className, teacherId) => {
    await updateHomeroomTeacher({ className, teacherId });
    closeModal();
    fetchAllData();
  };

  // מחיקת אירוע
  const handleDeleteEvent = async (eventMongoId) => {
    const event = events.find(e => e._id === eventMongoId);
    setConfirmDelete({
      show: true,
      type: 'event',
      item: event,
      action: async () => {
        try {
          await deleteEvent(event.eventId);
          dispatch(removeEvent(eventMongoId));
          setConfirmDelete({ show: false, type: '', item: null, action: null });
        } catch (err) {
          console.error('Error deleting event:', err);
        }
      }
    });
  };

  // יצירת אירוע חדש
  const handleAddEvent = async () => {
    try {
      const newEvent = await addEvent(formData);
      dispatch(addEventToStore(newEvent));
      closeModal();
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  const handleGetEventAISuggestions = async () => {
    try {
      setLoadingAI(true);
      setModalType("aiEventSuggestions");
      
      const eventData = {
        type: formData.type || '',
        title: formData.title || '',
        description: formData.description || '',
        date: formData.date || '',
        startTime: formData.startTime || '',
        endTime: formData.endTime || '',
        classes: formData.classes || [],
        schoolId: me?.schoolId?._id,
        mode: modalData ? 'edit' : 'add'
      };
      
      const response = await reviewEventAI(eventData);
      setAiSuggestions(response.recommendations || 'לא התקבלו הצעות');
    } catch (err) {
      console.error('AI suggestions error:', err);
      setAiSuggestions('שגיאה בקבלת הצעות AI. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoadingAI(false);
    }
  };

  // עדכון אירוע
  const handleUpdateEvent = async (id) => {
    try {
      const updatedEvent = await updateEvent(id, formData);
      dispatch(updateEventInStore({ _id: id, ...formData }));
      closeModal();
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  // עדכון הגדרות בית ספר
  const handleUpdateSchool = async () => {
    await updateSchool(me.schoolId._id, formData);
    closeModal();
    fetchAllData();
  };

  // מחיקת בית ספר
  const handleDeleteSchool = async () => {
    await deleteSchool(me.schoolId._id);
    closeModal();
    onLogout();
  };

  // טעינת מערכת שעות של מורה דרך Redux
  const loadTeacherSchedule = async (teacherId) => {
    try {
      await dispatch(fetchTeacherSchedule(teacherId));
    } catch (err) {
      console.error('Error loading teacher schedule:', err);
    }
  };

  // טעינת מערכת שעות של כיתה דרך Redux
  const loadClassSchedule = async (classId) => {
    try {
      await dispatch(fetchClassSchedule(classId));
    } catch (err) {
      console.error('Error loading class schedule:', err);
    }
  };

  // פורמט מערכת שעות
  const formatSchedule = (teacherSchedule) => {
    const weekPlan = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    };

    teacherSchedule.forEach(dayObj => {
      const { day, lessons } = dayObj;
      const sortedLessons = lessons.sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));
      weekPlan[day] = sortedLessons;
    });

    return { weekPlan };
  };

  // פתיחת עדכון מערכת שעות
  const openScheduleUpdate = (type, id, name) => {
    setScheduleUpdateTarget({ type, id, name });
    setShowScheduleUpdate(true);
  };

  // סגירת עדכון מערכת שעות
  const closeScheduleUpdate = () => {
    setShowScheduleUpdate(false);
    setScheduleUpdateTarget({ type: null, id: null, name: null });
  };

  // רענון מערכת שעות לאחר עדכון
  const handleScheduleUpdateSuccess = () => {
    if (scheduleUpdateTarget.type === 'class' && selectedClassId) {
      loadClassSchedule(selectedClassId);
    }
    closeScheduleUpdate();
  };

  const showNotification = (message, type = 'success') => {
    // Simple notification implementation
    alert(message);
  };

  // Generate grade range based on school settings
  const getGradeRange = () => {
    const allGrades = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב','יג','יד'];
    const minGrade = me?.schoolId?.minGrade;
    const maxGrade = me?.schoolId?.maxGrade;
    
    if (!minGrade || !maxGrade) return allGrades;
    
    const minIndex = allGrades.indexOf(minGrade);
    const maxIndex = allGrades.indexOf(maxGrade);
    
    if (minIndex === -1 || maxIndex === -1) return allGrades;
    
    return allGrades.slice(minIndex, maxIndex + 1);
  };


  // טופס דינמי למודאל
  
  const renderModalForm = () => {
    if (modalType === "editTeacher" || modalType === "editSecretary" || modalType === "editStudent") {
      return (
        <form onSubmit={e => {
          e.preventDefault();
          handleUpdateUser(modalData._id);
        }}>
          <input
            type="text"
            placeholder="שם פרטי"
            value={formData.firstName || ""}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
          />
          <input
            type="text"
            placeholder="שם משפחה"
            value={formData.lastName || ""}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
          />
          <input
            type="email"
            placeholder="אימייל"
            value={formData.email || ""}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="tel"
            placeholder="טלפון"
            value={formData.phone || ""}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
          {(modalType === "editTeacher" || modalType === "editStudent") && (
          <>
          <label>{modalType === "editTeacher" ? 'מלמדת בכיתות:' : 'לומדת בכיתה:'}</label>
          {modalType === "editStudent" ? (
            <select
              value={Array.isArray(formData.classes) ? formData.classes[0] || "" : formData.classes || ""}
              onChange={e => setFormData({ ...formData, classes: e.target.value ? [e.target.value] : [] })}
            >
              <option value="">בחר כיתה</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls.name}>{cls.name}</option>
              ))}
            </select>
          ) : (
            <div className="checkbox-group">
              <label>בחר כיתות:</label>
              {classes.map(cls => (
                <div key={cls._id}>
                  <input
                    type="checkbox"
                    checked={Array.isArray(formData.classes) ? formData.classes.includes(cls.name) : false}
                    onChange={e => {
                      let updated = Array.isArray(formData.classes) ? [...formData.classes] : [];
                      if (e.target.checked) {
                        updated = [...updated, cls.name];
                      } else {
                        updated = updated.filter(name => name !== cls.name);
                      }
                      setFormData({ ...formData, classes: updated });
                    }}
                  />
                  <span>{cls.name}</span>
                </div>
              ))}
            </div>
          )}
          </>
          )}
          <button className="btn btn-primary" type="submit">שמור</button>
        </form>
      );
    }
    if (modalType === "addClass" ) {
      return (
      <form onSubmit={e => {
          e.preventDefault();
          handleAddClass();
        }}>
          <div className="form-row">
            <div className="form-group">
              <label>בחר שכבת כיתה</label>
              <select
                value={formData.gradeLevel || ""}
                onChange={e => setFormData({ ...formData, gradeLevel: e.target.value })}
                required
              >
                <option value="">בחר שכבת כיתה</option>
                {getGradeRange().map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>מספר/תיאור כיתה</label>
              <input
                type="text"
                placeholder="1, 2, א, ב או תיאור אחר"
                value={formData.classNumber || ""}
                onChange={e => {
                  const fullName = formData.gradeLevel && e.target.value ? `${formData.gradeLevel}${e.target.value}` : "";
                  setFormData({ ...formData, classNumber: e.target.value, name: fullName });
                }}
                required
              />
            </div>
          </div>
          <input type="text" 
          placeholder="ת''ז מחנכ/ת"
          value={formData.homeroomTeacher || ""}
          onChange={e => setFormData({ ...formData, homeroomTeacher: e.target.value })}
          required
          />
          <button className="btn btn-primary" type="submit">שמור</button>
        </form>
      );
    }
    if (modalType === "addEvent" || modalType === "editEvent") {
      return (
        <form onSubmit={e => {
          e.preventDefault();
          modalType === "addEvent"
            ? handleAddEvent()
            : handleUpdateEvent(modalData._id);
        }}>
          <label>סוג אירוע</label>
          <select
          value={formData.type || ""}
          onChange={e => setFormData({ ...formData, type: e.target.value })}
          required
        >
          <option value="">בחר סוג אירוע</option>
          <option value="trip">טיול</option>
          <option value="activity">פעילות</option>
        </select>

          <input
            type="text"
            placeholder="כותרת"
            value={formData.title || ""}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <textarea
            placeholder="הערות מיוחדות"
            value={formData.description || ""}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />

          <input
            type="date"
            value={formData.date || ""}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            required
          />
          שעת התחלה
          <input
            type="time"
            value={formData.startTime || ""}
            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
          שעת סיום 
          <input
            type="time"
            value={formData.endTime || ""}
            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
            required
          />

          <div className="checkbox-group">
            <label>בחר כיתות:</label>
            {classes.map(cls => (
              <div key={cls._id}>
                <input
                  type="checkbox"
                  checked={formData.classes?.includes(cls.name) || false}
                  onChange={e => {
                    let updated = formData.classes || [];
                    if (e.target.checked) {
                      updated = [...updated, cls.name];
                    } else {
                      updated = updated.filter(name => name !== cls.name);
                    }
                    setFormData({ ...formData, classes: updated });
                  }}
                />
                <span>{cls.name}</span>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button className="btn btn-primary" type="submit">שמור</button>
            {(modalType === "addEvent" || modalType === "editEvent") && (
              <button className="btn btn-secondary" type="button" onClick={handleGetEventAISuggestions}>
                הצעות AI לאירוע
              </button>
            )}
          </div>
        </form>
      );
}
    if (modalType === "editSchool") {
      const scheduleHours = formData.scheduleHours || me?.schoolId?.scheduleHours || [];
      
      const addScheduleHour = () => {
        const newHours = [...scheduleHours, { start: "08:00", end: "08:45" }];
        setFormData({ ...formData, scheduleHours: newHours });
      };
      
      const updateScheduleHour = (index, field, value) => {
        const newHours = [...scheduleHours];
        newHours[index] = { ...newHours[index], [field]: value };
        setFormData({ ...formData, scheduleHours: newHours });
      };
      
      const removeScheduleHour = (index) => {
        const newHours = scheduleHours.filter((_, i) => i !== index);
        setFormData({ ...formData, scheduleHours: newHours });
      };
    const allowedGrades = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב','יג','יד'];
      return (
        <form onSubmit={e => {
          e.preventDefault();
          handleUpdateSchool();
        }}>
          <div className="form-group">
            <label>שם בית הספר</label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>תיאור בית הספר</label>
            <textarea
              value={formData.description || ""}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>כתובת</label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>טלפון</label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>אתר</label>
            <input
              type="text"
              value={formData.website || ""}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>אימייל</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
          <label>כיתה נמוכה ביותר (טווח)</label>
          <select
            value={formData.minGrade || ""} // הצג (ללא) אם הערך הוא null או ""
            onChange={e => setFormData({ ...formData, minGrade: e.target.value || null })} // שלח null אם הבחירה ריקה
          >
            <option value="">(ללא)</option>
            {allowedGrades.map(grade => (
              <option key={`min-${grade}`} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>כיתה גבוהה ביותר (טווח)</label>
          <select
            value={formData.maxGrade || ""}
            onChange={e => setFormData({ ...formData, maxGrade: e.target.value || null })}
          >
            <option value="">(ללא)</option>
            {allowedGrades.map(grade => (
              <option key={`max-${grade}`} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

          <div className="schedule-hours-section">
            <div className="section-header">
              <h4>מערכת שעות</h4>
              <button type="button" className="btn-small btn-primary" onClick={addScheduleHour}>
                הוסף שיעור
              </button>
            </div>
            <div className="schedule-hours-list">
              {scheduleHours.map((hour, index) => (
                <div key={index} className="schedule-hour-item">
                  <span className="hour-number">שיעור {index + 1}</span>
                  <input
                    type="time"
                    value={hour.start || ""}
                    onChange={e => updateScheduleHour(index, 'start', e.target.value)}
                    placeholder="התחלה"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={hour.end || ""}
                    onChange={e => updateScheduleHour(index, 'end', e.target.value)}
                    placeholder="סיום"
                  />
                  <button
                    type="button"
                    className="btn-small btn-danger"
                    onClick={() => removeScheduleHour(index)}
                  >
                    מחק
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <button className="btn btn-primary" type="submit">שמור</button>
        </form>
      );
    }
    if (modalType === "deleteSchool") {
      return (
        <div className="danger-zone">
          <p>האם אתה בטוח שברצונך למחוק את בית הספר?</p>
          <p className="warning-text">פעולה זו תמחק את כל הנתונים ולא ניתן לבטלה!</p>
          <div className="modal-actions">
            <button className="btn btn-danger" onClick={handleDeleteSchool}>כן, מחק</button>
            <button className="btn btn-outline" onClick={closeModal}>ביטול</button>
          </div>
        </div>
      );
    }
    return <p>טופס זה יפותח בקרוב...</p>;
  };

  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "teachers", label: "ניהול מורים/ות", icon: "👩‍🏫" },
    { id: "secretaries", label: "ניהול מזכירים/ות", icon: "👩‍💼" },
    { id: "students", label: "ניהול תלמידים", icon: "👨‍🎓" },
    { id: "classes", label: "ניהול כיתות", icon: "🏫" },
    { id: "schedule", label: "מערכת שעות", icon: "📅" },
    { id: "events", label: "אירועים", icon: "🎉" },
    { id: "absences", label: "בקשות היעדרות", icon: "📝" },
    { id: "settings", label: "הגדרות בית ספר", icon: "⚙️" },
  ];

  // Memoized calculations to prevent unnecessary re-renders
  const nearestEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const sortedByDistance = events
      .map(event => ({
        ...event,
        distance: Math.abs(new Date(event.date).getTime() - today.getTime())
      }))
      .sort((a, b) => a.distance - b.distance);

    return sortedByDistance.slice(0, 3);
  }, [events]);

  const { futureEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const future = events
      .filter(ev => {
        if (!ev.date) return false;
        const eventDate = new Date(ev.date);
        if (eventDate.toDateString() === now.toDateString() && ev.endTime) {
          const [hours, minutes] = ev.endTime.split(':');
          const eventEndTime = new Date(eventDate);
          eventEndTime.setHours(parseInt(hours), parseInt(minutes));
          return eventEndTime > now;
        }
        return eventDate > now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const past = events
      .filter(ev => {
        if (!ev.date) return false;
        const eventDate = new Date(ev.date);
        if (eventDate.toDateString() === now.toDateString() && ev.endTime) {
          const [hours, minutes] = ev.endTime.split(':');
          const eventEndTime = new Date(eventDate);
          eventEndTime.setHours(parseInt(hours), parseInt(minutes));
          return eventEndTime <= now;
        }
        return eventDate < now;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return { futureEvents: future, pastEvents: past };
  }, [events]);

  const { futureAbsences, pastAbsences } = useMemo(() => {
    if (!absences.requests) return { futureAbsences: [], pastAbsences: [] };
    
    const todayAbsences = new Date();
    todayAbsences.setHours(0, 0, 0, 0);
    
    const future = absences.requests
      .filter(absence => {
        const absenceDate = new Date(absence.date);
        absenceDate.setHours(0, 0, 0, 0);
        return absenceDate >= todayAbsences;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const past = absences.requests
      .filter(absence => {
        const absenceDate = new Date(absence.date);
        absenceDate.setHours(0, 0, 0, 0);
        return absenceDate < todayAbsences;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return { futureAbsences: future, pastAbsences: past };
  }, [absences]);

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-content">
            <h2>סקירה כללית</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👩‍🏫</div>
                <div className="stat-info">
                  <h3>{teachers.length}</h3>
                  <p>מורים/ות</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👩‍💼</div>
                <div className="stat-info">
                  <h3>{secretaries.length}</h3>
                  <p>מזכירים/ות</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏫</div>
                <div className="stat-info">
                  <h3>{classes.length}</h3>
                  <p>כיתות</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👨‍🎓</div>
                <div className="stat-info">
                  <h3>{students.length}</h3>
                  <p>תלמידים</p>
                </div>
              </div>
            </div>
            <div className="recent-activities">
              <h3>מה קורה בבית הספר</h3>
              <div className="activity-list">
                {nearestEvents.map((event, idx) => (
                  <div className="activity-item" key={event._id || idx}>
                    <span className="activity-time">
                      {event.date ? new Date(event.date).toLocaleDateString('he-IL') : "לא ידוע"}
                    </span>
                    <span className="activity-text">
                      {event.title || event.description || "אירוע"} - כיתות: {event.classes?.map(c => c.name).join(", ") || "לא צוין"}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        );

      case "teachers":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול מורים/ות</h2>
              <button className="btn btn-primary" onClick={() => navigate("/register_user?role=teacher")}>
                הוסף מורה
              </button>
            </div>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>תעודת זהות</th>
                    <th>סל מקצועות</th>
                    <th>כיתות לימוד</th>
                    <th>אימייל</th>
                    <th>טלפון</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>{teacher.firstName} {teacher.lastName}</td>
                      <td>{teacher.userId || "-"}</td>
                      <td>{teacher.subjects ? teacher.subjects.join(", ") : "-"}</td>
                      <td>{teacher.classes ? teacher.classes.map(cls => cls.name).join(", ") : "-"}</td>
                      <td>{teacher.email || "-"}</td>
                      <td>{teacher.phone || "-"}</td>
                      <td>
                        <button className="btn-small btn-outline" onClick={() => openModal("editTeacher", teacher)}>✏️</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteUser(teacher._id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "secretaries":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול מזכירים/ות</h2>
              <button className="btn btn-primary" onClick={() => navigate("/register_user?role=secretary")}>
                הוסף מזכיר/ה
              </button>
            </div>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>טלפון</th>
                    <th>אימייל</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {secretaries.map((sec) => (
                    <tr key={sec._id}>
                      <td>{sec.firstName} {sec.lastName}</td>
                      <td>{sec.phone || "-"}</td>
                      <td>{sec.email || "-"}</td>
                      <td>
                        <button className="btn-small btn-outline" onClick={() => openModal("editSecretary", sec)}>✏️</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteUser(sec._id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "students":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול תלמידים</h2>
              <button className="btn btn-primary" onClick={() => navigate("/register_user?role=student")}>
                הוסף תלמיד
              </button>
            </div>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>כיתה</th>
                    <th>טלפון</th>
                    <th>אימייל</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.firstName} {student.lastName}</td>
                      <td>{student.classes ? student.classes.map(cls => cls.name).join(", ") : "-"}</td>
                      <td>{student.phone || "-"}</td>
                      <td>{student.email || "-"}</td>
                      <td>{student.status || "-"}</td>
                      <td>
                        <button className="btn-small btn-outline" onClick={() => openModal("editStudent", student)}>✏️</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteUser(student._id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "classes":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול כיתות</h2>
              <button className="btn btn-primary" onClick={() => openModal("addClass")}>
                הוסף כיתה חדשה
              </button>
            </div>
            <div className="classes-grid">
              {classes.map((cls) => (
                <div className="class-card" key={cls._id}>
                  <h3>{cls.name}</h3>
                  <p>
                    <strong>מחנכ/ת:</strong>{" "}
                    {cls.homeroomTeacher
                      ? `${cls.homeroomTeacher.firstName} ${cls.homeroomTeacher.lastName}`
                      : "-"}
                  </p>
                  <p>
                    <strong>מספר תלמידים:</strong>{" "}
                    {cls.students ? cls.students.length : 0}
                  </p>

                  {/* עדכון מחנכ/ת */}
                  <div className="form-inline">
                    <input
                      type="text"
                      placeholder="ת״ז מחנכ/ת חדש/ה לשינוי"
                      value={formData[cls._id]?.homeroomTeacher || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [cls._id]: {
                            ...formData[cls._id],
                            homeroomTeacher: e.target.value,
                          },
                        })
                      }
                    />
                    <button
                      className="btn-small btn-primary"
                      onClick={() =>
                        handleUpdateHomeroomTeacher(
                          cls.name,
                          formData[cls._id]?.homeroomTeacher
                        )
                      }
                    >
                     ✏️
                    </button>
                  </div>


                  {/* כפתורי פעולות */}
                  <div className="class-actions">
                    <button
                      className="btn-small btn-info"
                      onClick={async () => {
                        if (expandedClass === cls._id) {
                          setExpandedClass(null); // סגירה
                        } else {
                          const data = await getStudentsByName(cls.name);
                          setExpandedClass(cls._id);
                          setClassStudents(data || []);
                        }
                      }}
                     > פרטים </button>

                    <button
                      className="btn-small btn-danger"
                      onClick={() => handleDeleteClass(cls.name)}
                    >
                      מחיקת כיתה
                    </button>
                  </div>

                  {/* הצגת תלמידים */}
                  {expandedClass === cls._id && (
                    <div className="students-list">
                      <h4>תלמידים בכיתה {cls.name}</h4>
                      {classStudents.length > 0 ? (
                        <ul>
                          {classStudents.map((st) => (
                            <li key={st._id}>
                               ת''ז: {st.userId}, שם: {st.firstName} {st.lastName}, אימייל: {st.email}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>אין תלמידים בכיתה זו.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "schedule":
        return (
          <ScheduleSection
            activeTab={activeScheduleTab}
            setActiveTab={setActiveScheduleTab}
            teachers={teachers}
            classes={classes}
            selectedTeacherId={selectedTeacherId}
            setSelectedTeacherId={setSelectedTeacherId}
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
            selectedTeacherSchedule={selectedTeacherSchedule ? {
              weekPlan: (() => {
                if (selectedTeacherSchedule.weekPlan) {
                  return selectedTeacherSchedule.weekPlan;
                }
                const weekPlan = {
                  sunday: [],
                  monday: [],
                  tuesday: [],
                  wednesday: [],
                  thursday: [],
                  friday: [],
                };
                if (Array.isArray(selectedTeacherSchedule)) {
                  selectedTeacherSchedule.forEach(dayObj => {
                    const { day, lessons } = dayObj;
                    if (day && lessons && weekPlan[day]) {
                      const sortedLessons = [...lessons].sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));
                      weekPlan[day] = sortedLessons;
                    }
                  });
                }
                return weekPlan;
              })()
            } : null}
            selectedClassSchedule={selectedClassSchedule ? {
              weekPlan: (() => {
                if (selectedClassSchedule.weekPlan) {
                  return selectedClassSchedule.weekPlan;
                }
                const weekPlan = {
                  sunday: [],
                  monday: [],
                  tuesday: [],
                  wednesday: [],
                  thursday: [],
                  friday: [],
                };
                if (Array.isArray(selectedClassSchedule)) {
                  selectedClassSchedule.forEach(dayObj => {
                    const { day, lessons } = dayObj;
                    if (day && lessons && weekPlan[day]) {
                      const sortedLessons = [...lessons].sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));
                      weekPlan[day] = sortedLessons;
                    }
                  });
                }
                return weekPlan;
              })()
            } : null}
            events={events}
            me={me}
            onEventClick={setSelectedEvent}
            onLoadTeacherSchedule={loadTeacherSchedule}
            onLoadClassSchedule={loadClassSchedule}
            onOpenScheduleUpdate={openScheduleUpdate}
          />
        );

      case "events":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול אירועים</h2>
              <button className="btn btn-primary" onClick={() => openModal("addEvent")}>
                הוסף אירוע חדש
              </button>
            </div>
            <div className="events-section">
              <h3>אירועים עתידיים</h3>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>סוג</th>
                      <th>כותרת</th>
                      <th>הערות</th>
                      <th>שעת התחלה</th>
                      <th>שעת סיום</th>
                      <th>כיתות</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {futureEvents.map((event) => (
                      <tr key={event._id}>
                        <td>{event.date ? new Date(event.date).toLocaleDateString('he-IL') : "-"}</td>
                        <td>{event.type}</td>
                        <td>{event.title}</td>
                        <td>{event.description || "-"}</td>
                        <td>{event.startTime}</td>
                        <td>{event.endTime}</td>
                        <td>{event.classes?.map(c => c.name).join(", ") || "-"}</td>
                        <td>
                          {event.type !== "exam" && (
                            <button className="btn-small btn-outline" onClick={() => openModal("editEvent", event)}>
                              ✏️
                            </button>
                          )}
                          {event.type !== "exam" && (
                            <button className="btn-small btn-danger" onClick={() => handleDeleteEvent(event._id)}>
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 style={{marginTop: "2em"}}>אירועים קודמים</h3>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>סוג</th>
                      <th>כותרת</th>
                      <th>הערות</th>
                      <th>שעת התחלה</th>
                      <th>שעת סיום</th>
                      <th>כיתות</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastEvents.map((event) => (
                      <tr key={event._id}>
                        <td>{event.date ? new Date(event.date).toLocaleDateString('he-IL') : "-"}</td>
                        <td>{event.type}</td>
                        <td>{event.title}</td>
                        <td>{event.description || "-"}</td>
                        <td>{event.startTime}</td>
                        <td>{event.endTime}</td>
                        <td>{event.classes?.map(c => c.name).join(", ") || "-"}</td>
                        <td>
                          {event.type !== "exam" && (
                            <button className="btn-small btn-danger" onClick={() => handleDeleteEvent(event._id)}>
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "absences":

        const renderAbsenceCard = (absence) => {
          const teacherName =
            absence.teacherName ||
            (absence.originalTeacherId ? `${absence.originalTeacherId.firstName || ""} ${absence.originalTeacherId.lastName || ""}`.trim() : (absence.teacher || "לא ידוע"));
          const substituteName =
            absence.substituteName ||
            (absence.substituteTeacher ? `${absence.substituteTeacher.firstName || ""} ${absence.substituteTeacher.lastName || ""}`.trim() : (absence.substitute || "טרם נמצא"));
          const dateStr = absence.date
            ? (() => {
                try { return new Date(absence.date).toLocaleDateString("he-IL"); }
                catch (e) { return absence.date; }
              })()
            : "-";
          const hoursStr = absence.hours || `${absence.startTime || "-"} - ${absence.endTime || "-"}`;
          const className = classes.find(c => c._id === absence.classId)?.name || "-";
          const statusText = absence.statusText || absence.status || "-";

          return (
            <div className={`absence-card ${absence.status || ""}`} key={absence._id}>
              <div className="absence-header">
                <h4>{teacherName}</h4>
                <span className={`status-badge ${absence.status || ""}`}>{statusText}</span>
              </div>
              <div className="absence-details">
                <p><strong>תאריך:</strong> {dateStr}</p>
                <p><strong>שעות:</strong> {hoursStr}</p>
                <p><strong>סיבה:</strong> {absence.reason || "-"}</p>
                <p><strong>כיתה מושפעת:</strong> {className}</p>
                <p><strong>מחליפ/ה:</strong> {substituteName}</p>
                {absence.notes && <p><strong>הערות נוספות:</strong> {absence.notes}</p>}
              </div>
            </div>
          );
        };

        return (         
          <div className="dashboard-content">
            <h2>בקשות היעדרות</h2>

            {Array.isArray(absences) && absences.length === 0 ? (
              <p>אין בקשות היעדרות כרגע.</p>
            ) : (
              <>
                <h3>בקשות היעדרות עתידיות</h3>
                <div className="absence-requests">
                  {futureAbsences.length === 0 ? (
                    <p>אין בקשות היעדרות עתידיות.</p>
                  ) : (
                    futureAbsences.map(renderAbsenceCard)
                  )}
                </div>
                
                <h3 style={{marginTop: "2em"}}>בקשות היעדרות קודמות</h3>
                <div className="absence-requests">
                  {pastAbsences.length === 0 ? (
                    <p>אין בקשות היעדרות קודמות.</p>
                  ) : (
                    pastAbsences.map(renderAbsenceCard)
                  )}
                </div>
              </>
            )}
          </div>
        );

      case "settings":
        return (
          <div className="dashboard-content">
            <h2>הגדרות בית ספר</h2>
            {me?.schoolId ? (
              <div className="school-info-display">
                <div className="info-card">
                  <h3>פרטי בית הספר</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>שם בית הספר: </label>
                      <span>{me.schoolId.name || "לא צוין"}</span>
                    </div>
                    <div className="info-item">
                      <label>קוד בית ספר: </label>
                      <span>{me.schoolId.schoolCode || "לא צוין"}</span>
                    </div>
                    <div className="info-item">
                      <label>כתובת: </label>
                      <span>{me.schoolId.address || "לא צוין"}</span>
                    </div>
                    <div className="info-item">
                      <label>טלפון:</label>
                      <span>{me.schoolId.phone || "לא צוין"}</span>
                    </div>
                    <div className="info-item">
                      <label>אימייל: </label>
                      <span>{me.schoolId.email || "לא צוין"}</span>
                    </div>
                    <div className="info-item">
                      <label>אתר: </label>
                      <span>{me.schoolId.website || "לא צוין"}</span>
                    </div>
                    <div className="info-item">
                      <label>תיאור:</label>
                      <span>{me.schoolId.description || "לא צוין"}</span>
                    </div>
                    <div className="info-item">
                      <label>כיתה נמוכה:</label>
                      <span>{me.schoolId.minGrade || "לא צוין"}</span>
                    </div>
                    <div className="info-item">
                      <label>כיתה גבוהה:</label>
                      <span>{me.schoolId.maxGrade || "לא צוין"}</span>
                    </div>
                  </div>
                </div>
                <div className="settings-actions">
                  <button className="btn btn-primary" onClick={() => openModal("editSchool", me.schoolId)}>ערוך פרטים</button>
                  <button className="btn btn-danger" onClick={() => openModal("deleteSchool")}>מחק בית ספר</button>
                </div>
              </div>
            ) : (
              <p>טוען פרטי בית ספר...</p>
            )}
          </div>
        );

      default:
        return (
          <div className="dashboard-content">
            <h2>{menuItems.find((item) => item.id === activeSection)?.label}</h2>
            <p>תוכן זה יפותח בקרוב...</p>
          </div>
        );
    }
  };

  // מודאל דינמי
  const renderModal = () => {
    if (!showModal) return null;
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === "addTeacher" && "הוספת מורה חדש/ה"}
              {modalType === "editTeacher" && "עריכת מורה"}
              {modalType === "addSecretary" && "הוספת מזכיר/ה חדש/ה"}
              {modalType === "editSecretary" && "עריכת מזכיר/ה"}
              {modalType === "addStudent" && "הוספת תלמיד חדש"}
              {modalType === "editStudent" && "עריכת תלמיד"}
              {modalType === "addClass" && "הוספת כיתה חדשה"}
              {modalType === "editClass" && "עריכת כיתה"}
              {modalType === "addEvent" && "הוספת אירוע חדש"}
              {modalType === "editEvent" && "עריכת אירוע"}
              {modalType === "aiEventSuggestions" && "הצעות AI לאירוע"}
              {modalType === "editSchool" && "עריכת הגדרות בית ספר"}
              {modalType === "deleteSchool" && "מחיקת בית ספר"}
            </h3>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
          <div className="modal-body">
            {modalType === "aiEventSuggestions" ? (
              <div className="ai-suggestions-content">
                {loadingAI ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>מקבל הצעות מ-AI...</p>
                  </div>
                ) : (
                  <div className="ai-suggestions-text">
                    <p>{aiSuggestions}</p>
                  </div>
                )}
                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={() => {
                    setModalType(modalData ? "editEvent" : "addEvent");
                    setAiSuggestions('');
                  }}>
                    {modalData ? "חזור לעריכת אירוע" : "חזור ליצירת אירוע"}
                  </button>
                  <button className="btn btn-outline" onClick={closeModal}>
                    סגור
                  </button>
                </div>
              </div>
            ) : (
              renderModalForm()
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header" style={{marginTop: 70}}>
          <h2>Smart School</h2>
          <p>פאנל מנהל/ת</p>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
              >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-outline logout-btn" onClick={onLogout}>
            יציאה
          </button>
        </div>
      </div>
      <div className="dashboard-main" style={{paddingTop: 60}}>
        {me?.schoolId && <DashboardHeader schoolId={me.schoolId._id} onLogout={onLogout} />}
        <div className="dashboard-header">
          <h1>{me?.gender=="female"?"ברוכה הבאה": "ברוך הבא"}, {loadingMe ? "טוען..." : (me?.firstName )} {me?.lastName}</h1>
          <div className="header-actions">
            {me?.schoolId?.address && <SchoolDirectionsButton schoolAddress={me.schoolId.address} />}
          </div>
        </div> 
        {renderContent()}
      </div>
      {renderModal()}
      
      {/* Schedule Update Modal */}
      {showScheduleUpdate && (
        <div className="modal-overlay" onClick={closeScheduleUpdate}>
          <div className="modal-content schedule-update-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>עדכון מערכת שעות - {scheduleUpdateTarget.name}</h3>
              <button className="modal-close" onClick={closeScheduleUpdate}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <ScheduleUpdateComponent
                targetClassName={scheduleUpdateTarget.type === 'class' ? scheduleUpdateTarget.name : null}
                onSuccess={handleScheduleUpdateSuccess}
                showNotification={showNotification}
                me={me}
                existingSchedule={scheduleUpdateTarget.type === 'class' ? (() => {
                  if (selectedClassSchedule?.weekPlan) return selectedClassSchedule.weekPlan;
                  if (Array.isArray(selectedClassSchedule)) {
                    const weekPlan = { sunday: [], monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] };
                    selectedClassSchedule.forEach(dayObj => {
                      const { day, lessons } = dayObj;
                      if (day && lessons && weekPlan[day]) {
                        weekPlan[day] = [...lessons].sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));
                      }
                    });
                    return weekPlan;
                  }
                  return null;
                })() : null}
              />
            </div>
          </div>
        </div>
      )}
      
      <EventDetailsModal selectedEvent={selectedEvent} onClose={() => setSelectedEvent(null)} />
      
      <ConfirmDeleteModal
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, type: '', item: null, action: null })}
        onConfirm={confirmDelete.action}
        title={`מחיקת ${confirmDelete.type === 'user' ? 'משתמש' : confirmDelete.type === 'event' ? 'אירוע' : 'כיתה'}`}
        message="האם אתה בטוח בביצוע הפעולה הנ'ל?"
        itemName={confirmDelete.item ? 
          (confirmDelete.type === 'user' ? `${confirmDelete.item.firstName} ${confirmDelete.item.lastName}` :
           confirmDelete.type === 'event' ? confirmDelete.item.title :
           confirmDelete.item.name) : ''}
      />
    </div>
  );
};

export default AdminDashboard;