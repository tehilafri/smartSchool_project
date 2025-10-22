import React from 'react';

const ScheduleTable = ({ 
  schedule, 
  events, 
  userInfo, 
  onEventClick,
  isTeacherView = false 
}) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  // אם שבת נראה את השבוע הבא כבר
  const dayOffset = today.getDay() === 6 ? 1 : 0;
  startOfWeek.setDate(today.getDate() - today.getDay() + (dayOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);

  const formatDate = (date) => date.toLocaleDateString("he-IL");
  
  // מכינים מראש מערך של תאריכים לכל יום בשבוע
  const weekDates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const schoolHours = userInfo?.schoolId?.scheduleHours || [];
  const maxLessons = schoolHours.length || 0;

  return (
    <div className="schedule-container">
      <h3>{`מתאריך ${formatDate(startOfWeek)} עד ${formatDate(endOfWeek)}`}</h3>
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
              <th>שישי</th>
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
                  {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday"].map((day, dayIdx) => {
                    // חיפוש השיעור לפי lessonNumber במקום אינדקס
                    const lesson = schedule[day]?.find(l => l.lessonNumber === hourIdx + 1) || null;
                    const hasLesson = lesson && (lesson.subject || lesson.teacherId);
                    
                    // חיפוש אירועים לתא זה
                    const slotEvents = events.filter(event => {
                      if (!hourInfo || event.type === 'exam') return false;
                      
                      const targetDate = weekDates[dayIdx];
                      
                      const eventDate = new Date(event.date);
                      eventDate.setHours(0, 0, 0, 0);
                      
                      const isSameDate = eventDate.getTime() === targetDate.getTime();
                      const isTimeOverlap = event.startTime <= hourInfo.end;
                      
                      // בדיקה אם האירוע שייך לכיתת המשתמש
                      const userClass = isTeacherView 
                        ? userInfo?.classes?.find(c => c.homeroomTeacher && c.homeroomTeacher._id === userInfo._id)
                        : userInfo?.classes?.[0];
                      const isMyClassEvent = userClass && event.classes?.some(cls => cls._id === userClass._id);
                      
                      return isSameDate && isTimeOverlap && isMyClassEvent;
                    });
                    
                    // חיפוש מבחנים לתא זה
                    const slotExams = events.filter(event => {
                      if (!hourInfo || event.type !== 'exam') return false;
                      
                      const targetDate = weekDates[dayIdx];
                      
                      const eventDate = new Date(event.date);
                      eventDate.setHours(0, 0, 0, 0);
                      
                      const isSameDate = eventDate.getTime() === targetDate.getTime();
                      const isLessonMatch = event.selectedLessons ? 
                        event.selectedLessons.includes(hourIdx + 1) : 
                        (event.startTime <= hourInfo.end && event.endTime >= hourInfo.start);
                      
                      // בדיקה אם המבחן שייך לכיתת המשתמש
                      const userClass = isTeacherView 
                        ? userInfo?.classes?.find(c => c.homeroomTeacher && c.homeroomTeacher._id === userInfo._id)
                        : userInfo?.classes?.[0];
                      const isMyClassExam = userClass && event.classes?.some(cls => cls._id === userClass._id);
                      
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
                              ) : isTeacherView ? (
                                lesson.teacherId ? `מורה: ${lesson.teacherId.firstName || ''} ${lesson.teacherId.lastName || lesson.teacherId}` : "—"
                              ) : (
                                lesson.teacherId ? `${lesson.teacherId.firstName} ${lesson.teacherId.lastName}` : "---"
                              )}
                            </small>
                            {lesson.status === 'replaced' && (
                              <div style={{fontSize: '10px', color: '#f6ad55', marginTop: '2px'}}>
                                מוחלף
                              </div>
                            )}
                            {hasEvents && (
                              <div className="slot-events">
                                {slotEvents.map((event, idx) => (
                                  <div key={idx} className={`event-indicator ${event.type} clickable`} onClick={() => onEventClick(event)}>
                                    <div>{event.type === 'exam' ? '📄' : '🎯'} {event.title}</div>
                                    <small className="event-classes">כיתות משתתפות: {event.classes?.map(c => c.name).join(', ') || 'כיתה לא ידועה'}</small>
                                  </div>
                                ))}
                              </div>
                            )}
                            {slotExams.length > 0 && (
                              <div className="slot-exams">
                                {slotExams.map((exam, idx) => (
                                  <div key={idx} className="exam-indicator clickable" onClick={() => onEventClick(exam)}>
                                    📄 {exam.title}
                                    {isTeacherView && (() => {
                                      const isTeachingThisSubject = lesson && lesson.subject === exam.subject;
                                      if (exam.createdBy === userInfo?._id || isTeachingThisSubject) {
                                        return null;
                                      }
                                      return (
                                        <small className="exam-creator"> ({exam.targetTeacher?.firstName} {exam.targetTeacher?.lastName})</small>
                                      );
                                    })()}
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
                                      <div key={idx} className={`event-indicator ${event.type} clickable`} onClick={() => onEventClick(event)}>
                                        {event.type === 'exam' ? '📄' : '🎯'} {event.title}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {slotExams.length > 0 && (
                                  <div className="slot-exams">
                                    {slotExams.map((exam, idx) => (
                                      <div key={idx} className="exam-indicator clickable" onClick={() => onEventClick(exam)}>
                                        📄 {exam.title}
                                        {isTeacherView && (() => {
                                          const isTeachingThisSubject = userInfo?.subjects?.includes(exam.subject);
                                          if (exam.createdBy === userInfo?._id || isTeachingThisSubject) {
                                            return null;
                                          }
                                          return (
                                            <small className="exam-creator"> ({exam.targetTeacher?.firstName} {exam.targetTeacher?.lastName})</small>
                                          );
                                        })()}
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
  );
};

export default ScheduleTable;