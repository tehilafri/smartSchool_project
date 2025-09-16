import { useState, useEffect } from "react";
import "./Dashboard.css";
import {
  getNextLessonForStudent,
  getScheduleForStudent
} from "../../services/scheduleService";
import {
  getUpcomingExams
} from "../../services/eventService";
import { getMe } from "../../services/userService"; // הוספנו את השירות הזה

const StudentDashboard = ({ token, onLogout }) => {
  const [activeSection, setActiveSection] = useState("overview");

  // States
  const [nextLesson, setNextLesson] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);

  // Load dashboard data
 useEffect(() => {
  const fetchData = async () => {
    try {
      // מביאים את כל הנתונים בו זמנית
      const nextLessonPromise = getNextLessonForStudent(token);
      const schedulePromise = getScheduleForStudent(token);
      const userPromise = getMe(token);

      const [nextLessonData, scheduleData, userResponse] = await Promise.all([
        nextLessonPromise,
        schedulePromise,
        userPromise
      ]);

      // בודקים אם התגובה קיימת
      if (!userResponse || !userResponse.data) {
        console.error("getMe returned undefined or has no data");
      }
      console.log("schedule", scheduleData);
      setNextLesson(nextLessonData);
      console.log("nextLesson", nextLesson);
      setSchedule(scheduleData?.weekPlan || {});
      setStudentInfo(userResponse?.data || null); // בטיחותי אם undefined

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  fetchData();
}, [token]);


  const menuItems = [
    { id: "overview", label: "סקירה כללית", icon: "📊" },
    { id: "nextClass", label: "השיעור הבא", icon: "⏰" },
    { id: "schedule", label: "המערכת שלי", icon: "📅" },
    { id: "exams", label: "מבחנים", icon: "📄" },
  ];

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
                  <h3>{nextLesson?.todayLessonsCount || 0}</h3>
                  <p>שיעורים היום</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <h3>{upcomingExams.length}</h3>
                  <p>מבחנים השבוע</p>
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
                  <div className="detail-item"><span className="detail-label">מורה:</span> <span className="detail-value">{nextLesson.teacher}</span></div>
                  <div className="detail-item"><span className="detail-label">שעה:</span> <span className="detail-value">{nextLesson.startTime} - {nextLesson.endTime}</span></div>
                  <div className="detail-item"><span className="detail-label">כיתה:</span> <span className="detail-value">{nextLesson.classroom}</span></div>
                  <div className="detail-item"><span className="detail-label">נושא:</span> <span className="detail-value">{nextLesson.topic}</span></div>
                </div>
              </div>
            ) : (
                <p>אין לך עוד שיעורים היום</p>
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
                  {Array.from({ length: studentInfo?.schoolId?.scheduleHours.length || 0 }).map((_, hourIdx) => (
                    <tr key={hourIdx}>
                      <td className="time-slot">{`שעה ${hourIdx + 1}`}</td>
                      {["sunday", "monday", "tuesday", "wednesday", "thursday"].map(day => {
                        const lesson = schedule[day]?.[hourIdx] || null;
                        return (
                          <td key={day} className={`class-slot ${lesson ? "" : "empty"}`}>
                            {lesson ? (
                              <>
                                {lesson.subject}<br/>
                                <small>
                                  {lesson.teacherId
                                    ? `${lesson.teacherId.firstName} ${lesson.teacherId.lastName}`
                                    : "---"}
                                </small>
                              </>
                            ) : "---"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );


      case "exams":
        return (
          <div className="dashboard-content">
            <h2>מבחנים</h2>
            <div className="exams-section">
              <h3>מבחנים קרובים</h3>
              <div className="exams-list">
                {upcomingExams.map((exam, idx) => (
                  <div key={idx} className="exam-card upcoming">
                    <div className="exam-header">
                      <h4>{exam.subject}</h4>
                      <span className="exam-date">{exam.date}</span>
                    </div>
                    <div className="exam-details">
                      <p><strong>מורה:</strong> {exam.teacher}</p>
                      <p><strong>שעה:</strong> {exam.startTime} - {exam.endTime}</p>
                      <p><strong>נושא:</strong> {exam.topic}</p>
                    </div>
                  </div>
                ))}
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
          <h1>ברוך הבא, {studentInfo?.firstName} {studentInfo?.lastName}</h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default StudentDashboard;
