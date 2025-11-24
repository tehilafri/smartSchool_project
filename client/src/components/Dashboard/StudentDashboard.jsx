import { useState, useEffect, useMemo } from "react";
import "./Dashboard.css";
import DashboardHeader from "./DashboardHeader";
import SchoolDirectionsButton from "../SchoolDirectionsButton";
import ScheduleTable from "./ScheduleTable";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUser } from "../../store/slices/userSlice";
import { fetchEvents } from "../../store/slices/schoolDataSlice";
import { fetchStudentSchedule, fetchNextLesson } from "../../store/slices/scheduleSlice";
import { getUpcomingExams } from "../../services/eventService";
import EventDetailsModal from "./EventDetailsModal";
import NextClassSection from "./NextClassSection";

const StudentDashboard = ({ onLogout }) => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const { currentUser: studentInfo } = useAppSelector((state) => state.user);
  const { events } = useAppSelector((state) => state.schoolData);
  const { studentSchedule: schedule, nextLesson } = useAppSelector((state) => state.schedule);
  
  const [activeSection, setActiveSection] = useState("overview");
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

   // הוספת class ל-body
  useEffect(() => {
    document.body.classList.add("sidebar-active");

    return () => {
      // מנקים את ה-class כשמורידים את הקומפוננטה
      document.body.classList.remove("sidebar-active");
    };
  }, []);

  // Load dashboard data דרך Redux
 useEffect(() => {
  const fetchData = async () => {
    try {
      // טעינת נתוני המשתמש
      await dispatch(fetchCurrentUser());
      
      // טעינת מערכת שעות ושיעור הבא
      await dispatch(fetchStudentSchedule());
      await dispatch(fetchNextLesson({ userType: 'student' }));
      
      // טעינת אירועים
      await dispatch(fetchEvents());
      
      // מבחנים קרובים (עדיין לא ב-Redux)
      const examsData = await getUpcomingExams().catch(() => []);
      setUpcomingExams(examsData || []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  fetchData();
}, [dispatch]);




  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "nextClass", label: "השיעור הבא", icon: "⏰" },
    { id: "schedule", label: "המערכת שלי", icon: "📅" },
    { id: "exams", label: "מבחנים מתוכננים", icon: "📄" },
  ];

  // Memoized calculations to prevent unnecessary re-renders
  const todayLessonsRemaining = useMemo(() => {
    if (!schedule) return 0;
    const now = new Date();
    const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday'];
    const todayDay = daysOfWeek[now.getDay()];
    const todayLessons = schedule[todayDay] || [];
    
    return todayLessons.filter(lesson => {
      if (!lesson.subject || !lesson.startTime) return false;
      const [hour, minute] = lesson.startTime.split(':').map(Number);
      const lessonDate = new Date();
      lessonDate.setHours(hour, minute, 0, 0);
      return lessonDate >= now;
    }).length;
  }, [schedule]);

  const weeklyExamsCount = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOffset = today.getDay() === 6 ? 1 : 0;
    startOfWeek.setDate(today.getDate() - today.getDay() + (dayOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return upcomingExams.filter(exam => {
      const examDate = new Date(exam.date);
      examDate.setHours(0, 0, 0, 0);
      return examDate >= startOfWeek && examDate <= endOfWeek;
    }).length;
  }, [upcomingExams]);



  const sortedExams = useMemo(() => {
    return upcomingExams.sort((a, b) => {
      const dateA = new Date(a.date);
      dateA.setHours(0, 0, 0, 0);
      const dateB = new Date(b.date);
      dateB.setHours(0, 0, 0, 0);
      return dateA - dateB;
    });
  }, [upcomingExams]);

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-content">
            <h2>סקירה כללית</h2>

            {studentInfo && studentInfo.classes && studentInfo.classes[0] && (
              <div className="student-info-card">
                <div className="student-avatar">
                  <span className="avatar-text">
                    {studentInfo.firstName?.[0]}{studentInfo.lastName?.[0]}
                  </span>
                </div>
                <div className="student-details">
                  <h3>{studentInfo.firstName} {studentInfo.lastName}</h3>
                  <p>כיתה {studentInfo.classes[0]?.name} - תעודת זהות: {studentInfo.userId}</p>
                  <p>מחנכ/ת: {studentInfo.classes[0]?.homeroomTeacher?.firstName} {studentInfo.classes[0]?.homeroomTeacher?.lastName}</p>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>{todayLessonsRemaining}</h3>
                  <p>שיעורים נותרים היום</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <h3>{weeklyExamsCount}</h3>
                  <p>מבחנים עתידיים השבוע</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "nextClass":
        return (
          <NextClassSection 
            nextLesson={nextLesson?.nextLesson || nextLesson}
            loadingNextLesson={false} // התלמיד לא משתמש בלוגיקת הטעינה הזו
            userType="student"
            onNavigateToSchedule={() => setActiveSection("schedule")}
          />
        );

    case "schedule":
      return (
        <div className="dashboard-content">
          <h2>המערכת שלי</h2>
          {schedule ? (
            <ScheduleTable 
              schedule={schedule}
              events={events || []}
              userInfo={studentInfo}
              onEventClick={setSelectedEvent}
              isTeacherView={false}
            />
          ) : (
            <div className="loading-message">
              <p>טוען מערכת שעות...</p>
            </div>
          )}
        </div>
      );


      case "exams":
        
        return (
          <div className="dashboard-content">
            <h2>מבחנים</h2>
            <div className="exams-section">
              <h3>מבחני הכיתה</h3>
              <div className="exams-list">
                {sortedExams.length === 0 ? (
                  <p>אין מבחנים מתוכננים לכיתה.</p>
                ) : (
                  sortedExams.map((exam, idx) => {
                    return (
                      <div key={idx} className="exam-card upcoming">
                        <div className="exam-header">
                          <h4>{exam.title || exam.subject}</h4>
                          <span className="exam-date">
                            {new Date(exam.date).toLocaleDateString('he-IL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="exam-details">
                          <p><strong>מקצוע:</strong> {exam.subject || '—'}</p>
                          <p><strong>מורה:</strong> {exam.targetTeacher ? `${exam.targetTeacher.firstName} ${exam.targetTeacher.lastName}` : (exam.createdBy ? `${exam.createdBy.firstName} ${exam.createdBy.lastName}` : '—')}</p>
                          <p><strong>שעה:</strong> {exam.startTime || "—"} - {exam.endTime || "—"}</p>
                          {exam.notes && <p><strong>הערות מהמורה:</strong> {exam.notes}</p>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <div className="dashboard-content">תוכן יטען בהקדם...</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header" style={{marginTop: 70}}>
          <h2>Smart School</h2>
          <p>פאנל תלמיד</p>
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
        {studentInfo?.schoolId && <DashboardHeader schoolId={studentInfo.schoolId._id} onLogout={onLogout} />}
        <div className="dashboard-header">
          <h1>{studentInfo?.gender=="female"?"ברוכה הבאה": "ברוך הבא"}, {studentInfo?.firstName} {studentInfo?.lastName}</h1>
          <div className="header-actions">
            {studentInfo?.schoolId?.address && <SchoolDirectionsButton schoolAddress={studentInfo.schoolId.address} />}
          </div>
        </div>
        {renderContent()}
        
        {/* Event Details Modal */}
        <EventDetailsModal 
          selectedEvent={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      </div>
    </div>
  );
};

export default StudentDashboard;
