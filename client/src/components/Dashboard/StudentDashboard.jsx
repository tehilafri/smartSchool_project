import { useState, useEffect } from "react";
import "./Dashboard.css";
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
      console.log("schedule", scheduleData);
      setNextLesson(nextLessonData?.nextLesson || null);
      console.log("nextLesson", nextLesson);
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
                      startOfWeek.setDate(today.getDate() - today.getDay());
                      startOfWeek.setHours(0, 0, 0, 0);
                      const endOfWeek = new Date(startOfWeek);
                      endOfWeek.setDate(startOfWeek.getDate() + 6);
                      endOfWeek.setHours(23, 59, 59, 999);
                      
                      return upcomingExams.filter(exam => {
                        const examDate = new Date(exam.date);
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
                  <span className="time-remaining">{nextLesson.timeRemaining}</span>
                </div>
                <div className="next-class-details">
                  <div className="detail-item"><span className="detail-label">מורה:</span> <span className="detail-value">{nextLesson.teacherId?.firstName} {nextLesson.teacherId?.lastName}</span></div>
                  <div className="detail-item"><span className="detail-label">שעה:</span> <span className="detail-value">{nextLesson.startTime} - {nextLesson.endTime}</span></div>
                  <div className="detail-item"><span className="detail-label">מקצוע:</span> <span className="detail-value">{nextLesson.subject}</span></div>
                </div>
              </div>
            ) : (
                <p>אין לך עוד שיעורים היום</p>
              )}
            
            {nextLesson && (
              <div className="upcoming-lessons-section">
                <h3>שיעורים באים</h3>
                {nextLesson?.upcomingLessons && nextLesson.upcomingLessons.length > 0 ? (
                  <div className="upcoming-lessons-list">
                    {nextLesson.upcomingLessons.map((lesson, idx) => (
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
                )}
              </div>
            )}
          </div>
        );

    case "schedule":
      return (
        <div className="dashboard-content">
          <h2>המערכת שלי</h2>
          <div className="schedule-container">
            <div className="schedule-table">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>ראשון</th>
                    <th>שני</th>
                    <th>שלישי</th>
                    <th>רביעי</th>
                    <th>חמישי</th>
                  </tr>
                </thead>
                <tbody>
                  {/** יוצרים שורות לפי מספר השעות המקסימלי */}
                  {Array.from({ length: studentInfo?.schoolId?.scheduleHours.length || 0 }).map((_, hourIdx) => {
                    const hourInfo = studentInfo?.schoolId?.scheduleHours?.[hourIdx];
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
                        {["sunday", "monday", "tuesday", "wednesday", "thursday"].map((day, dayIdx) => {
                          // חיפוש השיעור לפי lessonNumber במקום אינדקס
                          const lesson = schedule[day]?.find(l => l.lessonNumber === hourIdx + 1) || null;
                          const hasLesson = lesson && (lesson.subject || lesson.teacherId);
                          
                          // חיפוש אירועים לתא זה
                          const slotEvents = events.filter(event => {
                            if (!hourInfo || event.type === 'exam') return false;
                            
                            const today = new Date();
                            const startOfWeek = new Date(today);
                            startOfWeek.setDate(today.getDate() - today.getDay());
                            startOfWeek.setHours(0, 0, 0, 0);
                            
                            const targetDate = new Date(startOfWeek);
                            targetDate.setDate(startOfWeek.getDate() + dayIdx);
                            
                            const eventDate = new Date(event.date);
                            eventDate.setHours(0, 0, 0, 0);
                            
                            const isSameDate = eventDate.getTime() === targetDate.getTime();
                            const isTimeOverlap = event.startTime <= hourInfo.end;
                            
                            // בדיקה אם האירוע שייך לכיתת התלמיד
                            const studentClass = studentInfo?.classes?.[0];
                            const isMyClassEvent = studentClass && event.classes?.some(cls => cls._id === studentClass._id);
                            
                            return isSameDate && isTimeOverlap && isMyClassEvent;
                          });
                          
                          // חיפוש מבחנים לתא זה
                          const slotExams = events.filter(event => {
                            if (!hourInfo || event.type !== 'exam') return false;
                            
                            const today = new Date();
                            const startOfWeek = new Date(today);
                            startOfWeek.setDate(today.getDate() - today.getDay());
                            startOfWeek.setHours(0, 0, 0, 0);
                            
                            const targetDate = new Date(startOfWeek);
                            targetDate.setDate(startOfWeek.getDate() + dayIdx);
                            
                            const eventDate = new Date(event.date);
                            eventDate.setHours(0, 0, 0, 0);
                            
                            const isSameDate = eventDate.getTime() === targetDate.getTime();
                            const isLessonMatch = event.selectedLessons ? 
                              event.selectedLessons.includes(hourIdx + 1) : 
                              (event.startTime <= hourInfo.end && event.endTime >= hourInfo.start);
                            
                            // בדיקה אם המבחן שייך לכיתת התלמיד
                            const studentClass = studentInfo?.classes?.[0];
                            const isMyClassExam = studentClass && event.classes?.some(cls => cls._id === studentClass._id);
                            
                            return isSameDate && isLessonMatch && isMyClassExam;
                          });
                          
                          const hasEvents = slotEvents.length > 0;
                          
                          return (
                            <td key={day} className={`class-slot ${hasLesson ? "" : "empty"} ${hasEvents ? "has-events" : ""}`}>
                              {hasLesson ? (
                                <>
                                  <strong>{lesson.subject}</strong><br/>
                                  <small>
                                    {lesson.substitute ? (
                                      <span style={{color: '#f6ad55'}}>מחליף: {lesson.substitute.firstName} {lesson.substitute.lastName}</span>
                                    ) : lesson.teacherId ? (
                                      `${lesson.teacherId.firstName} ${lesson.teacherId.lastName}`
                                    ) : "---"}
                                  </small>
                                  {lesson.status === 'replaced' && (
                                    <div style={{fontSize: '10px', color: '#f6ad55', marginTop: '2px'}}>
                                      מוחלף
                                    </div>
                                  )}
                                  {hasEvents && (
                                    <div className="slot-events">
                                      {slotEvents.map((event, idx) => (
                                        <div key={idx} className={`event-indicator ${event.type}`}>
                                          <div>{event.type === 'exam' ? '📄' : '🎯'} {event.title}</div>
                                          <small className="event-classes">כיתות משתתפות: {event.classes?.map(c => c.name).join(', ') || 'כיתה לא ידועה'}</small>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {slotExams.length > 0 && (
                                    <div className="slot-exams">
                                      {slotExams.map((exam, idx) => (
                                        <div key={idx} className="exam-indicator">
                                          📄 {exam.title}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (() => {
                                if (hasEvents || slotExams.length > 0) {
                                  return (
                                    <>
                                      {hasEvents && (
                                        <div className="slot-events">
                                          {slotEvents.map((event, idx) => (
                                            <div key={idx} className={`event-indicator ${event.type}`}>
                                              {event.type === 'exam' ? '📄' : '🎯'} {event.title}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {slotExams.length > 0 && (
                                        <div className="slot-exams">
                                          {slotExams.map((exam, idx) => (
                                            <div key={idx} className="exam-indicator">
                                              📄 {exam.title}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  );
                                }
                                return "—";
                              })()}
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
        </div>
      );


      case "exams":
        // שימוש ב-upcomingExams שכבר כולל את פרטי המורה
        const classExams = upcomingExams.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
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
        <div className="sidebar-header">
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

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>{studentInfo?.gender=="female"?"ברוכה הבאה": "ברוך הבא"}, {studentInfo?.firstName} {studentInfo?.lastName}</h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default StudentDashboard;
