import React from 'react';

const NextClassSection = ({ 
  nextLesson, 
  loadingNextLesson, 
  userType = 'teacher', // 'teacher' or 'student'
  onNavigateToSchedule 
}) => {
  const renderNextClass = () => {
    if (loadingNextLesson) return <p>טוען שיעור הבא...</p>;
    
    if (!nextLesson || !nextLesson.subject || Object.keys(nextLesson).length === 0) {
      return (
        <div className="next-class-card no-lessons">
          <div className="next-class-header">
            <h3>השיעור הבא שלך</h3>
          </div>
          <div className="no-lessons-content">
            <div className="no-lessons-icon">🎉</div>
            <h4>אין עוד שיעורים היום!</h4>
            <p>היום הלימודי שלך הסתיים !</p>
           {userType === 'teacher' && <p>זמן מצוין להכין למחר!</p>}
          </div>
          <div className="next-class-actions">
            <button className="btn btn-outline" onClick={onNavigateToSchedule}>
              צפה במערכת השלימה
            </button>
          </div>
        </div>
      );
    }

    // נניח המבנה: { subject, className, startTime, endTime, room, topic, minutesUntil }
    const subject = nextLesson.subject || nextLesson.profession || nextLesson.course || " — ";
    const className = nextLesson.className || nextLesson.class || nextLesson.grade || " — ";
    const start = nextLesson.startTime || nextLesson.start || nextLesson.time || " — ";
    const end = nextLesson.endTime || nextLesson.end || " — ";
    const topic = nextLesson.topic || nextLesson.subjectTopic || nextLesson.topicName || " — ";
    const minutesUntil = nextLesson.minutesUntil ?? null;

    return (
      <div className="next-class-card">
        <div className="next-class-header">
          <h3>השיעור הבא שלך</h3>
          {userType === 'teacher' && minutesUntil !== null && (
            <span className="time-remaining">בעוד {minutesUntil} דקות</span>
          )}
        </div>

        <div className="upcoming-item">
          <span className="upcoming-time">{start.trim()}{end && end.trim() ? ` - ${end.trim()}` : ""}</span>
          <span className="upcoming-subject">
            {subject.trim()} {userType === 'teacher' && `- כיתה ${className.trim()}`}
          </span>
        </div>
      </div>
    );
  };

  const renderUpcomingLessons = () => {
    if (!nextLesson || !nextLesson.subject) return null;

    return (
      <div className="upcoming-classes">
        <h3>השיעורים הבאים היום</h3>
        <div className="upcoming-list">
          {(nextLesson?.upcoming || []).map((u, idx) => (
            <div className="upcoming-item" key={idx}>
              <span className="upcoming-time">{u.time || `${u.start} - ${u.end}`}</span>
              <span className="upcoming-subject">
                {u.subject || u.course} {userType === 'teacher' && `- כיתה ${u.className || u.class || u.grade || "—"}`}
              </span>
            </div>
          ))}
          {(!nextLesson?.upcoming || nextLesson.upcoming.length === 0) && (
            <p>אין עוד שיעורים היום</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-content">
      <h2>השיעור הבא</h2>
      {renderNextClass()}
      {renderUpcomingLessons()}
    </div>
  );
};

export default NextClassSection;