import { useState, useEffect } from "react";
import "./Dashboard.css";
import DashboardHeader from "./DashboardHeader";
import SchoolDirectionsButton from "../SchoolDirectionsButton";
import ScheduleTable from "./ScheduleTable";
import {
  getNextLessonForStudent,
  getScheduleForStudent
} from "../../services/scheduleService";
import {
  getUpcomingExams,
  getEvents
} from "../../services/eventService";
import { getMe } from "../../services/userService";

const StudentDashboard = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState("overview");

   // הוספת class ל-body
  useEffect(() => {
    document.body.classList.add("sidebar-active");

    return () => {
      // מנקים את ה-class כשמורידים את הקומפוננטה
      document.body.classList.remove("sidebar-active");
    };
  }, []);

  // States
  const [nextLesson, setNextLesson] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load dashboard data
 useEffect(() => {
  const fetchData = async () => {
    try {
      // מביאים את כל הנתונים בו זמנית
      const nextLessonPromise = getNextLessonForStudent();
      const schedulePromise = getScheduleForStudent();
      const userPromise = getMe();
      const examsPromise = getUpcomingExams().catch(() => []);
      const eventsPromise = getEvents().catch(() => []);

      const [nextLessonData, scheduleData, userResponse, examsData, eventsData] = await Promise.all([
        nextLessonPromise,
        schedulePromise,
        userPromise,
        examsPromise,
        eventsPromise
      ]);

      // בודקים אם התגובה קיימת
      if (!userResponse || !userResponse.data) {
        console.error("getMe returned undefined or has no data");
      }
      setNextLesson(nextLessonData?.nextLesson || null);
      setSchedule(scheduleData?.weekPlan || {});
      setStudentInfo(userResponse?.data || null); // בטיחותי אם undefined
      setUpcomingExams(examsData || []);
      setEvents(Array.isArray(eventsData) ? eventsData : eventsData?.data ?? []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  fetchData();
}, []);


  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "nextClass", label: "השיעור הבא", icon: "⏰" },
    { id: "schedule", label: "המערכת שלי", icon: "📅" },
    { id: "exams", label: "מבחנים מתוכננים", icon: "📄" },
  ];

  console.log("----------", nextLesson);
  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-content">
            <h2>סקירה כללית</h2>

            {studentInfo && (
              <div className="student-info-card">
                <div className="student-avatar">
                  <span className="avatar-text">
                    {studentInfo.firstName[0]}{studentInfo.lastName[0]}
                  </span>
                </div>
                <div className="student-details">
                  <h3>{studentInfo.firstName} {studentInfo.lastName}</h3>
                  <p>כיתה {studentInfo.classes[0].name} - תעודת זהות: {studentInfo.userId}</p>
                  <p>מחנכת: {studentInfo.classes[0].homeroomTeacher.firstName} {studentInfo.classes[0].homeroomTeacher.lastName}</p>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>{
                    (() => {
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
                    })()
                  }</h3>
                  <p>שיעורים נותרים היום</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <h3>{
                    (() => {
                      const today = new Date();
                      const startOfWeek = new Date(today);
                       // אם היום שבת (6), הצג את השבוע הבא
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
                    })()
                  }</h3>
                  <p>מבחנים עתידיים השבוע</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "nextClass":
        return (
          <div className="dashboard-content">
            <h2>השיעור הבא</h2>
            {nextLesson ? (
              <div className="next-class-card">
                <div className="next-class-header">
                  <h3>{nextLesson.subject}</h3>
                  <span className="time-remaining">{
                    (() => {
                      const now = new Date();
                      const [hour, minute] = nextLesson.startTime.split(':').map(Number);
                      const lessonTime = new Date();
                      lessonTime.setHours(hour, minute, 0, 0);
                      
                      const diffMs = lessonTime - now;
                      const diffMinutes = Math.floor(diffMs / (1000 * 60));
                      
                      if (diffMinutes <= 0) return 'מתחיל עכשיו';
                      if (diffMinutes < 60) return `עוד ${diffMinutes} דקות`;
                      
                      const hours = Math.floor(diffMinutes / 60);
                      const remainingMinutes = diffMinutes % 60;
                      return remainingMinutes > 0 
                        ? `עוד ${hours} שעות ו-${remainingMinutes} דקות`
                        : `עוד ${hours} שעות`;
                    })()
                  }</span>
                </div>
                <div className="next-class-details">
                  <div className="detail-item"><span className="detail-label">מורה:</span> <span className="detail-value">{
                    (() => {
                      const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday'];
                      const todayDay = daysOfWeek[new Date().getDay()];
                      const todayLessons = schedule[todayDay] || [];
                      const matchingLesson = todayLessons.find(lesson => 
                        lesson.startTime === nextLesson.startTime && lesson.subject === nextLesson.subject
                      );
                      return matchingLesson?.teacherId?.firstName && matchingLesson?.teacherId?.lastName 
                        ? `${matchingLesson.teacherId.firstName} ${matchingLesson.teacherId.lastName}`
                        : 'לא ידוע';
                    })()
                  }</span></div>
                  <div className="detail-item"><span className="detail-label">שעה:</span> <span className="detail-value">{nextLesson.startTime} - {nextLesson.endTime}</span></div>
                  <div className="detail-item"><span className="detail-label">מקצוע:</span> <span className="detail-value">{nextLesson.subject}</span></div>
                </div>
              </div>
            ) : (
                <p>אין לך עוד שיעורים היום</p>
              )}
            
            {nextLesson && (
              <div className="upcoming-lessons-section">
                <h3>שיעורים נוספים היום</h3>
                {(() => {
                  const now = new Date();
                  const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday'];
                  const todayDay = daysOfWeek[now.getDay()];
                  const todayLessons = schedule[todayDay] || [];
                  
                  // מוצאים את כל השיעורים שעדיין לא התחילו
                  const allUpcomingLessons = todayLessons.filter(lesson => {
                    if (!lesson.subject || !lesson.startTime) return false;
                    const [hour, minute] = lesson.startTime.split(':').map(Number);
                    const lessonDate = new Date();
                    lessonDate.setHours(hour, minute, 0, 0);
                    return lessonDate > now;
                  }).sort((a, b) => {
                    // מסדרים לפי שעת התחלה
                    const timeA = a.startTime.split(':').map(Number);
                    const timeB = b.startTime.split(':').map(Number);
                    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                  });
                  
                  // מציגים רק את השיעורים שבאים אחרי השיעור הבא (ללא השיעור הבא עצמו)
                  const lessonsAfterNext = allUpcomingLessons.slice(1);
                  
                  return lessonsAfterNext.length > 0 ? (
                    <div className="upcoming-lessons-list">
                      {lessonsAfterNext.map((lesson, idx) => (
                        <div key={idx} className="upcoming-lesson-item">
                          <div className="lesson-time">{lesson.startTime} - {lesson.endTime}</div>
                          <div className="lesson-info">
                            <strong>{lesson.subject}</strong>
                            <small>עם {lesson.teacherId?.firstName} {lesson.teacherId?.lastName}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>אין עוד שיעורים היום</p>
                  );
                })()
                }
              </div>
            )}
          </div>
        );

    case "schedule":
      return (
        <div className="dashboard-content">
          <h2>המערכת שלי</h2>
          <ScheduleTable 
            schedule={schedule}
            events={events}
            userInfo={studentInfo}
            onEventClick={setSelectedEvent}
            isTeacherView={false}
          />
        </div>
      );


      case "exams":
        // שימוש ב-upcomingExams שכבר כולל את פרטי המורה
        const classExams = upcomingExams.sort((a, b) => {
          const dateA = new Date(a.date);
          dateA.setHours(0, 0, 0, 0);
          const dateB = new Date(b.date);
          dateB.setHours(0, 0, 0, 0);
          return dateA - dateB;
        });
        
        return (
          <div className="dashboard-content">
            <h2>מבחנים</h2>
            <div className="exams-section">
              <h3>מבחני הכיתה</h3>
              <div className="exams-list">
                {classExams.length === 0 ? (
                  <p>אין מבחנים מתוכננים לכיתה.</p>
                ) : (
                  classExams.map((exam, idx) => {
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
        {selectedEvent && (
          <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedEvent.type === 'exam' ? '📄' : '🎯'} {selectedEvent.title}</h3>
                <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="event-detail">
                  <strong>תאריך:</strong> {new Date(selectedEvent.date).toLocaleDateString('he-IL')}
                </div>
                <div className="event-detail">
                  <strong>שעה:</strong> {selectedEvent.startTime} - {selectedEvent.endTime}
                </div>
                {selectedEvent.subject && (
                  <div className="event-detail">
                    <strong>מקצוע:</strong> {selectedEvent.subject}
                  </div>
                )}
                <div className="event-detail">
                  <strong>כיתות:</strong> {selectedEvent.classes?.map(c => c.name).join(', ') || 'לא צוין'}
                </div>
                {selectedEvent.description && (
                  <div className="event-detail">
                    <strong>הערות:</strong>
                    <div className="event-description">{selectedEvent.description}</div>
                  </div>
                )}
                {selectedEvent.notes && (
                  <div className="event-detail">
                    <strong>הערות מהמורה:</strong>
                    <div className="event-notes">{selectedEvent.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
