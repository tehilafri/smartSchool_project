import React, { useState, useEffect } from 'react';
import HolidayIndicator from './HolidayIndicator';
import {getExternalSubstituteByIDOfMongo} from '../../services/externalSubstituteService';
import { getUserById } from '../../services/userService';

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
              {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"].map((dayName, idx) => {
                const dayDate = weekDates[idx];
                return (
                  <th key={dayName}>
                    <div className="day-header">
                      <div className="day-name">{dayName}</div>
                      <div className="day-date">{formatDate(dayDate)}</div>
                      <HolidayIndicator date={dayDate} />
                    </div>
                  </th>
                );
              })}
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
                    const replacementDate = lesson?.replacementDate ? new Date(lesson.replacementDate) : null;
                    if (replacementDate)
                      replacementDate.setHours(0, 0, 0, 0);

                    const isReplacementThisWeek = replacementDate && replacementDate >= startOfWeek && replacementDate <= endOfWeek;
                    return (
                      <td key={day} className={`class-slot ${hasLesson ? "" : "empty"} ${hasEvents ? "has-events" : ""}`}>
                        {hasLesson ? (
                          <>
                            <strong>{lesson.subject}</strong><br/>
                            <small>
                              {lesson.substitute && isReplacementThisWeek ? (//ההחלפה בשבוע הנוכחי
                                <SubstituteDisplay substituteId={lesson.substitute} />
                              ) : isTeacherView ? (
                                lesson.teacherId ? `מורה: ${lesson.teacherId.firstName || ''} ${lesson.teacherId.lastName || lesson.teacherId}` : "—"
                              ) : (
                                lesson.teacherId ? `${lesson.teacherId.firstName} ${lesson.teacherId.lastName}` : "---"
                              )}
                            </small>
                            {/* {lesson.status === 'replaced' && (
                              <div style={{fontSize: '10px', color: '#f6ad55', marginTop: '2px'}}>
                                מוחלף
                              </div>
                            )} */}
                            {hasEvents && (
                              <div className="slot-events">
                                {slotEvents.map((event, idx) => (
                                  <div key={idx} className={`event-indicator ${event.type} clickable`} onClick={() => onEventClick(event)}>
                                    <div>{event.type === 'exam' ? '📄' : '🎯'} {event.title}</div>
                                    {/* <small className="event-classes">כיתות משתתפות: {event.classes?.map(c => c.name).join(', ') || 'כיתה לא ידועה'}</small> */}
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

// קומפוננטה להצגת מערכת שעות מנקודת מבט של מורה ספציפית
export const TeacherScheduleView = ({ 
  schedule, 
  events, 
  teacherInfo, 
  schoolInfo,
  onEventClick 
}) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  const dayOffset = today.getDay() === 6 ? 1 : 0;
  startOfWeek.setDate(today.getDate() - today.getDay() + (dayOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);

  const formatDate = (date) => date.toLocaleDateString("he-IL");
  
  const weekDates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const schoolHours = schoolInfo?.scheduleHours || [];
  const maxLessons = schoolHours.length;

  return (
    <div className="schedule-container">
      <h3>{`מתאריך ${formatDate(startOfWeek)} עד ${formatDate(endOfWeek)}`}</h3>
      <div className="schedule-table">
        <table>
          <thead>
            <tr>
              <th></th>
              {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"].map((dayName, idx) => {
                const dayDate = weekDates[idx];
                return (
                  <th key={dayName}>
                    <div className="day-header">
                      <div className="day-name">{dayName}</div>
                      <div className="day-date">{formatDate(dayDate)}</div>
                      <HolidayIndicator date={dayDate} />
                    </div>
                  </th>
                );
              })}
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
                    const lesson = schedule[day]?.find(l => l.lessonNumber === hourIdx + 1) || null;
                    const hasLesson = lesson && (lesson.subject || lesson.teacherId);
                    
                    // אירועים של המורה
                    const teacherEvents = events.filter(event => {
                      if (!hourInfo || event.type === 'exam') return false;
                      
                      const targetDate = weekDates[dayIdx];
                      const eventDate = new Date(event.date);
                      eventDate.setHours(0, 0, 0, 0);
                      
                      const isSameDate = eventDate.getTime() === targetDate.getTime();
                      const isTimeOverlap = event.startTime <= hourInfo.end;
                      
                      // בדיקה אם האירוע קשור למורה
                      const isTeacherEvent = teacherInfo?.classes?.some(teacherClass => 
                        event.classes?.some(eventClass => eventClass.name === teacherClass.name)
                      );
                      
                      return isSameDate && isTimeOverlap && isTeacherEvent;
                    });
                    
                    // מבחנים של המורה
                    const teacherExams = events.filter(event => {
                      if (!hourInfo || event.type !== 'exam') return false;
                      
                      const targetDate = weekDates[dayIdx];
                      const eventDate = new Date(event.date);
                      eventDate.setHours(0, 0, 0, 0);
                      
                      const isSameDate = eventDate.getTime() === targetDate.getTime();
                      const isLessonMatch = event.selectedLessons ? 
                        event.selectedLessons.includes(hourIdx + 1) : 
                        (event.startTime <= hourInfo.end && event.endTime >= hourInfo.start);

                      // בדיקה אם המבחן קשור למורה
                      const isTeacherExam = event.createdBy && String(event.createdBy._id) === String(teacherInfo?._id)
                      
                      return isSameDate && isLessonMatch && isTeacherExam;
                    });
                    
                    const hasEvents = teacherEvents.length > 0;
                    const replacementDate = lesson?.replacementDate ? new Date(lesson.replacementDate) : null;
                    if (replacementDate)
                      replacementDate.setHours(0, 0, 0, 0);

                    const isReplacementThisWeek = replacementDate && replacementDate >= startOfWeek && replacementDate <= endOfWeek;
                    
                    return (
                      <td key={day} className={`class-slot ${hasLesson ? "" : "empty"} ${hasEvents ? "has-events" : ""}`}>
                        {hasLesson ? (
                          <>
                            <strong>{lesson.subject}</strong><br/>
                            <small>
                              {lesson.substitute && isReplacementThisWeek && (
                                <div style={{color: '#f6ad55'}}>
                                  <SubstituteDisplay substituteId={lesson.substitute} />
                                </div>
                              )}
                              {lesson.classId && (
                                <div>
                                  כיתה {lesson.classId.name}
                                </div>
                              )}
                            </small>
                            {/* {lesson.status === 'replaced' && (
                              <div style={{fontSize: '10px', color: '#f6ad55', marginTop: '2px'}}>
                                מוחלף
                              </div>
                            )} */}
                            {hasEvents && (
                              <div className="slot-events">
                                {teacherEvents.map((event, idx) => (
                                  <div key={idx} className={`event-indicator ${event.type} clickable`} onClick={() => onEventClick(event)}>
                                    <div>{event.type === 'exam' ? '📄' : '🎯'} {event.title}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {teacherExams.length > 0 && (
                              <div className="slot-exams">
                                {teacherExams.map((exam, idx) => (
                                  <div key={idx} className="exam-indicator clickable" onClick={() => onEventClick(exam)}>
                                    📄 {exam.title}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (() => {
                          if (hasEvents || teacherExams.length > 0) {
                            return (
                              <>
                                {hasEvents && (
                                  <div className="slot-events">
                                    {teacherEvents.map((event, idx) => (
                                      <div key={idx} className={`event-indicator ${event.type} clickable`} onClick={() => onEventClick(event)}>
                                        {event.type === 'exam' ? '📄' : '🎯'} {event.title}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {teacherExams.length > 0 && (
                                  <div className="slot-exams">
                                    {teacherExams.map((exam, idx) => (
                                      <div key={idx} className="exam-indicator clickable" onClick={() => onEventClick(exam)}>
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
  );
};

const SubstituteDisplay = ({ substituteId }) => {
  const [substituteName, setSubstituteName] = useState('');

  useEffect(() => {
    const fetchSubstitute = async () => {
      try {
        // ניסיון ראשון - בדיקה אם זה user פנימי
        const response = await getUserById(substituteId);
        setSubstituteName(`${response.data.firstName} ${response.data.lastName}`);
      } catch (error) {
        try {
          // ניסיון שני - בדיקה אם זה ממלא מקום חיצוני
          const substitute = await getExternalSubstituteByIDOfMongo(substituteId);
          setSubstituteName(`${substitute.firstName} ${substitute.lastName}`);
        } catch (error) {
          setSubstituteName('ממלא מקום');
        }
      }
    };
    
    if (substituteId) {
      fetchSubstitute();
    }
  }, [substituteId]);

  return (
    <span style={{color: '#f6ad55'}}>מילוי מקום: {substituteName}</span>
  );
};

export default ScheduleTable;