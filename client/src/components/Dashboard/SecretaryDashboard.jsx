import { useState, useEffect, useState as useState2 } from "react"
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import SchoolDirectionsButton from "../SchoolDirectionsButton";
import { getMe, getAllStudents, updateUser, deleteUser } from "../../services/userService";
import { getAllClasses, addStudentToClass, removeStudentFromClass, updateHomeroomTeacher } from "../../services/classService";
import { getEvents, addEvent, deleteEvent, updateEvent } from "../../services/eventService";
import { getAllExternalSubstitutes, addExternalSubstitute, deleteExternalSubstitute, updateExternalSubstitute } from "../../services/externalSubstituteService";
import "./Dashboard.css"

const SecretaryDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview")
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("")
  const [modalData, setModalData] = useState(null)
  const [formData, setFormData] = useState({})
  const [me, setMe] = useState2(null);
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [events, setEvents] = useState([])
  const [substitutes, setSubstitutes] = useState([])

  const fetchAllData = async () => {
    try {
      const [meRes, studentsRes, classesRes, eventsRes, substitutesRes] = await Promise.all([
        getMe(),
        getAllStudents(),
        getAllClasses(),
        getEvents(),
        getAllExternalSubstitutes()
      ]);
      setMe(meRes?.data);
      setStudents(studentsRes?.data || []);
      setClasses(classesRes || []);
      setEvents(eventsRes || []);
      setSubstitutes(substitutesRes || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "students", label: "ניהול תלמידים", icon: "👨🎓" },
    { id: "events", label: "ניהול אירועים", icon: "🎉" },
    { id: "classes", label: "ניהול כיתות", icon: "🏫" },
    { id: "substitutes", label: "ממלאי מקום", icon: "🔄" },
    { id: "calendar", label: "יומן בית ספרי", icon: "📅" },
    { id: "reports", label: "דוחות", icon: "📈" },
  ]

  const openModal = (type, data = null) => {
    if (data?.date) {
      data.date = new Date(data.date).toISOString().split("T")[0];
    }
    if (data?.startTime) {
      data.startTime = data.startTime.slice(0,5);
    }
    if (data?.endTime) {
      data.endTime = data.endTime.slice(0,5);
    }
    if (data?.classes) {
      data.classes = data.classes.map(c => c._id);
    }
    setModalType(type)
    setModalData(data)
    setFormData(data || {})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalType("")
    setModalData(null)
    setFormData({})
  }

  const handleDeleteUser = async (id) => {
    await deleteUser(id);
    fetchAllData();
  };

  const handleUpdateUser = async (id) => {
    await updateUser(id, formData);
    closeModal();
    fetchAllData();
  };

  const handleAddEvent = async () => {
    await addEvent(formData);
    closeModal();
    fetchAllData();
  };

  const handleUpdateEvent = async (id) => {
    await updateEvent(id, formData);
    closeModal();
    fetchAllData();
  };

  const handleDeleteEvent = async (id) => {
    await deleteEvent(id);
    fetchAllData();
  };

  const handleAddExternalSubstitute = async () => {
    await addExternalSubstitute(formData);
    closeModal();
    fetchAllData();
  };

  const handleUpdateExternalSubstitute = async (id) => {
    await updateExternalSubstitute(id, formData);
    closeModal();
    fetchAllData();
  };

  const handleDeleteExternalSubstitute = async (identityNumber) => {
    await deleteExternalSubstitute(identityNumber);
    fetchAllData();
  };

  const handleAddStudentToClass = async (className, studentId) => {
    await addStudentToClass({className, studentId});
    closeModal();
    fetchAllData();
  };

  const handleRemoveStudentFromClass = async (className, studentId) => {
    await removeStudentFromClass({className, studentId});
    closeModal();
    fetchAllData();
  };

  const handleUpdateHomeroomTeacher = async (className, teacherId) => {
    await updateHomeroomTeacher({className, teacherId});
    closeModal();
    fetchAllData();
  };

  const renderModalForm = () => {
    if (modalType === "editStudent") {
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
          <button className="btn btn-primary" type="submit">שמור</button>
        </form>
      );
    }
    if (modalType === "addEvent" || modalType === "editEvent") {
      return (
        <form onSubmit={e => {
          e.preventDefault();
          modalType === "addEvent" ? handleAddEvent() : handleUpdateEvent(modalData._id);
        }}>
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
          <input
            type="time"
            value={formData.startTime || ""}
            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
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
    if (modalType === "addSubstitute" || modalType === "editSubstitute") {
      return (
        <form onSubmit={e => {
          e.preventDefault();
          modalType === "addSubstitute" ? handleAddExternalSubstitute() : handleUpdateExternalSubstitute(modalData.identityNumber);
        }}>
          <input
            type="text"
            placeholder="שם פרטי"
            value={formData.firstName || ""}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="שם משפחה"
            value={formData.lastName || ""}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="תעודת זהות"
            value={formData.identityNumber || ""}
            onChange={e => setFormData({ ...formData, identityNumber: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="אימייל"
            value={formData.email || ""}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="טלפון"
            value={formData.phone || ""}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
          <input
            type="text"
            placeholder="מקצועות (מופרדים בפסיקים)"
            value={formData.subjects ? formData.subjects.join(", ") : ""}
            onChange={e => setFormData({ ...formData, subjects: e.target.value.split(",").map(s => s.trim()) })}
          />
          <button className="btn btn-primary" type="submit">שמור</button>
        </form>
      );
    }
    return <p>טופס זה יפותח בקרוב...</p>;
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-content">
            <h2>סקירה כללית</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👨🎓</div>
                <div className="stat-info">
                  <h3>{students.length}</h3>
                  <p>תלמידים</p>
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
                <div className="stat-icon">🎉</div>
                <div className="stat-info">
                  <h3>{events.length}</h3>
                  <p>אירועים</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <h3>{substitutes.length}</h3>
                  <p>ממלאי מקום</p>
                </div>
              </div>
            </div>

            <div className="secretary-quick-actions">
              <h3>פעולות מהירות</h3>
              <div className="quick-actions-grid">
                <button className="quick-action-card" onClick={() => navigate("/register_user?role=student")}>
                  <span className="action-icon">👨🎓</span>
                  <span className="action-text">הוסף תלמיד</span>
                </button>
                <button className="quick-action-card" onClick={() => openModal("addEvent")}>
                  <span className="action-icon">🎉</span>
                  <span className="action-text">הוסף אירוע</span>
                </button>
                <button className="quick-action-card" onClick={() => openModal("addSubstitute")}>
                  <span className="action-icon">🔄</span>
                  <span className="action-text">הוסף ממלא מקום</span>
                </button>
                <button className="quick-action-card" onClick={() => setActiveSection("classes")}>
                  <span className="action-icon">🏫</span>
                  <span className="action-text">נהל כיתות</span>
                </button>
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
        )

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
                    <th>שם התלמיד</th>
                    <th>כיתה</th>
                    <th>תעודת זהות</th>
                    <th>אימייל</th>
                    <th>טלפון</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.firstName} {student.lastName}</td>
                      <td>{student.classes ? student.classes.map(cls => cls.name).join(", ") : "-"}</td>
                      <td>{student.userId}</td>
                      <td>{student.email || "-"}</td>
                      <td>{student.phone || "-"}</td>
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
        )

      case "events":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ניהול אירועים</h2>
              <button className="btn btn-primary" onClick={() => openModal("addEvent")}>
                הוסף אירוע
              </button>
            </div>

            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>סוג</th>
                    <th>כותרת</th>
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
                      <td>{new Date(event.date).toLocaleDateString('he-IL')}</td>
                      <td>{event.startTime}</td>
                      <td>{event.endTime}</td>
                      <td>{event.classes?.map(c => c.name).join(", ") || "-"}</td>
                      <td>
                        {event.type !== "exam" && (
                          <button className="btn-small btn-outline" onClick={() => openModal("editEvent", event)}>✏️</button>
                        )}
                        {event.type !== "exam" && (
                          <button className="btn-small btn-danger" onClick={() => handleDeleteEvent(event._id)}>🗑️</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "classes":
        return (
          <div className="dashboard-content">
            <h2>ניהול כיתות</h2>

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
                      ➖
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "substitutes":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ממלאי מקום</h2>
              <button className="btn btn-primary" onClick={() => openModal("addSubstitute")}>
                הוסף ממלא מקום
              </button>
            </div>

            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>ת"ז</th>
                    <th>טלפון</th>
                    <th>אימייל</th>
                    <th>מקצועות</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {substitutes.map((substitute) => (
                    <tr key={substitute._id}>
                      <td>{substitute.firstName} {substitute.lastName}</td>
                      <td>{substitute.identityNumber}</td>
                      <td>{substitute.phone || "-"}</td>
                      <td>{substitute.email}</td>
                      <td>{substitute.subjects ? substitute.subjects.join(", ") : "-"}</td>
                      <td>
                        <button className="btn-small btn-outline" onClick={() => openModal("editSubstitute", substitute)}>✏️</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteExternalSubstitute(substitute.identityNumber)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      default:
        return (
          <div className="dashboard-content">
            <h2>{menuItems.find((item) => item.id === activeSection)?.label}</h2>
            <p>תוכן זה יפותח בקרוב...</p>
          </div>
        )
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header" style={{marginTop: 70}}>
          <h2>Smart School</h2>
          <p>פאנל מזכירה</p>
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
        {me?.schoolId && <DashboardHeader schoolId={me.schoolId._id || me.schoolId} onLogout={onLogout} />}
        <div className="dashboard-header">
          <h1>ברוכה הבאה, {me?.firstName || "..."} {me?.lastName || ""}</h1>
          <div className="header-actions">
            <button className="btn btn-outline">הודעות</button>
            <button className="btn btn-primary">צ'אט</button>
            {me?.schoolId?.address && <SchoolDirectionsButton schoolAddress={me.schoolId.address} />}
          </div>
        </div>
        {renderContent()}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === "editStudent" && "עריכת תלמיד"}
                {modalType === "addEvent" && "הוספת אירוע חדש"}
                {modalType === "editEvent" && "עריכת אירוע"}
                {modalType === "addSubstitute" && "הוספת ממלא מקום"}
                {modalType === "editSubstitute" && "עריכת ממלא מקום"}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {renderModalForm()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecretaryDashboard