import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import DataTable from "./DataTable";
import ScheduleTable, { TeacherScheduleView } from "./ScheduleTable";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUser } from "../../store/slices/userSlice";
import { 
  fetchAllSchoolData,
  updateTeacher,
  updateStudent,
  addEvent as addEventToStore,
  updateEvent as updateEventInStore,
} from "../../store/slices/schoolDataSlice";
import { fetchTeacherSchedule, fetchClassSchedule } from "../../store/slices/scheduleSlice";
import { 
  fetchExternalSubstitutes,
  addExternalSubstituteThunk,
  updateExternalSubstituteThunk,
  removeExternalSubstituteThunk,
  addExternalSubstituteOptimistic,
  updateExternalSubstituteOptimistic,
  removeExternalSubstituteOptimistic
} from "../../store/slices/substituteSlice";
import { updateUser, deleteUser } from "../../services/userService";
import { addStudentToClass, removeStudentFromClass, getStudentsByName } from "../../services/classService";
import { addEvent, deleteEvent, updateEvent } from "../../services/eventService";
import api from "../../services/api"; // << add fallback API import
import { createClass, deleteClass, updateHomeroomTeacher } from "../../services/classService"; // <-- added
import SchoolDirectionsButton from "../SchoolDirectionsButton"; // <-- added


import ScheduleUpdateComponent from "./ScheduleUpdateComponent";
import EventDetailsModal from "./EventDetailsModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import "./Dashboard.css"

const SecretaryDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { currentUser: me } = useAppSelector((state) => state.user);
  const { teachers, students, classes, events } = useAppSelector((state) => state.schoolData);
  const { teacherSchedules, classSchedules } = useAppSelector((state) => state.schedule);
  const { externalSubstitutes: substitutes, loading: substituteLoading } = useAppSelector((state) => state.substitute);
  
  // Normalize substitutes into a predictable array regardless of shape returned by the store/backend
  const substitutesList = (() => {
    if (!substitutes) return [];
    if (Array.isArray(substitutes)) return substitutes;
    if (Array.isArray(substitutes.data)) return substitutes.data;
    if (Array.isArray(substitutes.list)) return substitutes.list;
    // fallback: if it's an object map -> values
    if (typeof substitutes === 'object') return Object.values(substitutes).filter(Boolean);
    return [];
  })();

  // local fallback in case Redux slice never populated or loading got stuck
  const [externalSubsFallback, setExternalSubsFallback] = useState([]);

  // Derive a reliable loading flag:
  // - If slice provides a boolean -> use it but only show loading when we have no data (store + fallback).
  // - If slice provides an object (e.g. { loading: true }) check common keys.
  // - Fallback: treat as loading only when substitutes is null/undefined and list empty.
  const substituteIsLoading = (() => {
    const hasAnyData = (substitutesList && substitutesList.length > 0) || (externalSubsFallback && externalSubsFallback.length > 0);
    if (typeof substituteLoading === 'boolean') {
      return substituteLoading && !hasAnyData;
    }
    if (substituteLoading && typeof substituteLoading === 'object') {
      if (typeof substituteLoading.loading === 'boolean') {
        return substituteLoading.loading && !hasAnyData;
      }
      if (typeof substituteLoading.isLoading === 'boolean') {
        return substituteLoading.isLoading && !hasAnyData;
      }
    }
    // fallback: show loading only when we have no data at all
    return (!substitutes && !hasAnyData);
  })();
  
  const [activeSection, setActiveSection] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeScheduleTab, setActiveScheduleTab] = useState('teachers');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showScheduleUpdate, setShowScheduleUpdate] = useState(false);
  const [scheduleUpdateTarget, setScheduleUpdateTarget] = useState({ type: null, id: null, name: null });
  
  // Modal control
  const openModal = (type, data = null) => {
    let modalDataCopy = data ? { ...data } : null;
    if (modalDataCopy?.date) {
      modalDataCopy.date = new Date(modalDataCopy.date).toISOString().split("T")[0];
    }
    if (modalDataCopy?.startTime) {
      modalDataCopy.startTime = modalDataCopy.startTime.slice(0,5);
    }
    if (modalDataCopy?.endTime) {
      modalDataCopy.endTime = modalDataCopy.endTime.slice(0,5);
    }
    if (modalDataCopy?.classes && Array.isArray(modalDataCopy.classes) && modalDataCopy.classes.length > 0) {
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

  const openScheduleUpdate = (type, id, name) => {
    setScheduleUpdateTarget({ type, id, name });
    setShowScheduleUpdate(true);
  };

  const closeScheduleUpdate = () => {
    setShowScheduleUpdate(false);
    setScheduleUpdateTarget({ type: null, id: null, name: null });
  };

  const handleScheduleUpdateSuccess = () => {
    if (scheduleUpdateTarget.type === 'class' && selectedClassId) {
      loadClassSchedule(selectedClassId);
    }
    closeScheduleUpdate();
  };
  
  // Computed values from Redux
  const selectedTeacherSchedule = selectedTeacherId ? teacherSchedules[selectedTeacherId]?.schedule : null;
  const selectedClassSchedule = selectedClassId ? classSchedules[selectedClassId]?.schedule : null;
  
  const [expandedClass, setExpandedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: '', item: null, action: null });
  
  // Schedule loading functions
  const loadTeacherSchedule = async (teacherId) => {
    await dispatch(fetchTeacherSchedule(teacherId));
  };
  
  const loadClassSchedule = async (classId) => {
    await dispatch(fetchClassSchedule(classId));
  };

  const fetchAllData = async () => {
    try {
      await dispatch(fetchCurrentUser());
      await dispatch(fetchAllSchoolData());
      await dispatch(fetchExternalSubstitutes());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Loading state check
  const isLoading = useAppSelector((state) => {
    return state.schoolData.loading.all || 
           state.schoolData.loading.teachers || 
           state.schoolData.loading.students || 
           state.schoolData.loading.classes || 
           state.schoolData.loading.events;
  });

  useEffect(() => {
    fetchAllData();
  }, [dispatch]);

  // If Redux didn't provide substitutes (or loading stuck), try a direct API call once
  useEffect(() => {
    let cancelled = false;
    const tryFetchFallback = async () => {
      // If we already have data from the store, no need to fetch fallback
      if ((substitutesList && substitutesList.length > 0) || (externalSubsFallback && externalSubsFallback.length > 0)) return;
      try {
        const res = await api.get('/externalSubstitutes');
        if (!cancelled && Array.isArray(res?.data)) {
          setExternalSubsFallback(res.data);
        }
      } catch (err) {
        // swallow - fallback only
        console.warn('Fallback fetch for external substitutes failed', err);
      }
    };

    // Trigger fallback fetch when the slice is not loading but there's no data
    if (!substituteIsLoading && substitutesList.length === 0 && externalSubsFallback.length === 0) {
      tryFetchFallback();
    }

    return () => { cancelled = true; };
  }, [substituteIsLoading, substitutesList, externalSubsFallback.length]);

  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "teachers", label: "ניהול מורות", icon: "👩🏫" },
    { id: "students", label: "ניהול תלמידים", icon: "👨" },
    { id: "events", label: "ניהול אירועים", icon: "🎉" },
    { id: "classes", label: "ניהול כיתות", icon: "🏫" },
    { id: "schedule", label: "מערכת שעות", icon: "📅" },
    { id: "substitutes", label: "ממלאי מקום", icon: "🔄" },
  ]

  // Memoized calculations to prevent unnecessary re-renders
  const nearestEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const sortedByDistance = events
      .filter(event => event && event.date)
      .map(event => ({
        ...event,
        distance: Math.abs(new Date(event.date).getTime() - today.getTime())
      }))
      .sort((a, b) => a.distance - b.distance);

    return sortedByDistance.slice(0, 3);
  }, [events]);

  const handleDeleteUser = async (id) => {
    const allUsers = [...(teachers || []), ...(students || [])];
    const user = allUsers.find(u => u._id === id);
    setConfirmDelete({
      show: true,
      type: 'user',
      item: user,
      action: async () => {
        try {
          await deleteUser(id);
          fetchAllData();
          setConfirmDelete({ show: false, type: '', item: null, action: null });
        } catch (err) {
          console.error('Error deleting user:', err);
        }
      }
    });
  };

  const handleUpdateUser = async (id) => {
    try {
      await updateUser(id, formData);
      fetchAllData();
      closeModal();
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const handleAddEvent = async () => {
    try {
      await addEvent(formData);
      fetchAllData();
      closeModal();
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  const handleUpdateEvent = async (id) => {
    try {
      await updateEvent(id, formData);
      fetchAllData();
      closeModal();
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    const event = (events || []).find(e => e._id === id);
    setConfirmDelete({
      show: true,
      type: 'event',
      item: event,
      action: async () => {
        try {
          await deleteEvent(event.eventId);
          fetchAllData();
          setConfirmDelete({ show: false, type: '', item: null, action: null });
        } catch (err) {
          console.error('Error deleting event:', err);
        }
      }
    });
  };

  const handleAddExternalSubstitute = async () => {
    try {
      await dispatch(addExternalSubstituteThunk(formData)).unwrap();
      closeModal();
    } catch (err) {
      console.error('Error adding substitute:', err);
    }
  };

  const handleUpdateExternalSubstitute = async (id) => {
    try {
      await dispatch(updateExternalSubstituteThunk({ id, data: formData })).unwrap();
      closeModal();
    } catch (err) {
      console.error('Error updating substitute:', err);
    }
  };

  const handleDeleteExternalSubstitute = async (idOrIdentityNumber) => {
    // גמישות בזיהוי - ייתכן ונקבל identityNumber או id/_id
    const findById = (s) => {
      return s.identityNumber === idOrIdentityNumber ||
             s.id === idOrIdentityNumber ||
             s._id === idOrIdentityNumber;
    };
    const substitute = (substitutesList || []).find(findById) || (externalSubsFallback || []).find(findById);
    setConfirmDelete({
      show: true,
      type: 'substitute',
      item: substitute,
      action: async () => {
        try {
          // העברת identityNumber אם קיימת, אחרת נסו id/_id
          const identityToDelete = substitute?.identityNumber || substitute?.id || substitute?._id || idOrIdentityNumber;
          await dispatch(removeExternalSubstituteThunk(identityToDelete)).unwrap();
          setConfirmDelete({ show: false, type: '', item: null, action: null });
        } catch (err) {
          console.error('Error deleting substitute:', err);
        }
      }
    });
  };

  const handleAddStudentToClass = async (className, studentId) => {
    await addStudentToClass({ className, studentId });
    closeModal();
    fetchAllData();
  };

  const handleRemoveStudentFromClass = async (className, studentId) => {
    await removeStudentFromClass({ className, studentId });
    closeModal();
    fetchAllData();
  };

  const handleExpandClass = async (classId) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
      setClassStudents([]);
    } else {
      setExpandedClass(classId);
      const className = (classes || []).find(c => c._id === classId)?.name;
      if (className) {
        const students = await getStudentsByName(className);
        setClassStudents(students || []);
      }
    }
  };

  // add class management functions (similar to AdminDashboard)
  const handleDeleteClass = async (className) => {
    const classToDelete = (classes || []).find(c => c.name === className);
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

  const handleAddClass = async () => {
    try {
      await createClass(formData);
      closeModal();
      fetchAllData();
    } catch (err) {
      console.error('Error adding class:', err);
    }
  };

  const handleUpdateHomeroomTeacher = async (className, teacherId) => {
    try {
      await updateHomeroomTeacher({ className, teacherId });
      closeModal();
      fetchAllData();
    } catch (err) {
      console.error('Error updating homeroom teacher:', err);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-content">
            <h2>סקירה כללית</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👩🏫</div>
                <div className="stat-info">
                  <h3>{teachers?.length || 0}</h3>
                  <p>מורות</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👨🎓</div>
                <div className="stat-info">
                  <h3>{students?.length || 0}</h3>
                  <p>תלמידים</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏫</div>
                <div className="stat-info">
                  <h3>{classes?.length || 0}</h3>
                  <p>כיתות</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎉</div>
                <div className="stat-info">
                  <h3>{nearestEvents?.length || 0}</h3>
                  <p>אירועים קרובים</p>
                </div>
              </div>
            </div>
            {nearestEvents && nearestEvents.length > 0 && (
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
            )}
          </div>
        );

      case "teachers":
        return (
          isLoading ? (
            <div className="dashboard-content">
              <div className="loading-message">טוען נתונים...</div>
            </div>
          ) : (
            <div className="dashboard-content">
              <div className="section-header">
                <h2>ניהול מורות</h2>
                <button className="btn btn-primary" onClick={() => navigate("/register_user?role=teacher")}>הוסף מורה</button> {/* <-- added */}
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>שם</th>
                      <th>אימייל</th>
                      <th>טלפון</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={teacher._id}>
                        <td>{teacher.firstName} {teacher.lastName}</td>
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
          )
        );

      case "students":
        return (
          isLoading ? (
            <div className="dashboard-content">
              <div className="loading-message">טוען נתונים...</div>
            </div>
          ) : (
            <div className="dashboard-content">
              <div className="section-header">
                <h2>ניהול תלמידים</h2>
                <button className="btn btn-primary" onClick={() => navigate("/register_user?role=student")}>הוסף תלמיד</button> {/* <-- added */}
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>שם</th>
                      <th>כיתה</th>
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
        );

      case "events":
        return (
          isLoading ? (
            <div className="dashboard-content">
              <div className="loading-message">טוען נתונים...</div>
            </div>
          ) : (
            <div className="dashboard-content">
              <div className="section-header">
                <h2>ניהול אירועים</h2>
                <button className="btn btn-primary" onClick={() => openModal("addEvent")}>הוסף אירוע חדש</button>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>סוג</th>
                      <th>כותרת</th>
                      <th>הערות</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event._id}>
                        <td>{event.date ? new Date(event.date).toLocaleDateString('he-IL') : "-"}</td>
                        <td>{event.type}</td>
                        <td>{event.title}</td>
                        <td>{event.description || "-"}</td>
                        <td>
                          <button className="btn-small btn-outline" onClick={() => openModal("editEvent", event)}>✏️</button>
                          <button className="btn-small btn-danger" onClick={() => handleDeleteEvent(event._id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        );

      case "classes":
        return (
          isLoading ? (
            <div className="dashboard-content">
              <div className="loading-message">טוען נתונים...</div>
            </div>
          ) : (
            <div className="dashboard-content">
              <div className="section-header">
                <h2>ניהול כיתות</h2>
                <button className="btn btn-primary" onClick={() => openModal("addClass")}>הוסף כיתה חדשה</button> {/* <-- replicate Admin UI */}
              </div>
              <div className="classes-grid">
                {(classes || []).map((cls) => (
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
                        placeholder="ת״ז מחנכת חדשה לשינוי"
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
                            setExpandedClass(null);
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
          )
        );

      case "substitutes":
        return (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>ממלאי מקום</h2>
              <button className="btn btn-primary" onClick={() => openModal("addSubstitute")}>הוסף ממלא מקום</button>
            </div>
            {substituteIsLoading ? (
              <div className="loading-message">טוען נתונים...</div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>שם</th>
                      <th>תעודת זהות</th>
                      <th>אימייל</th>
                      <th>טלפון</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((substitutesList && substitutesList.length > 0) ? substitutesList : externalSubsFallback).length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{textAlign: 'center'}}>אין ממלאי מקום רשומים</td>
                      </tr>
                    ) : (
                      ((substitutesList && substitutesList.length > 0) ? substitutesList : externalSubsFallback).map((substitute, idx) => {
                        // חשבון מפתח יציב - העדפה ל-identityNumber, אחר כך _id, ולבסוף אינדקס
                        const stableKey = substitute?.identityNumber || substitute?._id || substitute?.id || `sub-${idx}`;
                        const displayName = substitute?.firstName || substitute?.lastName
                          ? `${substitute.firstName || ''} ${substitute.lastName || ''}`.trim()
                          : (substitute?.name || "-");
                        const idNumber = substitute?.identityNumber || substitute?.id || substitute?._id || "-";
                        return (
                          <tr key={stableKey}>
                            <td>{displayName || "-"}</td>
                            <td>{idNumber}</td>
                            <td>{substitute?.email || "-"}</td>
                            <td>{substitute?.phone || "-"}</td>
                            <td>
                              <button className="btn-small btn-outline" onClick={() => openModal("editSubstitute", substitute)}>✏️</button>
                              <button className="btn-small btn-danger" onClick={() => handleDeleteExternalSubstitute(substitute.identityNumber || substitute.id || substitute._id)}>🗑️</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
                    {(teachers || []).map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTeacherSchedule && (
                  <TeacherScheduleView 
                    schedule={(() => {
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
                    })()} 
                    events={events || []}
                    teacherInfo={(teachers || []).find(t => t._id === selectedTeacherId)}
                    schoolInfo={me?.schoolId}
                    onEventClick={setSelectedEvent}
                  />
                )}
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
                    {(classes || []).map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedClassId && (
                  <>
                    {selectedClassSchedule ? (
                      <ScheduleTable 
                        schedule={(() => {
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
                        })()} 
                        events={(events || []).filter(event => {
                          const selectedClass = (classes || []).find(c => c._id === selectedClassId);
                          return selectedClass && event.classes?.some(cls => cls.name === selectedClass.name);
                        })}
                        userInfo={{
                          ...me,
                          classes: [(classes || []).find(c => c._id === selectedClassId)]
                        }}
                        onEventClick={setSelectedEvent}
                        isTeacherView={false}
                      />
                    ) : (
                      <div className="no-schedule-message">
                        <p>לא הוכנסה מערכת שעות לכיתה זו</p>
                      </div>
                    )}
                    <div className="schedule-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          const selectedClass = (classes || []).find(c => c._id === selectedClassId);
                          openScheduleUpdate('class', selectedClassId, selectedClass?.name);
                        }}
                      >
                        עדכן מערכת שעות
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="dashboard-content">
            <h2>{menuItems.find(item => item.id === activeSection)?.label}</h2>
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
              {modalType === "editTeacher" && "עריכת מורה"}
              {modalType === "editStudent" && "עריכת תלמיד"}
              {modalType === "addEvent" && "הוספת אירוע חדש"}
              {modalType === "editEvent" && "עריכת אירוע"}
              {modalType === "addSubstitute" && "הוספת ממלא מקום"}
              {modalType === "editSubstitute" && "עריכת ממלא מקום"}
            </h3>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
          <div className="modal-body">
            {(modalType === "editTeacher" || modalType === "editStudent") && (
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
            )}
            {(modalType === "addEvent" || modalType === "editEvent") && (
              <form onSubmit={e => {
                e.preventDefault();
                modalType === "addEvent" ? handleAddEvent() : handleUpdateEvent(modalData._id);
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
                <input
                  type="time"
                  placeholder="שעת התחלה"
                  value={formData.startTime || ""}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
                <input
                  type="time"
                  placeholder="שעת סיום"
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
                <button className="btn btn-primary" type="submit">שמור</button>
              </form>
            )}
            {(modalType === "addSubstitute" || modalType === "editSubstitute") && (
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
                />
                <input
                  type="tel"
                  placeholder="טלפון"
                  value={formData.phone || ""}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                <button className="btn btn-primary" type="submit">שמור</button>
              </form>
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
          <p>פאנל מזכירה</p>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
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
          <button className="btn btn-outline logout-btn" onClick={onLogout}>יציאה</button>
        </div>
      </div>
      
      <div className="dashboard-main" style={{paddingTop: 60}}>
        {me?.schoolId && <DashboardHeader schoolId={me.schoolId._id} onLogout={onLogout} />}
        <div className="dashboard-header">
          <h1>{me?.gender=="female"?"ברוכה הבאה": "ברוך הבא"}, {me?.firstName} {me?.lastName}</h1>
          <div className="header-actions">
            <button className="btn btn-outline">הודעות</button>
            <button className="btn btn-primary">צ'אט</button>
            {me?.schoolId?.address && <SchoolDirectionsButton schoolAddress={me.schoolId.address} />} {/* <-- added */}
          </div>
        </div>
        
        {renderContent()}
      </div>
      
      {renderModal()}
      
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
      
      {showScheduleUpdate && (
        <div className="modal-overlay" onClick={closeScheduleUpdate}>
          <div className="modal-content schedule-update-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>עדכון מערכת שעות - {scheduleUpdateTarget.name}</h3>
              <button className="modal-close" onClick={closeScheduleUpdate}>×</button>
            </div>
            <div className="modal-body">
              <ScheduleUpdateComponent
                targetClassName={scheduleUpdateTarget.type === 'class' ? scheduleUpdateTarget.name : null}
                onSuccess={handleScheduleUpdateSuccess}
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
      
      {confirmDelete.show && (
        <ConfirmDeleteModal
          isOpen={confirmDelete.show}
          onClose={() => setConfirmDelete({ show: false, type: '', item: null, action: null })}
          onConfirm={confirmDelete.action}
          title={`מחיקת ${confirmDelete.type === 'user' ? 'משתמש' : confirmDelete.type === 'event' ? 'אירוע' : confirmDelete.type === 'substitute' ? 'ממלא מקום' : 'כיתה'}`}
          message="האם אתה בטוח בביצוע הפעולה הנ'ל?"
          itemName={
            confirmDelete.item
              ? (
                  confirmDelete.type === 'user' ? `${confirmDelete.item.firstName} ${confirmDelete.item.lastName}` :
                  confirmDelete.type === 'event' ? (confirmDelete.item.title || '') :
                  confirmDelete.type === 'substitute' ? `${confirmDelete.item.firstName || ''} ${confirmDelete.item.lastName || ''}` :
                  (confirmDelete.item.name || '')
                )
              : ''
          }
        />
      )}
    </div>
  );
};

export default SecretaryDashboard;