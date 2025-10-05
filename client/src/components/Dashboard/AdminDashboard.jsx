import { useState, useEffect } from "react";
import "./Dashboard.css";
import "./AdminDashboard.css";
import { getAllTeachers, getAllStudents, getAllSecretaries, getMe, updateUser,registerUser, deleteUser } from "../../services/userService";
import { getAllClasses, createClass, addStudentToClass,getStudentsByName, removeStudentFromClass, deleteClass, updateHomeroomTeacher } from "../../services/classService";
import { getEvents, addEvent, deleteEvent, updateEvent } from "../../services/eventService";
import { getSubstituteRequests } from "../../services/substituteRequestsSercive";
// import { getSchoolSchedule } from "../../services/scheduleService";
import { getSchoolById, updateSchool, deleteSchool } from "../../services/schoolService";
import { getScheduleByTeacher, getHomeroomClassSchedule } from "../../services/scheduleService";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import SchoolDirectionsButton from "../SchoolDirectionsButton";

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();

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
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [secretaries, setSecretaries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [activeScheduleTab, setActiveScheduleTab] = useState('teachers');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherSchedule, setSelectedTeacherSchedule] = useState(null);
  const [selectedClassSchedule, setSelectedClassSchedule] = useState(null);

  // טען נתונים מהשרת
  const fetchAllData = async () => {

    try {
      setLoadingMe(true);
      const meRes = await getMe();
      setMe(meRes?.data);
    } catch (err) {
      console.error("getMe error", err);
      setError((e) => e || "שגיאה בטעינת משתמש");
    } finally {
      setLoadingMe(false);
    }

    try {
      const [ teachersRes, studentsRes, secretariesRes, classesRes, eventsRes, absencesRes
        // schoolInfoRes, scheduleRes,
      ] = await Promise.all([
        getAllTeachers(),getAllStudents(),getAllSecretaries(),getAllClasses(),getEvents(),getSubstituteRequests()
        // getSchoolById(), getSchoolSchedule(),
      ]);
      setTeachers(teachersRes?.data || []);
      setStudents(studentsRes?.data || []);
      setSecretaries(secretariesRes?.data || []);
      setClasses(classesRes || []);
      setEvents(eventsRes || []);
      setAbsences(absencesRes || []);
      // getSchoolById(schoolInfoRes.data || null);
      // setSchedule(scheduleRes.data || []);
    } catch (err) {
      console.error("שגיאה בשליפת נתונים:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Modal control
    const openModal = (type, data = null) => {
    if (data?.date) {
      data.date = new Date(data.date).toISOString().split("T")[0]; 
    }
    if (data?.startTime) {
      data.startTime = data.startTime.slice(0,5); // פורמט HH:MM
    }
    if (data?.endTime) {
      data.endTime = data.endTime.slice(0,5);
    }
    if (data?.classes) {
      data.classes = data.classes.map(c => c._id); // שומרים רק את ה־id
    }
    setModalType(type);
    setModalData(data);
    setFormData(data || {});
    setShowModal(true);
  };
 
  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setModalData(null);
    setFormData({});
  };

  // מחיקת משתמש  
  const handleDeleteUser = async (id) => { //לפי מזהה של מונגו!!
    await deleteUser(id);
    fetchAllData();
  };

  // יצירת משתמש חדש (מורה/מזכירה/תלמידה)
  const handleAddUser = async (role) => {
    await registerUser({ ...formData, role });
    closeModal();
    fetchAllData();
  };

  // עדכון משתמש
  const handleUpdateUser = async (id) => {
    await updateUser(id, formData);
    closeModal();
    fetchAllData();
  };

   // מחיקת כיתה
  const handleDeleteClass = async (className) => {
    await deleteClass(className);
    fetchAllData();
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

  // עדכון מחנכת לכיתה
  const handleUpdateHomeroomTeacher = async (className, teacherId) => {
    await updateHomeroomTeacher({ className, teacherId });
    closeModal();
    fetchAllData();
  };

  // מחיקת אירוע
  const handleDeleteEvent = async (id) => {
    await deleteEvent(id);
    fetchAllData();
  };

  // יצירת אירוע חדש
  const handleAddEvent = async () => {
    await addEvent(formData);
    closeModal();
    fetchAllData();
  };

  // עדכון אירוע
  const handleUpdateEvent = async (id) => {
    await updateEvent(id, formData);
    closeModal();
    fetchAllData();
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

  // טעינת מערכת שעות של מורה
  const loadTeacherSchedule = async (teacherId) => {
    try {
      const scheduleData = await getScheduleByTeacher(teacherId);
      const formattedSchedule = formatSchedule(scheduleData);
      setSelectedTeacherSchedule(formattedSchedule);
    } catch (err) {
      console.error('Error loading teacher schedule:', err);
    }
  };

  // טעינת מערכת שעות של כיתה
  const loadClassSchedule = async (classId) => {
    try {
      const scheduleData = await getHomeroomClassSchedule(classId);
      const formattedSchedule = formatSchedule(scheduleData);
      setSelectedClassSchedule(formattedSchedule);
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
            type="date"
            placeholder="תאריך לידה"
            value={formData.birthDate || ""}
            onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
          />
          <input
            type="password"
            placeholder="סיסמה חדשה"
            value={formData.password || ""}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
          <input
            type="checkbox"
            checked={formData.ishomeroom || false}  // אם לא מוגדר, נחשב ל־false
            onChange={e => setFormData({ ...formData, ishomeroom: e.target.checked })}
          />
          <label>מחנכת?</label>
          <input
            type="text"
            placeholder="כיתות (מופרדות בפסיקים)"
            value={formData.classes || ""}
            onChange={e =>
              setFormData({
                ...formData,
                classes: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
              })
            }
          />

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
          <input
            type="text"
            placeholder="שם כיתה"
            value={formData.name || ""}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input type="text" 
          placeholder="ת''ז מחנכת"
          value={formData.homeroomTeacher || ""}
          onChange={e => setFormData({ ...formData, homeroomTeacher: e.target.value })}
          required
          />
          <input type="text" 
          placeholder="ת''ז תלמידים (מופרדים בפסיקים)"
          value={formData.students || ""}
          onChange={e => setFormData({ ...formData, students: e.target.value })}
          />
          <button className="btn btn-primary" type="submit" onClick={handleAddClass}>שמור</button>
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
                  checked={formData.classes?.includes(cls._id) || false}
                  onChange={e => {
                    let updated = formData.classes || [];
                    if (e.target.checked) {
                      updated = [...updated, cls._id];
                    } else {
                      updated = updated.filter(id => id !== cls._id);
                    }
                    setFormData({ ...formData, classes: updated });
                  }}
                />
                <span>{cls.name}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" type="submit">שמור</button>
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
    { id: "teachers", label: "ניהול מורות", icon: "👩‍🏫" },
    { id: "secretaries", label: "ניהול מזכירות", icon: "👩‍💼" },
    { id: "students", label: "ניהול תלמידים", icon: "👨‍🎓" },
    { id: "classes", label: "ניהול כיתות", icon: "🏫" },
    { id: "schedule", label: "מערכת שעות", icon: "📅" },
    { id: "events", label: "אירועים", icon: "🎉" },
    { id: "absences", label: "בקשות היעדרות", icon: "📝" },
    { id: "settings", label: "הגדרות בית ספר", icon: "⚙️" },
  ];

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
                  <p>מורות</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👩‍💼</div>
                <div className="stat-info">
                  <h3>{secretaries.length}</h3>
                  <p>מזכירות</p>
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
              <h3>פעילות אחרונה</h3>
              <div className="activity-list">
                {events.slice(0, 3).map((event, idx) => (
                  <div className="activity-item" key={event._id || idx}>
                    <span className="activity-time">{event.date ? new Date(event.date).toLocaleDateString('he-IL') : "לא ידוע"}</span>
                    <span className="activity-text">{event.title || event.description || "אירוע"} - כיתות: {event.classes?.map(c => c.name).join(", ") || "לא צוין"}</span>
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
              <h2>ניהול מורות</h2>
              <button className="btn btn-primary" onClick={() => navigate("/register_user?role=teacher")}>
                הוסף מורה
              </button>
            </div>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
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
              <h2>ניהול מזכירות</h2>
              <button className="btn btn-primary" onClick={() => navigate("/register_user?role=secretary")}>
                הוסף מזכירה
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
                    <strong>מחנכת:</strong>{" "}
                    {cls.homeroomTeacher
                      ? `${cls.homeroomTeacher.firstName} ${cls.homeroomTeacher.lastName}`
                      : "-"}
                  </p>
                  <p>
                    <strong>מספר תלמידים:</strong>{" "}
                    {cls.students ? cls.students.length : 0}
                  </p>

                  {/* עדכון מחנכת */}
                  <div className="form-inline">
                    <input
                      type="text"
                      placeholder="ת״ז מחנכת חדשה"
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
                {console.log(cls.name)}
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

                  {/* הוספת תלמיד */}
                  <div className="form-inline">
                    <input
                      type="text"
                      placeholder="ת״ז תלמיד להוספה"
                      value={formData[cls._id]?.newStudentId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [cls._id]: {
                            ...formData[cls._id],
                            newStudentId: e.target.value,
                          },
                        })
                      }
                    />
                    <button
                      className="btn-small btn-primary"
                      onClick={() =>
                        handleAddStudentToClass(
                          cls.name,
                          formData[cls._id]?.newStudentId
                        )
                      }
                    >
                      ➕
                    </button>
                  </div>

                  {/* הסרת תלמיד */}
                  <div className="form-inline">
                    <input
                      type="text"
                      placeholder="ת״ז תלמיד למחיקה"
                      value={formData[cls._id]?.removeStudentId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [cls._id]: {
                            ...formData[cls._id],
                            removeStudentId: e.target.value,
                          },
                        })
                      }
                    />
                    <button
                      className="btn-small btn-danger"
                      onClick={() =>
                        handleRemoveStudentFromClass(
                          cls.name,
                          formData[cls._id]?.removeStudentId
                        )
                      }
                    >
                     🗑️
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
          <div className="dashboard-content">
            <h2>מערכת שעות</h2>
            
            <div className="schedule-tabs">
              <button 
                className={`tab-button ${activeScheduleTab === 'teachers' ? 'active' : ''}`}
                onClick={() => setActiveScheduleTab('teachers')}
              >
                מערכת מורות
              </button>
              <button 
                className={`tab-button ${activeScheduleTab === 'classes' ? 'active' : ''}`}
                onClick={() => setActiveScheduleTab('classes')}
              >
                מערכת כיתות
              </button>
            </div>
            
            {activeScheduleTab === 'teachers' && (
              <div className="teachers-schedule-section">
                <div className="teacher-selector">
                  <label>בחר מורה:</label>
                  <select 
                    value={selectedTeacherId} 
                    onChange={(e) => {
                      setSelectedTeacherId(e.target.value);
                      if (e.target.value) loadTeacherSchedule(e.target.value);
                    }}
                  >
                    <option value="">בחר מורה...</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTeacherSchedule && renderTeacherSchedule()}
              </div>
            )}
            
            {activeScheduleTab === 'classes' && (
              <div className="classes-schedule-section">
                <div className="class-selector">
                  <label>בחר כיתה:</label>
                  <select 
                    value={selectedClassId} 
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      if (e.target.value) loadClassSchedule(e.target.value);
                    }}
                  >
                    <option value="">בחר כיתה...</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedClassSchedule && renderClassSchedule()}
              </div>
            )}
          </div>
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
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>סוג</th>
                    <th>כותרת</th>
                    <th>הערות</th>
                    <th>תאריך</th>
                    <th>שעת התחלה</th>
                    <th>שעת סיום</th>
                    <th>כיתות</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event._id}>
                      <td>{event.type}</td>
                      <td>{event.title}</td>
                      <td>{event.description || "-"}</td>
                      <td>{event.date}</td>
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
          </div>
        );

      case "absences":
        return (         
          <div className="dashboard-content">
            <h2>בקשות היעדרות</h2>

            {Array.isArray(absences) && absences.length === 0 ? (
              <p>אין בקשות היעדרות כרגע.</p>
            ) : (
              <div className="absence-requests">
                {console.log("absences", absences)}
                {absences.requests.map((absence) => {
                  // חישובי שדות בצורה עמידה במקרה שהשדות מגיעים בצורות שונות
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
                  const classesStr = Array.isArray(absence.classes) ? absence.classes.join(", ") : (absence.classes || "-");
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
                        <p><strong>כיתות מושפעות:</strong> {classesStr}</p>
                        <p><strong>מחליף:</strong> {substituteName}</p>
                        {absence.notes && <p><strong>הערות נוספות:</strong> {absence.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  {console.log("me.schoolId:", me.schoolId)}
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

  // רנדר מערכת שעות מורה
  const renderTeacherSchedule = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
    const dayLabels = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];
    const schoolHours = me?.schoolId?.scheduleHours || [];
    const maxLessons = schoolHours.length;

    return (
      <div className="schedule-container">
        <div className="schedule-table">
          <table>
            <thead>
              <tr>
                <th></th>
                {dayLabels.map((label, idx) => <th key={idx}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxLessons }).map((_, hourIdx) => {
                const hourInfo = schoolHours[hourIdx];
                return (
                  <tr key={hourIdx}>
                    <td className="time-slot">
                      <div className="hour-info">
                        <div className="hour-number">שעה {hourIdx + 1}</div>
                        {hourInfo && (
                          <div className="hour-time">({hourInfo.start} - {hourInfo.end})</div>
                        )}
                      </div>
                    </td>
                    {days.map((day, dayIdx) => {
                      const lesson = selectedTeacherSchedule.weekPlan[day]?.find(l => l.lessonNumber === hourIdx + 1) || null;
                      return (
                        <td key={dayIdx} className={`class-slot ${lesson ? "" : "empty"}`}>
                          {lesson ? (
                            <>
                              <strong>{lesson.subject || "—"}</strong><br />
                              <small>
                                {lesson.classId
                                  ? `כיתה ${lesson.classId.name}` 
                                  : "—"}
                              </small>
                            </>
                          ) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // רנדר מערכת שעות כיתה
  const renderClassSchedule = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
    const dayLabels = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];
    const schoolHours = me?.schoolId?.scheduleHours || [];
    const maxLessons = schoolHours.length;

    return (
      <div className="schedule-container">
        <div className="schedule-table">
          <table>
            <thead>
              <tr>
                <th></th>
                {dayLabels.map((label, idx) => <th key={idx}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxLessons }).map((_, hourIdx) => {
                const hourInfo = schoolHours[hourIdx];
                return (
                  <tr key={hourIdx}>
                    <td className="time-slot">
                      <div className="hour-info">
                        <div className="hour-number">שעה {hourIdx + 1}</div>
                        {hourInfo && (
                          <div className="hour-time">({hourInfo.start} - {hourInfo.end})</div>
                        )}
                      </div>
                    </td>
                    {days.map((day, dayIdx) => {
                      const lesson = selectedClassSchedule.weekPlan[day]?.find(l => l.lessonNumber === hourIdx + 1) || null;
                      return (
                        <td key={dayIdx} className={`class-slot ${lesson ? "" : "empty"}`}>
                          {lesson ? (
                            <>
                              <strong>{lesson.subject || "—"}</strong><br />
                              <small>
                                {lesson.teacherId
                                  ? `${lesson.teacherId.firstName || ''} ${lesson.teacherId.lastName || lesson.teacherId}`
                                  : "—"}
                              </small>
                            </>
                          ) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // מודאל דינמי
  const renderModal = () => {
    if (!showModal) return null;
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === "addTeacher" && "הוספת מורה חדשה"}
              {modalType === "editTeacher" && "עריכת מורה"}
              {modalType === "addSecretary" && "הוספת מזכירה חדשה"}
              {modalType === "editSecretary" && "עריכת מזכירה"}
              {modalType === "addStudent" && "הוספת תלמיד חדש"}
              {modalType === "editStudent" && "עריכת תלמיד"}
              {modalType === "addClass" && "הוספת כיתה חדשה"}
              {modalType === "editClass" && "עריכת כיתה"}
              {modalType === "addEvent" && "הוספת אירוע חדש"}
              {modalType === "editEvent" && "עריכת אירוע"}
              {modalType === "editSchool" && "עריכת הגדרות בית ספר"}
              {modalType === "deleteSchool" && "מחיקת בית ספר"}
            </h3>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
          <div className="modal-body">
            {renderModalForm()}
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
          <p>פאנל מנהלת</p>
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
            <button className="btn btn-outline">הודעות</button>
            <button className="btn btn-primary">צ'אט</button>
            {me?.schoolId?.address && <SchoolDirectionsButton schoolAddress={me.schoolId.address} />}
          </div>
        </div> 
        {renderContent()}
      </div>
      {renderModal()}
    </div>
  );
};

export default AdminDashboard;