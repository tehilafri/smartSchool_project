import { useState, useEffect } from "react";
import "./Dashboard.css";
import { getAllTeachers, getAllStudents, getAllSecretaries, getMe, updateUser,registerUser, deleteUser } from "../../services/userService";
import { getAllClasses, createClass, addStudentToClass,getStudentsByName, removeStudentFromClass, deleteClass, updateHomeroomTeacher } from "../../services/classService";
import { getEvents, addEvent, deleteEvent, updateEvent } from "../../services/eventService";
import { getSubstituteRequests } from "../../services/substituteRequestsSercive";
// import { getSchoolSchedule } from "../../services/scheduleService";
import { getSchoolById, updateSchool, deleteSchool } from "../../services/schoolService";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";

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

  // // מחיקת בית ספר
  // const handleDeleteSchool = async () => {
  //   await deleteSchool(schoolInfo._id);
  //   closeModal();
  //   onLogout();
  // };

  // // עדכון הגדרות בית ספר
  // const handleUpdateSchool = async () => {
  //   await updateSchool(schoolInfo._id, formData);
  //   closeModal();
  //   fetchAllData();
  // };


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
      return (
        <form onSubmit={e => {
          e.preventDefault();
          handleUpdateSchool();
        }}>
          <input
            type="text"
            placeholder="שם בית הספר"
            value={formData.schoolName || ""}
            onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="כתובת"
            value={formData.address || ""}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
          />
          <input
            type="tel"
            placeholder="טלפון"
            value={formData.phone || ""}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="אימייל"
            value={formData.email || ""}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="time"
            placeholder="שעת התחלה"
            value={formData.startHour || ""}
            onChange={e => setFormData({ ...formData, startHour: e.target.value })}
          />
          <input
            type="time"
            placeholder="שעת סיום"
            value={formData.endHour || ""}
            onChange={e => setFormData({ ...formData, endHour: e.target.value })}
          />
          <button className="btn btn-primary" type="submit" onClick={handleUpdateSchool}>שמור</button>
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
                    <span className="activity-time">{event.date || "לא ידוע"}</span>
                    <span className="activity-text">{event.title || event.description || "אירוע"}</span>
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
              <button className="btn btn-primary" onClick={() => navigate("/register_user")}>
                הוסף מורה חדשה
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
                        <button className="btn-small btn-outline" onClick={() => openModal("editTeacher", teacher)}>עריכה</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteUser(teacher._id)}>מחיקה</button>
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
              <button className="btn btn-primary" onClick={() => navigate("/register_user")}>
                הוסף מזכירה חדשה
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
                        <button className="btn-small btn-outline" onClick={() => openModal("editSecretary", sec)}>עריכה</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteUser(sec._id)}>מחיקה</button>
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
              <button className="btn btn-primary" onClick={() => navigate("/register_user")}>
                הוסף תלמיד חדש
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
                        <button className="btn-small btn-outline" onClick={() => openModal("editStudent", student)}>עריכה</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteUser(student._id)}>מחיקה</button>
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
                      עדכן מחנכת
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
                      הוסף תלמיד
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
                      מחק תלמיד
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
            <div className="schedule-container">
              <div className="schedule-table">
                <table>
                  <thead>
                    <tr>
                      <th>שעה</th>
                      <th>ראשון</th>
                      <th>שני</th>
                      <th>שלישי</th>
                      <th>רביעי</th>
                      <th>חמישי</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(schedule) && schedule.length > 0 ? (
                      schedule.map((row, idx) => (
                        <tr key={idx}>
                          <td className="time-slot">{row.time}</td>
                          {row.days.map((cls, i) => (
                            <td key={i} className={`class-slot${cls ? "" : " empty"}`}>{cls || "הפסקה"}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>אין מערכת שעות זמינה</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
                            עריכה
                          </button>
                        )}
                        {event.type !== "exam" && (
                          <button className="btn-small btn-danger" onClick={() => handleDeleteEvent(event._id)}>
                            מחיקה
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
            <div className="settings-form">
              <div className="form-group">
                <label>שם בית הספר</label>
                <input
                  type="text"
                  value={schoolInfo?.schoolName || ""}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>כתובת</label>
                <input
                  type="text"
                  value={schoolInfo?.address || ""}
                  readOnly
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>טלפון</label>
                  <input
                    type="tel"
                    value={schoolInfo?.phone || ""}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>אימייל</label>
                  <input
                    type="email"
                    value={schoolInfo?.email || ""}
                    readOnly
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>שעת התחלה</label>
                  <input
                    type="time"
                    value={schoolInfo?.startHour || ""}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>שעת סיום</label>
                  <input
                    type="time"
                    value={schoolInfo?.endHour || ""}
                    readOnly
                  />
                </div>
              </div>
              <div className="settings-actions">
                <button className="btn btn-primary" onClick={() => openModal("editSchool", schoolInfo)}>ערוך</button>
                <button className="btn btn-danger" onClick={() => openModal("deleteSchool")}>
                  מחק בית ספר
                </button>
              </div>
            </div>
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
        {me?.schoolId && <DashboardHeader schoolId={me.schoolId._id} />}
        <div className="dashboard-header">
          <h1>{me?.gender=="female"?"ברוכה הבאה": "ברוך הבא"}, {loadingMe ? "טוען..." : (me?.firstName )} {me?.lastName}</h1>
          <div className="header-actions">
            <button className="btn btn-outline">הודעות</button>
            <button className="btn btn-primary">צ'אט</button>
          </div>
        </div> 
        {renderContent()}
      </div>
      {renderModal()}
    </div>
  );
};

export default AdminDashboard;