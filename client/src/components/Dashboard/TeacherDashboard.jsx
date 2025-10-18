import { useState, useEffect } from "react";
import "./Dashboard.css";
import DashboardHeader from "./DashboardHeader";
import SchoolDirectionsButton from "../SchoolDirectionsButton";

import { getMe } from "../../services/userService";
import { getScheduleByTeacher, getNextLessonForTeacher, updateScheduleDay, createSchedule, getHomeroomClassSchedule } from "../../services/scheduleService"; 
import { getSubstituteRequests, reportAbsence ,approveReplacement} from "../../services/substituteRequestsSercive";
import { getEvents, getNextExam, getUpcomingExams, addEvent, updateEvent, deleteEvent } from "../../services/eventService";
import { getAllClasses } from "../../services/classService";

const TeacherDashboard = ({ onLogout }) => {
  // token: אפשר לקבל דרך props או localStorage
  const [currentToken, setCurrentToken] = useState(localStorage.getItem("token"));
  const token = currentToken;
  
  // בדיקה אם ה-token השתנה ב-localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("token");
      if (newToken !== currentToken) {
        setCurrentToken(newToken);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // בדיקה ידנית כל 500ms
    const interval = setInterval(() => {
      const newToken = localStorage.getItem("token");
      if (newToken !== currentToken) {
        setCurrentToken(newToken);
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentToken]);

  //  // הוספת class ל-body
  useEffect(() => {
    document.body.classList.add("sidebar-active");

    return () => {
      // מנקים את ה-class כשמורידים את הקומפוננטה
      document.body.classList.remove("sidebar-active");
    };
  }, []);

  const [activeSection, setActiveSection] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [schedule, setSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  const [nextLesson, setNextLesson] = useState(null);
  const [loadingNextLesson, setLoadingNextLesson] = useState(true);

  const [classesCount, setClassesCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);

  const [subRequests, setSubRequests] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // const [upcomingExams, setUpcomingExams] = useState([]);
  const [events, setEvents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [error, setError] = useState(null);

  const [substituteForms, setSubstituteForms] = useState({});
  const [notification, setNotification] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [classSchedule, setClassSchedule] = useState(null);
  const [loadingClassSchedule, setLoadingClassSchedule] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // חדש


  const updateForm = (code, field, value) => {
    setSubstituteForms(prev => ({
      ...prev,
      [code]: {
        ...(prev[code] || {}),
        [field]: value
      }
    }));
  };


  // פונקציה לסינון מבחנים לפי מחנכת/לא מחנכת
  const filterExamsByTeacherRole = (examEvents, teacherData) => {
    let myExams = [];
    let othersExams = [];
    
    if (!teacherData || !Array.isArray(examEvents)) {
      return { myExams, othersExams };
    }
    
    if (teacherData?.ishomeroom) {
      const homeroomClass = teacherData.classes?.find(cls => 
        cls?.homeroomTeacher?._id === teacherData._id
      );
      
      examEvents.forEach(exam => {
        if (!exam) return;
        const isMyExam = (exam.createdBy?._id || exam.createdBy) === teacherData._id;
        const isTargetedForMe = (exam.targetTeacher?._id || exam.targetTeacher) === teacherData._id;
        const isMyClassExam = homeroomClass && exam.classes?.some(cls => cls?._id === homeroomClass._id);
        
        if (isMyExam && !exam.targetTeacher) {
          // מבחן שיצרתי עבורי
          myExams.push(exam);
        } else if (isTargetedForMe) {
          // מבחן שמישהו יצר עבורי
          myExams.push(exam);
        } else if (isMyClassExam && (exam.targetTeacher || (!isMyExam && !isTargetedForMe))) {
          // מבחנים של מורות אחרות בכיתתי
          othersExams.push(exam);
        }
      });
    } else {
      examEvents.forEach(exam => {
        if (!exam) return;
        const isMyExam = (exam.createdBy?._id || exam.createdBy) === teacherData._id;
        const isTargetedForMe = (exam.targetTeacher?._id || exam.targetTeacher) === teacherData._id;
        
        if ((isMyExam && !exam.targetTeacher) || isTargetedForMe) {
          myExams.push(exam);
        }
      });
    }
    
    return { myExams, othersExams };
  };

  const handleApproveReplacement = async (absenceCode) => {
  try {
    // נשלוף את הנתונים מהסטייט לפי absenceCode
    const substituteData = substituteForms[absenceCode];

    if (!substituteData) {
      return alert("לא הוזנו פרטי מחליף");
    }

    await approveReplacement(
      { absenceCode, ...substituteData }
    );

    alert("המחליף אושר בהצלחה");

    // איפוס הטופס עבור בקשה זו
    setSubstituteForms(prev => {
      const copy = { ...prev };
      delete copy[absenceCode];
      return copy;
    });

  } catch (err) {
    alert("שגיאה באישור המחליף");
  }
};


  useEffect(() => {
    let cancelled = false;
    
    // ודא שיש token לפני שמתחילים לטעון
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) {
      setError("לא נמצא token - אנא התחבר מחדש");
      return;
    }

    const fetchAll = async () => {
      setError(null);

      let fetchedMe = null;
      // me
      try {
        setLoadingMe(true);
        const meRes = await getMe();
        fetchedMe=meRes?.data;
        if (!cancelled) setMe(meRes?.data);
      } catch (err) {
        console.error("getMe error", err);
        if (!cancelled) setError((e) => e || "שגיאה בטעינת משתמש");
      } finally {
        if (!cancelled) setLoadingMe(false);
      }

      // schedule
     try {
    setLoadingSchedule(true);
    const scheduleRes = await getScheduleByTeacher();

    if (!cancelled) {
      // ממיר לפורמט weekPlan
      const formattedSchedule = formatSchedule(scheduleRes);
      setSchedule(formattedSchedule);
    }
  } catch (err) {
    console.error("getScheduleByTeacher error", err);
    if (!cancelled) setError((e) => e || "שגיאה בטעינת מערכת שעות");
  } finally {
    if (!cancelled) setLoadingSchedule(false);
  }


      // next lesson
      try {
        setLoadingNextLesson(true);
        const nextRes = await getNextLessonForTeacher();
        if (!cancelled) setNextLesson(nextRes);
      } catch (err) {
        console.error("getNextLessonForTeacher error", err);
        if (!cancelled) setError((e) => e || "שגיאה בטעינת השיעור הבא");
      } finally {
        if (!cancelled) setLoadingNextLesson(false);
      }

      // classes count
      try {
        setLoadingCounts(true);
        if (!cancelled) setClassesCount(fetchedMe?.classes?.length ?? 0);
      } catch (err) {
        console.error("getAllClasses error", err);
      } finally {
        if (!cancelled) setLoadingCounts(false);
      }

      // substitute requests
      try {
        setLoadingSubs(true);
        const subs = await getSubstituteRequests();
        if (!cancelled) setSubRequests(subs?.requests ?? []);
      } catch (err) {
        console.error("getSubstituteRequests error", err);
      } finally {
        if (!cancelled) setLoadingSubs(false);
      }

      // events / exams
      try {
        setLoadingExams(true);
        const ev = await getEvents();
        if (!cancelled) {
          const allEvents = Array.isArray(ev) ? ev : ev?.data ?? [];
          setEvents(allEvents);
          
          // סינון מבחנים לפי ההיגיון הנדרש
          const examEvents = allEvents.filter(event => event.type === 'exam');
          const examResults = filterExamsByTeacherRole(examEvents, fetchedMe);
          setExams(examResults);
        }
      } catch (err) {
        console.error("events/exams error", err);
      } finally {
        if (!cancelled) setLoadingExams(false);
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [token]); 

  // modal handlers
  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setEditingExam(null);
  };

  // טעינת מערכת הכיתה למחנכת
  const loadClassSchedule = async () => {
    if (!me?.ishomeroom) return;
    
    try {
      setLoadingClassSchedule(true);
      const scheduleRes = await getHomeroomClassSchedule();
      const formattedSchedule = formatSchedule(scheduleRes);
      setClassSchedule(formattedSchedule);
    } catch (err) {
      console.error("getHomeroomClassSchedule error", err);
      setError("שגיאה בטעינת מערכת השעות של הכיתה");
    } finally {
      setLoadingClassSchedule(false);
    }
  };

  // טעינת מערכת הכיתה כשעוברים לסעיף
  useEffect(() => {
    if (activeSection === "classSchedule" && me?.ishomeroom && !classSchedule) {
      loadClassSchedule();
    }
  }, [activeSection, me?.ishomeroom]);



  const showNotification = (message, type = 'success', callback = null) => {
    setNotification({ message, type, callback });
    if (type !== 'confirm') {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // דוגמה: שליחת בקשת היעדרות דרך ה־API
  const handleSubmitAbsence = async (absenceData) => {
    try {
      await reportAbsence(absenceData);
      showNotification("הבקשה נשלחה בהצלחה!", 'success');
      // רענון בקשות
      const subs = await getSubstituteRequests();
      setSubRequests(subs?.requests ?? []);
      // עדכון הסקשן ל"ההיעדרויות שלי" כדי להציג מיד את הבקשה החדשה
      setActiveSection("myAbsences");
      closeModal();
    } catch (err) {
      console.error("report absence", err);
      const errorMessage = err.response?.data?.message || err.message;
      
      if (errorMessage === "You are not assigned to any lessons in this time range") {
        showNotification("אין לך שיעורים מתוכננים בטווח השעות שבחרת. אנא בדוק את מערכת השעות שלך ונסה שוב.", 'error');
      } else {
        showNotification(`שגיאה בשליחת בקשת היעדרות: ${errorMessage}`, 'error');
      }
    }
  };

  // דוגמה: שמירת עדכון יום במערכת שעות
  const handleSaveScheduleDay = async (updateData) => {
    try {
      await updateScheduleDay(updateData);
      // המתנה קצרה לפני רענון
      setTimeout(async () => {
        const scheduleRes = await getScheduleByTeacher();
        const formattedSchedule = formatSchedule(scheduleRes);
        setSchedule(formattedSchedule);
      }, 500);
      showNotification("העדכון נשמר בהצלחה", 'success');
    } catch (err) {
      console.error("updateScheduleDay error", err);
      const errorMessage = err.response?.data?.error || err.message;
      showNotification(`שגיאה בעדכון המערכת: ${errorMessage}`, 'error');
    }
  };

  // יצירת/עדכון מערכת שלמה
  const handleCreateSchedule = async (scheduleData) => {
    try {
      await createSchedule(scheduleData);
      // המתנה קצרה לפני רענון
      setTimeout(async () => {
        const scheduleRes = await getScheduleByTeacher();
        const formattedSchedule = formatSchedule(scheduleRes);
        setSchedule(formattedSchedule);
      }, 500);
      showNotification("המערכת נשמרה בהצלחה!", 'success');
      closeModal();
    } catch (err) {
      console.error("createSchedule error", err);
      const errorMessage = err.response?.data?.error || err.message;
      showNotification(`שגיאה ביצירת המערכת: ${errorMessage}`, 'error');
    }
  };

  // פונקציה לרענון רשימת המבחנים
  const refreshExams = async () => {
    const ev = await getEvents();
    const allEvents = Array.isArray(ev) ? ev : ev?.data ?? [];
    setEvents(allEvents);
    
    const examEvents = allEvents.filter(event => event.type === 'exam');
    const examResults = filterExamsByTeacherRole(examEvents, me);
    setExams(examResults);
  };

  // עריכת מבחן קיים
  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setModalType("editExam");
    setShowModal(true);
  };

  // מחיקת מבחן
  const handleDeleteExam = async (exam) => {
    const confirmDelete = async () => {
      try {
        await deleteEvent(exam.eventId);
        showNotification('המבחן נמחק בהצלחה!', 'success');
        await refreshExams();
      } catch (err) {
        console.error('deleteExam error', err);
        const errorMessage = err.response?.data?.message || err.message || 'שגיאה לא ידועה';
        const errorDetails = err.response?.data?.error || '';
        const fullErrorMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
        showNotification(`שגיאה במחיקת המבחן: ${fullErrorMessage}`, 'error');
      }
    };

    showNotification(`האם אתה בטוח שברצונך למחוק את המבחן "${exam.title || 'מבחן'}"?`, 'confirm', confirmDelete);
  };

  // עדכון מבחן
  const handleUpdateExam = async (examData) => {
    try {
      const eventData = {
        type: 'exam',
        title: examData.title,
        subject: examData.subject,
        classes: examData.classes,
        date: examData.date,
        startTime: examData.startTime,
        endTime: examData.endTime,
        selectedLessons: examData.selectedLessons,
        notes: examData.notes,
        targetTeacher: examData.targetTeacher
      };
      
      await updateEvent(editingExam._id, eventData);
      
      showNotification("המבחן עודכן בהצלחה!", 'success');
      
      await refreshExams();
      
      setEditingExam(null);
      closeModal();
    } catch (err) {
      console.error("updateExam error", err);
      const errorMessage = err.response?.data?.message || err.message || 'שגיאה לא ידועה';
      showNotification(`שגיאה בעדכון המבחן: ${errorMessage}`, 'error');
    }
  };

  // יצירת מבחן חדש
  const handleCreateExam = async (examData) => {
    try {
      const eventData = {
        type: 'exam',
        title: examData.title,
        subject: examData.subject,
        classes: examData.classes,
        date: examData.date,
        startTime: examData.startTime,
        endTime: examData.endTime,
        selectedLessons: examData.selectedLessons,
        notes: examData.notes,
        targetTeacher: examData.targetTeacher
      };
      
      await addEvent(eventData);
      
      showNotification("המבחן נקבע בהצלחה!", 'success');
      
      await refreshExams();
      
      closeModal();

    } catch (err) {
      console.error("createExam error", err);
      const errorMessage = err.response?.data?.message || err.message || 'שגיאה לא ידועה';
      showNotification(`שגיאה בקביעת המבחן: ${errorMessage}`, 'error');
    }
  };

const renderClassScheduleTable = () => {
  if (loadingClassSchedule) return <p>טוען מערכת שעות של הכיתה...</p>;
  if (!classSchedule || !classSchedule.weekPlan) return <p>לא נמצאה מערכת שעות לכיתה.</p>;

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
  const dayLabels = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];

  const schoolHours = me?.schoolId?.scheduleHours || [];
  const maxLessons = schoolHours.length || Math.max(
    ...days.map(day => classSchedule.weekPlan[day]?.length || 0)
  );

  const today = new Date();

  // חישוב יום ראשון של השבוע (או השבוע הבא אם היום שבת)
  const startOfWeek = new Date(today);
  const dayOffset = today.getDay() === 6 ? 1 : 0;
  startOfWeek.setDate(today.getDate() - today.getDay() + (dayOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  // יום שישי של השבוע
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);

  // פונקציה לנראות תאריך בעברית
  const formatDate = (date) => date.toLocaleDateString("he-IL");

  // [מערך של תאריכי כל הימים (ראשון–שישי)
  const weekDates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  return (
    <div className="schedule-table">
      <h3>{`מתאריך ${formatDate(startOfWeek)} עד ${formatDate(endOfWeek)}`}</h3>
      <table>
        <thead>
          <tr>
            <th></th>
            {dayLabels.map((label, idx) => <th key={idx}>{label}</th>)}
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
                {days.map((day, dayIdx) => {
                  // חיפוש השיעור לפי lessonNumber במקום אינדקס
                  const lesson = classSchedule.weekPlan[day]?.find(l => l.lessonNumber === hourIdx + 1) || null;
                  const hasLesson = lesson && (lesson.subject || lesson.teacherId);
                  
                  // חיפוש אירועים לתא זה
                  const slotEvents = events.filter(event => {
                    if (!schoolHours[hourIdx] || event.type === 'exam') return false;
                    
                    const hourInfo = schoolHours[hourIdx];
                    const targetDate = weekDates[dayIdx];
                    const eventDate = new Date(event.date);
                    eventDate.setHours(0, 0, 0, 0);
                    
                    const isSameDate = eventDate.getTime() === targetDate.getTime();
                    const isTimeOverlap = event.startTime <= hourInfo.end;
                    
                    // בדיקה אם האירוע שייך לכיתת החינוך
                    const homeroomClass = me.classes?.find(c => 
                      c.homeroomTeacher && c.homeroomTeacher._id === me._id
                    );
                    const isMyClassEvent = homeroomClass && event.classes?.some(cls => cls._id === homeroomClass._id);
                    
                    return isSameDate && isTimeOverlap && isMyClassEvent;
                  });
                  
                  const hasEvents = slotEvents.length > 0;
                  
                  return (
                    <td key={dayIdx} className={`class-slot ${hasLesson ? "" : "empty"} ${hasEvents ? "has-events" : ""}`}>
                      {hasLesson ? (
                        <>
                          <strong>{lesson.subject || "—"}</strong><br />
                          <small>
                            {lesson.substitute ? (
                              <span style={{color: '#f6ad55'}}>מחליף: {lesson.substitute.firstName} {lesson.substitute.lastName}</span>
                            ) : lesson.teacherId ? (
                              `מורה: ${lesson.teacherId.firstName || ''} ${lesson.teacherId.lastName || lesson.teacherId}`
                            ) : "—"}
                          </small>
                          {lesson.status === 'replaced' && (
                            <div style={{fontSize: '10px', color: '#f6ad55', marginTop: '2px'}}>
                              מוחלף
                            </div>
                          )}
                          {hasEvents && (
                            <div className="slot-events">
                              {slotEvents.map((event, idx) => (
                                <div key={idx} className={`event-indicator ${event.type} clickable`} onClick={() => setSelectedEvent(event)}>
                                  <div>{event.type === 'exam' ? '📄' : '🎯'} {event.title}</div>
                                  <small className="event-classes">כיתות משתתפות: {event.classes?.map(c => c.name).join(', ') || 'כיתה לא ידועה'}</small>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* הצגת מבחנים רלוונטיים */}
                          {(() => {
                            const slotExams = events.filter(event => {
                              if (!schoolHours[hourIdx] || event.type !== 'exam') return false;
                              
                              const hourInfo = schoolHours[hourIdx];
                              const targetDate = weekDates[dayIdx];
                              const eventDate = new Date(event.date);
                              eventDate.setHours(0, 0, 0, 0);
                              const isSameDate = eventDate.getTime() === targetDate.getTime();
                              const isLessonMatch = event.selectedLessons ? 
                                event.selectedLessons.includes(hourIdx + 1) : 
                                (event.startTime <= hourInfo.end && event.endTime >= hourInfo.start);
                              
                              // למחנכת - רואה כל מבחן של הכיתה
                              const homeroomClass = me.classes?.find(c => 
                                c.homeroomTeacher && c.homeroomTeacher._id === me._id
                              );
                              const isMyClassExam = homeroomClass && event.classes?.some(cls => cls._id === homeroomClass._id);
                              
                              return isSameDate && isLessonMatch && isMyClassExam;
                            });
                            
                            return slotExams.length > 0 && (
                              <div className="slot-exams">
                                {slotExams.map((exam, idx) => (
                                  <div key={idx} className="exam-indicator clickable" onClick={() => setSelectedEvent(exam)}>
                                    📄 {exam.title}
                                    {(() => {
                                      const isTeachingThisSubject = lesson && lesson.subject === exam.subject;
                                      if (exam.createdBy === me?._id || isTeachingThisSubject) {
                                        return null;
                                      }
                                      return (
                                        <small className="exam-creator"> ({exam.createdByName || 'מורה אחרת'})</small>
                                      );
                                    })()}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </>
                      ) : (() => {
                        // בדיקת מבחנים בתא ריק
                        const slotExams = events.filter(event => {
                          if (!schoolHours[hourIdx] || event.type !== 'exam') return false;
                          
                          const hourInfo = schoolHours[hourIdx];
                          const targetDate = weekDates[dayIdx];
                          const eventDate = new Date(event.date);
                          eventDate.setHours(0, 0, 0, 0);
                          
                          const isSameDate = eventDate.getTime() === targetDate.getTime();
                          const isLessonMatch = event.selectedLessons ? 
                            event.selectedLessons.includes(hourIdx + 1) : 
                            (event.startTime <= hourInfo.end && event.endTime >= hourInfo.start);
                          
                          const homeroomClass = me.classes?.find(c => 
                            c.homeroomTeacher && c.homeroomTeacher._id === me._id
                          );
                          const isMyClassExam = homeroomClass && event.classes?.some(cls => cls._id === homeroomClass._id);
                          
                          return isSameDate && isLessonMatch && isMyClassExam;
                        });
                        
                        if (hasEvents || slotExams.length > 0) {
                          return (
                            <>
                              {hasEvents && (
                                <div className="slot-events">
                                  {slotEvents.map((event, idx) => (
                                    <div key={idx} className={`event-indicator ${event.type} clickable`} onClick={() => setSelectedEvent(event)}>
                                      {event.type === 'exam' ? '📄' : '🎯'} {event.title}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {slotExams.length > 0 && (
                                <div className="slot-exams">
                                  {slotExams.map((exam, idx) => (
                                    <div key={idx} className="exam-indicator clickable" onClick={() => setSelectedEvent(exam)}>
                                      📄 {exam.title}
                                      {(() => {
                                        const isTeachingThisSubject = me?.subjects?.includes(exam.subject);
                                        if (exam.createdBy === me?._id || isTeachingThisSubject) {
                                          return null;
                                        }
                                        return (
                                          <small className="exam-creator"> ({exam.createdByName || 'מורה אחרת'})</small>
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
  );
};

const renderScheduleTable = () => {
  if (loadingSchedule) return <p>טוען מערכת שעות...</p>;
  if (!schedule || !schedule.weekPlan) return <p>לא נמצאה מערכת שעות.</p>;

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
  const dayLabels = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];

  // נתוני השעות מבית הספר
  const schoolHours = me?.schoolId?.scheduleHours || [];
  
  // מספר השעות לפי בית הספר (לא לפי מה שיש במערכת)
  const maxLessons = schoolHours.length || Math.max(
    ...days.map(day => schedule.weekPlan[day]?.length || 0)
  );

  const today = new Date();

  // חישוב יום ראשון של השבוע (או השבוע הבא אם היום שבת)
  const startOfWeek = new Date(today);
  const dayOffset = today.getDay() === 6 ? 1 : 0;
  startOfWeek.setDate(today.getDate() - today.getDay() + (dayOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  // יום שישי של השבוע
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);

  // פונקציה לנראות תאריך בעברית
  const formatDate = (date) => date.toLocaleDateString("he-IL");

  //  מערך של תאריכי כל הימים (ראשון–שישי)
  const weekDates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  return (
    <div className="schedule-table">
      <h3>{`מתאריך ${formatDate(startOfWeek)} עד ${formatDate(endOfWeek)}`}</h3>
      <table>
        <thead>
          <tr>
            <th></th>
            {dayLabels.map((label, idx) => <th key={idx}>{label}</th>)}
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
                {days.map((day, dayIdx) => {
                  // חיפוש השיעור לפי lessonNumber במקום אינדקס
                  const lesson = schedule.weekPlan[day]?.find(l => l.lessonNumber === hourIdx + 1) || null;
                  
                  // חיפוש אירועים לתא זה - רק לשבוע הנוכחי (ללא מבחנים)
                  const slotEvents = events.filter(event => {
                    if (!schoolHours[hourIdx] || event.type === 'exam') return false;
                    
                    const hourInfo = schoolHours[hourIdx];
                    const targetDate = weekDates[dayIdx];
                    const eventDate = new Date(event.date);
                    eventDate.setHours(0, 0, 0, 0);
                    
                    const isSameDate = eventDate.getTime() === targetDate.getTime();
                    const isTimeOverlap = event.startTime <= hourInfo.end;
                    
                    return isSameDate && isTimeOverlap;
                  });
                  
                  const hasEvents = slotEvents.length > 0;
                  
                  return (
                    <td key={dayIdx} className={`class-slot ${lesson ? "" : "empty"} ${hasEvents ? "has-events" : ""}`}>
                      {lesson ? (
                        <>
                          <strong>{lesson.subject || "—"}</strong><br />
                          <small>
                            {lesson.classId
                              ? `כיתה ${lesson.classId.name}` 
                              : "—"}
                          </small>
                          {lesson.substitute && (
                            <div style={{fontSize: '11px', color: '#f6ad55', marginTop: '2px'}}>
                              מחליף: {lesson.substitute.firstName} {lesson.substitute.lastName}
                            </div>
                          )}
                          {lesson.status === 'replaced' && (
                            <div style={{fontSize: '10px', color: '#f6ad55', marginTop: '2px'}}>
                              מוחלף
                            </div>
                          )}
                          {hasEvents && (
                            <div className="slot-events">
                              {slotEvents.map((event, idx) => (
                                <div key={idx} className={`event-indicator ${event.type} clickable`} onClick={() => setSelectedEvent(event)}>
                                  <div>{event.type === 'exam' ? '📄' : '🎯'} {event.title}</div>
                                  <small className="event-classes">כיתות משתתפות: {event.classes?.map(c => c.name).join(', ') || 'כיתה לא ידועה'}</small>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* הצגת מבחנים רלוונטיים */}
                          {(() => {
                            const slotExams = events.filter(event => {
                              if (!schoolHours[hourIdx] || event.type !== 'exam') return false;
                              
                              const hourInfo = schoolHours[hourIdx];
                              const targetDate = weekDates[dayIdx];
                              const eventDate = new Date(event.date);
                              eventDate.setHours(0, 0, 0, 0);
                              
                              const isSameDate = eventDate.getTime() === targetDate.getTime();
                              const isLessonMatch = event.selectedLessons ? 
                                event.selectedLessons.includes(hourIdx + 1) : 
                                (event.startTime <= hourInfo.end && event.endTime >= hourInfo.start);
                              
                              // בדיקה אם המבחן רלוונטי למורה
                              const hasLessonAtTime = lesson && lesson.subject;
                              const isMyClass = lesson && lesson.classId && 
                                event.classes?.some(cls => cls._id === lesson.classId._id || cls._id === lesson.classId);
                              const isMyExam = (event.createdBy?._id || event.createdBy) === me?._id;
                              const isTargetedForMe = (event.targetTeacher?._id || event.targetTeacher) === me?._id;
                              
                              return isSameDate && isLessonMatch && hasLessonAtTime && isMyClass && (isMyExam || isTargetedForMe);
                            });
                            
                            return slotExams.length > 0 && (
                              <div className="slot-exams">
                                {slotExams.map((exam, idx) => (
                                  <div key={idx} className="exam-indicator clickable" onClick={() => setSelectedEvent(exam)}>
                                    📄 {exam.title}
                                    {(() => {
                                      const isTeachingThisSubject = lesson && lesson.subject === exam.subject;
                                      if (exam.createdBy === me?._id || isTeachingThisSubject) {
                                        return null;
                                      }
                                      return (
                                        <small className="exam-creator"> ({exam.createdByName || 'מורה אחרת'})</small>
                                      );
                                    })()}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </>
                      ) : hasEvents ? (
                        <div className="slot-events">
                          {slotEvents.map((event, idx) => (
                            <div key={idx} className={`event-indicator ${event.type} clickable`} onClick={() => setSelectedEvent(event)}>
                              <div>{event.type === 'exam' ? '📄' : '🎯'} {event.title}</div>
                              <small className="event-classes">כיתות משתתפות: {event.classes?.map(c => c.name).join(', ') || 'כיתה לא ידועה'}</small>
                            </div>
                          ))}
                        </div>
                      ) : (() => {
                        const slotExams = events.filter(event => {
                          if (!schoolHours[hourIdx] || event.type !== 'exam') return false;
                          
                          const hourInfo = schoolHours[hourIdx];
                          const targetDate = weekDates[dayIdx];
                          const eventDate = new Date(event.date);
                          eventDate.setHours(0, 0, 0, 0);
                          
                          const isSameDate = eventDate.getTime() === targetDate.getTime();
                          const isLessonMatch = event.selectedLessons ? 
                            event.selectedLessons.includes(hourIdx + 1) : 
                            (event.startTime <= hourInfo.end && event.endTime >= hourInfo.start);
                          
                          // בדיקה אם המבחן רלוונטי למורה
                          const myLessonAtTime = schedule?.weekPlan?.[day]?.find(l => l.lessonNumber === hourIdx + 1);
                          const hasMyLessonAtTime = myLessonAtTime && myLessonAtTime.subject;
                          const isMyClass = myLessonAtTime && myLessonAtTime.classId && 
                            event.classes?.some(cls => cls._id === myLessonAtTime.classId._id || cls._id === myLessonAtTime.classId);
                          const isMyExam = (event.createdBy?._id || event.createdBy) === me?._id;
                          const isTargetedForMe = (event.targetTeacher?._id || event.targetTeacher) === me?._id;
                          
                          return isSameDate && isLessonMatch && hasMyLessonAtTime && isMyClass && (isMyExam || isTargetedForMe);
                        });
                        
                        return slotExams.length > 0 ? (
                          <div className="slot-exams">
                            {slotExams.map((exam, idx) => (
                              <div key={idx} className="exam-indicator clickable" onClick={() => setSelectedEvent(exam)}>
                                📄 {exam.title}
                                {(() => {
                                  const isTeachingThisSubject = me?.subjects?.includes(exam.subject);
                                  if (exam.createdBy === me?._id || isTeachingThisSubject) {
                                    return null;
                                  }
                                  return (
                                    <small className="exam-creator"> ({exam.createdByName || 'מורה אחרת'})</small>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : "—";
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
  );
};

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
            <p>היום הלימודי שלך הסתיים. זמן מצוין להכין למחר!</p>
          </div>
          <div className="next-class-actions">
            <button className="btn btn-outline" onClick={() => setActiveSection("schedule")}>
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
          <span className="time-remaining">{minutesUntil !== null ? `בעוד ${minutesUntil} דקות` : ""}</span>
        </div>

        <div className="upcoming-item">
          <span className="upcoming-time">{start.trim()}{end && end.trim() ? ` - ${end.trim()}` : ""}</span>
          <span className="upcoming-subject">{subject.trim()} - כיתה {className.trim()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header" style={{marginTop: 70}}>
          <h2>Smart School</h2>
          <p>פאנל מורה</p>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "overview", label: "סקירה כללית", icon: "📊" },
            { id: "schedule", label: "המערכת שלי", icon: "📅" },
            ...(me?.ishomeroom ? [{ id: "classSchedule", label: "מערכת הכיתה", icon: "🏢" }] : []),

            { id: "nextClass", label: "השיעור הבא", icon: "⏰" },
            { id: "updateSchedule", label: "עדכון מערכת שעות", icon: "✏️" },

            { id: "absences", label: "דיווח היעדרות", icon: "📝" },
            { id: "myAbsences", label: "ההיעדרויות שלי", icon: "📋" },
            { id: "exams", label: "מבחנים", icon: "📄" },
          ].map((item) => (
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
        {me?.schoolId && <DashboardHeader schoolId={me.schoolId._id} onLogout={onLogout} />}
        <div className="dashboard-header">
          <h1>{me?.gender=="female"?"ברוכה הבאה": "ברוך הבא"}, המורה {loadingMe ? "טוען..." : (me?.firstName )} {me?.lastName}</h1>
          <div className="header-actions">
            <button className="btn btn-outline">הודעות</button>
            <button className="btn btn-primary">צ'אט</button>
            {me?.schoolId?.address && <SchoolDirectionsButton schoolAddress={me.schoolId.address} />}
          </div>
        </div>

        {/* תוכן דינמי */}
        {error && <div className="error-banner">{error}</div>}
        
        {notification && (
          <div className={`notification ${notification.type}`}>
            <span>{notification.message}</span>
            {notification.type === 'confirm' ? (
              <div className="notification-actions">
                <button className="confirm-btn" onClick={() => {
                  if (notification.callback) notification.callback();
                  setNotification(null);
                }}>אישור</button>
                <button className="cancel-btn" onClick={() => setNotification(null)}>ביטול</button>
              </div>
            ) : (
              <button onClick={() => setNotification(null)}>×</button>
            )}
          </div>
        )}

        {activeSection === "overview" && (
          <div className="dashboard-content">
            <h2>סקירה כללית</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏫</div>
                <div className="stat-info">
                  <h3>{loadingCounts ? "..." : classesCount}</h3>
                  <p>כיתות שאני מלמדת</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>
                    {
                      (() => {
                        if (loadingExams) return "...";
                        if (!events || events.length === 0 || !me?.classes) return "0";
                        const today = new Date();
                        const startOfWeek = new Date(today);
                        // אם היום שבת (6), הצג את השבוע הבא
                        const dayOffset = today.getDay() === 6 ? 1 : 0;
                        startOfWeek.setDate(today.getDate() - today.getDay() + (dayOffset * 7)); // ראשון
                        startOfWeek.setHours(0, 0, 0, 0);
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6); // שבת
                        endOfWeek.setHours(23, 59, 59, 999);
                        
                        const teacherClassIds = me.classes.map(c => c._id || c);
                        
                        const filteredEvents = events.filter(event => {
                          const eventDate = new Date(event.date);
                          eventDate.setHours(0, 0, 0, 0);
                          
                          const isThisWeek = eventDate >= startOfWeek && eventDate <= endOfWeek;
                          const isForMyClasses = event.classes?.some(cls => 
                            teacherClassIds.includes(cls._id || cls)
                          );
                          const isNotExam = event.type !== 'exam';
                          
                          return isThisWeek && isForMyClasses && isNotExam;
                        });
                        
                        // בדיקה ספציפית לאירוע הטיול
                        const tripEvent = events.find(e => e.title === 'טיול למדבר');
                        if (tripEvent) {
                          const tripDate = new Date(tripEvent.date);
                          tripDate.setHours(0, 0, 0, 0);
                        }
                        
                        return filteredEvents.length;
                      })()
                    }
                  </h3>
                  <p>אירועים השבוע</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <h3>
                    {
                      (() => {
                        if (loadingExams) return "...";
                        if (!exams.myExams && !exams.othersExams) return "0";
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const upcomingMyExams = (exams.myExams || []).filter(exam => {
                          const examDate = new Date(exam.date);
                          examDate.setHours(0, 0, 0, 0);
                          return examDate >= today;
                        });
                        const upcomingOthersExams = (exams.othersExams || []).filter(exam => {
                          const examDate = new Date(exam.date);
                          examDate.setHours(0, 0, 0, 0);
                          return examDate >= today;
                        });
                        return upcomingMyExams.length + upcomingOthersExams.length;
                      })()
                    }
                  </h3>
                  <p>מבחנים קרובים</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                   <h3>
                    {
                      subRequests
                        ?.filter(r => new Date(r.date) >= new Date()) // רק עתידיות
                        ?.length ?? 0
                    }
                  </h3>
                  <p>בקשות היעדרות קרובות</p>
                </div>
              </div>
            </div>

            <div className="teacher-quick-actions">
              <h3>פעולות מהירות</h3>
              <div className="quick-actions-grid">
                <button className="quick-action-card" onClick={() => openModal("reportAbsence")}>
                  <span className="action-icon">📝</span>
                  <span className="action-text">דווח היעדרות</span>
                </button>

                <button className="quick-action-card" onClick={() => openModal("scheduleExam")}>
                  <span className="action-icon">📄</span>
                  <span className="action-text">קבע מבחן</span>
                </button>
                <button className="quick-action-card" onClick={() => setActiveSection("updateSchedule")}>
                  <span className="action-icon">✏️</span>
                  <span className="action-text">עדכן מערכת</span>
                </button>
              </div>
            </div>

            <div className="recent-activities">
              <h3>מה חדש?</h3>
              <div className="activity-list">
                {(() => {
                  if (!events || events.length === 0) return <p>אין אירועים.</p>;
                  
                  const relevantEvents = events
                    .filter(ev => {
                      const eventDate = new Date(ev.date);
                      eventDate.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const diffDays = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < -3 || diffDays > 7) return false;
                      
                      // סינון מבחנים
                      if (ev.type === 'exam') {
                        const examResults = filterExamsByTeacherRole([ev], me);
                        return examResults.myExams.length > 0 || examResults.othersExams.length > 0;
                      }
                      
                      return true; // אירועים אחרים
                    })
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 3);
                  
                  if (relevantEvents.length === 0) return <p>אין אירועים רלוונטיים.</p>;
                  
                  return relevantEvents.map((ev, i) => {
                    const eventDate = new Date(ev.date);
                    eventDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
                    
                    let timeText = "";
                    if (diffDays === 0) timeText = "היום";
                    else if (diffDays === 1) timeText = "מחר";
                    else if (diffDays === -1) timeText = "אתמול";
                    else if (diffDays > 0) timeText = `בעוד ${diffDays} ימים`;
                    else timeText = `לפני ${Math.abs(diffDays)} ימים`;
                    
                    const classNames = ev.classes?.map(c => c.name).join(', ') || 'כיתה לא ידועה';
                    
                    return (
                      <div className="activity-item" key={i}>
                        <span className="activity-time">{timeText}</span>
                        <span className="activity-text">{ev.title} - {classNames}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {activeSection === "schedule" && (
          <div className="dashboard-content">
            <h2>המערכת שלי</h2>
            <div className="schedule-container">
              {renderScheduleTable()}
            </div>
          </div>
        )}

        {activeSection === "classSchedule" && me?.ishomeroom && (
          <div className="dashboard-content">
            <h2>מערכת הכיתה - {me.classes?.find(cls => cls.homeroomTeacher && cls.homeroomTeacher._id === me._id)?.name}</h2>
            <div className="schedule-container">
              {renderClassScheduleTable()}
            </div>
          </div>
        )}



        {activeSection === "nextClass" && (
          <div className="dashboard-content">
            <h2>השיעור הבא</h2>
            {renderNextClass()}

            {nextLesson && nextLesson.subject && (
              <div className="upcoming-classes">
                <h3>השיעורים הבאים היום</h3>
                <div className="upcoming-list">
                  {(nextLesson?.upcoming || []).map((u, idx) => (
                    <div className="upcoming-item" key={idx}>
                      <span className="upcoming-time">{u.time || `${u.start} - ${u.end}`}</span>
                      <span className="upcoming-subject">{u.subject || u.course} - כיתה {u.className || u.class || u.grade || "—"}</span>
                    </div>
                  ))}
                  {(!nextLesson?.upcoming || nextLesson.upcoming.length === 0) && (
                    <p>אין עוד שיעורים היום</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}



       {activeSection === "myAbsences" && (
        <div className="dashboard-content">
          <h2>ההיעדרויות שלי</h2>
          
          {subRequests.length === 0 && <p>אין בקשות היעדרות.</p>}

          {/* היום */}
          {(() => {
            const today = new Date();
            const upcoming = subRequests.filter(r => new Date(r.date ) >= today);
            const past = subRequests.filter(r => new Date(r.date) < today);

            return (
              <>
                {/* בקשות עתידיות */}
                {upcoming.length > 0 && (
                  <>
                    <h3>בקשות קרובות</h3>
                    {upcoming.map((r, i) => (
                      <div className={`absence-card ${r.status || ""}`} key={i}>
                        <div className="absence-header">
                          <h4>בקשת היעדרות - {formatDateFriendly(r.date) || "—"}</h4>
                          <span className={`status-badge ${r.status || ""}`}>{r.status || "ממתין"}</span>
                        </div>
                        <div className="absence-details">
                          <p><strong>קוד בקשה:</strong> {r.absenceCode}</p>
                          <p><strong>תאריך:</strong> {formatDateFriendly(r.date)}</p>
                          <p><strong>שעות:</strong> {r.startTime} - {r.endTime}</p>
                          <p><strong>סיבה:</strong> {r.reason}</p>
                          <p><strong>ממלא מקום:</strong> 
                            {r.substituteTeacher 
                              ? `${r.substituteTeacher.firstName || ""} ${r.substituteTeacher.lastName || ""}` 
                              : "טרם נמצא"}
                          </p>
                         {r.checked === true && r.status === "pending" && (
                          <div className="absence-card replacement-approval-card">
                            <p>העניין נבדק ונשלחו הודעות למורים ממלאי מקום מתאימים.</p>
                            <p>במידה ואחד מהם יאשר, תישלח אליך הודעת מייל עם פרטי ממלא המקום.</p>
                            <p>במידה ונשלח ואתה רוצה לאשר זאת, מלא את הפרטים לפי הנתונים המצורפים במייל.</p>
                            <div className="absence-header">
                              <h4>אישור ממלא מקום</h4>
                            </div>
                            <div className="absence-details">
                              <div className="form-group">
                                <label>שם פרטי</label>
                                <input
                                  type="text"
                                  value={substituteForms[r.absenceCode]?.firstName || ""}
                                  onChange={(e) => updateForm(r.absenceCode, "firstName", e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label>שם משפחה</label>
                                <input
                                  type="text"
                                  value={substituteForms[r.absenceCode]?.lastName || ""}
                                  onChange={(e) => updateForm(r.absenceCode, "lastName", e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label>תעודת זהות</label>
                                <input
                                  type="text"
                                  value={substituteForms[r.absenceCode]?.identityNumber || ""}
                                  onChange={(e) => updateForm(r.absenceCode, "identityNumber", e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label>אימייל</label>
                                <input
                                  type="email"
                                  value={substituteForms[r.absenceCode]?.email || ""}
                                  onChange={(e) => updateForm(r.absenceCode, "email", e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label>טלפון</label>
                                <input
                                  type="text"
                                  value={substituteForms[r.absenceCode]?.phone || ""}
                                  onChange={(e) => updateForm(r.absenceCode, "phone", e.target.value)}
                                />
                              </div>
                              <div className="form-group" style={{ marginBottom: "1em" }}>
                                <label>הערות</label>
                                <textarea
                                  value={substituteForms[r.absenceCode]?.notes || ""}
                                  onChange={(e) => updateForm(r.absenceCode, "notes", e.target.value)}
                                  rows="3"
                                />
                              </div>
                              <button className="btn btn-primary" onClick={() => handleApproveReplacement(r.absenceCode)}>
                                אשר
                              </button>
                            </div>
                          </div>
                        )}



                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* בקשות קודמות */}
                {past.length > 0 && (
                  <>
                    <h3>היעדרויות קודמות</h3>
                    {past.map((r, i) => (
                      <div className={`absence-card past ${r.status || ""}`} key={i}>
                        <div className="absence-header">
                          <h4>בקשת היעדרות - {formatDateFriendly(r.date) || "—"}</h4>
                        </div>
                        <div className="absence-details">
                          <p><strong>תאריך:</strong> {formatDateFriendly(r.date)}</p>
                          <p><strong>שעות:</strong> {r.startTime} - {r.endTime}</p>
                          <p><strong>סיבה:</strong> {r.reason}</p>
                          <p><strong>ממלא מקום:</strong>  {r.substituteTeacher ?
                                                            `${r.substituteTeacher.firstName} ${r.substituteTeacher.lastName}` 
                                                            : "לא נמצא עידכון במערכת"}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}


        {activeSection === "absences" && (
          <div className="dashboard-content">
            <h2>דיווח היעדרות</h2>
            <AbsenceForm onSubmit={handleSubmitAbsence} onCancel={() => {}} showNotification={showNotification} />
          </div>
        )}

        {activeSection === "updateSchedule" && (
          <div className="dashboard-content">
            <h2>ניהול מערכת שעות</h2>
            
            <div className="schedule-update-options">
              <div className="update-option-card">
                <h3>עדכון יום ספציפי</h3>
                <p>עדכן שיעורים ביום מסוים בשבוע</p>
                <UpdateDayForm onSubmit={handleSaveScheduleDay} showNotification={showNotification} me={me} />
              </div>
              
              <div className="update-option-card">
                <h3>יצירת/עדכון מערכת שלמה</h3>
                <p>יצירה או עדכון של כל המערכת לכיתה</p>
                <button className="btn btn-primary" onClick={() => openModal("createSchedule")}>
                  פתח טופס מערכת שלמה
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "exams" && (
          <div className="dashboard-content">
            <div className="section-header">
              <h2>מבחנים</h2>
              <button className="btn btn-primary" onClick={() => openModal("scheduleExam")}>
                קבע מבחן חדש
              </button>
            </div>

            {loadingExams ? (
              <p>טוען מבחנים...</p>
            ) : (!exams.myExams || exams.myExams.length === 0) && (!exams.othersExams || exams.othersExams.length === 0) ? (
              <p>אין מבחנים מתוכננים.</p>
            ) : (
              <>
                {exams.myExams && exams.myExams.length > 0 && (
                  <div className="exams-section">
                    <h3>מבחנים שלך</h3>
                    <div className="exams-grid">
                      {exams.myExams
                        .sort((a, b) => {
                          const dateA = new Date(a.date);
                          dateA.setHours(0, 0, 0, 0);
                          const dateB = new Date(b.date);
                          dateB.setHours(0, 0, 0, 0);
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          
                          const aIsUpcoming = dateA >= now;
                          const bIsUpcoming = dateB >= now;
                          
                          // עתידיים למעלה, עבר למטה
                          if (aIsUpcoming && !bIsUpcoming) return -1;
                          if (!aIsUpcoming && bIsUpcoming) return 1;
                          
                          // בתוך עתידיים - לפי תאריך עולה (הקרוב ביותר למעלה)
                          if (aIsUpcoming && bIsUpcoming) return dateA - dateB;
                          
                          // בתוך עבר - לפי תאריך יורד (החדש ביותר למעלה)
                          return dateB - dateA;
                        })
                        .map((exam, index) => {
                        const examDate = new Date(exam.date);
                        examDate.setHours(0, 0, 0, 0);
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const isUpcoming = examDate >= now;
                        
                        return (
                          <div key={index} className={`exam-card ${isUpcoming ? 'upcoming' : 'past'}`}>
                            <div className="exam-header">
                              <h4>{exam.title || 'מבחן'}</h4>
                              <span className="exam-date">{formatDateFriendly(exam.date)}</span>
                            </div>
                            <div className="exam-details">
                              <p><strong>מקצוע:</strong> {exam.subject || '—'}</p>
                              <p><strong>כיתות:</strong> {exam.classes?.map(c => c.name).join(', ') || '—'}</p>
                              <p><strong>שעה:</strong> {exam.startTime || '—'} - {exam.endTime || '—'}</p>
                            </div>
                            <div className="exam-actions">
                              <button className="btn-small btn-outline" onClick={() => handleEditExam(exam)}>ערוך</button>
                              <button className="btn-small btn-danger" onClick={() => handleDeleteExam(exam)}>מחק</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {exams.othersExams && exams.othersExams.length > 0 && (
                  <div className="exams-section">
                    <h3>מבחנים של מורות אחרות בכיתתך</h3>
                    <div className="exams-grid">
                      {exams.othersExams
                        .sort((a, b) => {
                          const dateA = new Date(a.date);
                          dateA.setHours(0, 0, 0, 0);
                          const dateB = new Date(b.date);
                          dateB.setHours(0, 0, 0, 0);
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          
                          const aIsUpcoming = dateA >= now;
                          const bIsUpcoming = dateB >= now;
                          
                          // עתידיים למעלה, עבר למטה
                          if (aIsUpcoming && !bIsUpcoming) return -1;
                          if (!aIsUpcoming && bIsUpcoming) return 1;
                          
                          // בתוך עתידיים - לפי תאריך עולה (הקרוב ביותר למעלה)
                          if (aIsUpcoming && bIsUpcoming) return dateA - dateB;
                          
                          // בתוך עבר - לפי תאריך יורד (החדש ביותר למעלה)
                          return dateB - dateA;
                        })
                        .map((exam, index) => {
                        const examDate = new Date(exam.date);
                        examDate.setHours(0, 0, 0, 0);
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const isUpcoming = examDate >= now;
                        
                        return (
                          <div key={index} className={`exam-card ${isUpcoming ? 'upcoming' : 'past'} readonly`}>
                            <div className="exam-header">
                              <h4>{exam.title || 'מבחן'}</h4>
                              <span className="exam-date">{formatDateFriendly(exam.date)}</span>
                            </div>
                            <div className="exam-details">
                              <p><strong>מקצוע:</strong> {exam.subject || '—'}</p>
                              <p><strong>כיתות:</strong> {exam.classes?.map(c => c.name).join(', ') || '—'}</p>
                              <p><strong>שעה:</strong> {exam.startTime || '—'} - {exam.endTime || '—'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* מודל פשוט שמציג טפסים — חיבור לכפתורי השליחה לדוגמא */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {modalType === "reportAbsence" && "דיווח היעדרות"}
                  {modalType === "scheduleExam" && "קביעת מבחן"}
                  {modalType === "editExam" && "עריכת מבחן"}
                </h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>

              <div className="modal-body">
                {modalType === "reportAbsence" && (
                  <AbsenceForm onSubmit={handleSubmitAbsence} onCancel={closeModal} showNotification={showNotification} />
                )}



                {modalType === "scheduleExam" && (
                  <ExamForm onSubmit={handleCreateExam} onCancel={closeModal} showNotification={showNotification} me={me} />
                )}
                
                {modalType === "editExam" && (
                  <ExamForm onSubmit={handleUpdateExam} onCancel={closeModal} showNotification={showNotification} me={me} editingExam={editingExam} />
                )}
                
                {modalType === "createSchedule" && (
                  <CreateScheduleForm onSubmit={handleCreateSchedule} onCancel={closeModal} showNotification={showNotification} me={me} />
                )}
              </div>
            </div>
          </div>
        )}

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

/* --- רכיב עזר ליצירת מערכת שלמה --- */
function CreateScheduleForm({ onSubmit, onCancel, showNotification, me }) {
  const [weekPlan, setWeekPlan] = useState({
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: []
  });
  const [loading, setLoading] = useState(true);

  const dayLabels = {
    sunday: "ראשון",
    monday: "שני",
    tuesday: "שלישי",
    wednesday: "רביעי",
    thursday: "חמישי",
    friday: "שישי"
  };

  // איניציאליזציה של המערכת לפי מספר השעות
  useEffect(() => {
    if (me?.schoolId?.scheduleHours) {
      const numHours = me.schoolId.scheduleHours.length;
      const emptyLessons = Array(numHours).fill().map(() => ({ teacherId: "", subject: "" }));
      
      const initialWeekPlan = {
        sunday: [...emptyLessons],
        monday: [...emptyLessons],
        tuesday: [...emptyLessons],
        wednesday: [...emptyLessons],
        thursday: [...emptyLessons],
        friday: [...emptyLessons]
      };
      
      setWeekPlan(initialWeekPlan);
      setLoading(false);
    }
  }, [me]);

  const updateLesson = (day, lessonIndex, field, value) => {
    setWeekPlan(prev => ({
      ...prev,
      [day]: prev[day].map((lesson, index) => 
        index === lessonIndex ? { ...lesson, [field]: value } : lesson
      )
    }));
  };

  const handleSubmit = () => {
    if (!me?.ishomeroom) {
      if (showNotification) {
        showNotification("רק מחנכים יכולים לעדכן מערכת שעות", 'error');
      }
      return;
    }

    const homeroomClass = me?.classes?.find(cls => 
      cls.homeroomTeacher && cls.homeroomTeacher._id === me._id
    );
    
    if (!homeroomClass) {
      if (showNotification) {
        showNotification("לא נמצאה כיתה שאתה מחנך בה", 'error');
      }
      return;
    }

    const payload = { 
      className: homeroomClass.name, 
      weekPlan 
    };
    onSubmit(payload);
  };

  if (loading) {
    return <div className="schedule-form"><p>טוען...</p></div>;
  }

  return (
    <div className="schedule-form">
      <div className="form-header">
        <h3>יצירת מערכת שלמה</h3>
        <p>כיתה: {!me?.ishomeroom ? "אתה לא מחנך" : (me?.classes?.find(cls => cls.homeroomTeacher && cls.homeroomTeacher._id === me._id)?.name || "לא נמצא")}</p>
      </div>

      <div className="week-schedule">
        {Object.keys(weekPlan).map(day => (
          <div key={day} className="day-schedule">
            <h4>{dayLabels[day]}</h4>
            {weekPlan[day].map((lesson, lessonIndex) => {
              const scheduleHour = me?.schoolId?.scheduleHours?.[lessonIndex];
              return (
                <div key={lessonIndex} className="lesson-input-row">
                  <div className="lesson-info">
                    <span className="lesson-number">שעה {lessonIndex + 1}</span>
                    {scheduleHour && (
                      <span className="lesson-time">({scheduleHour.start} - {scheduleHour.end})</span>
                    )}
                  </div>
                  <div className="lesson-inputs">
                    <input
                      type="text"
                      placeholder="תעודת זהות מורה"
                      value={lesson.teacherId}
                      onChange={(e) => updateLesson(day, lessonIndex, 'teacherId', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="מקצוע"
                      value={lesson.subject}
                      onChange={(e) => updateLesson(day, lessonIndex, 'subject', e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={handleSubmit}>
          שמור מערכת
        </button>
        <button className="btn btn-outline" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </div>
  );
}

/* --- רכיב עזר לעדכון יום ספציפי --- */
function UpdateDayForm({ onSubmit, showNotification, me }) {
  const [day, setDay] = useState("sunday");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // איניציאליזציה של השיעורים לפי מספר השעות בבית הספר
  useEffect(() => {
    if (me?.schoolId?.scheduleHours) {
      const numHours = me.schoolId.scheduleHours.length;
      const initialLessons = Array(numHours).fill().map(() => ({ teacherId: "", subject: "" }));
      setLessons(initialLessons);
      setLoading(false);
    }
  }, [me]);

  const dayOptions = [
    { value: "sunday", label: "ראשון" },
    { value: "monday", label: "שני" },
    { value: "tuesday", label: "שלישי" },
    { value: "wednesday", label: "רביעי" },
    { value: "thursday", label: "חמישי" },
    { value: "friday", label: "שישי" }
  ];

  const updateLesson = (index, field, value) => {
    const newLessons = [...lessons];
    newLessons[index][field] = value;
    setLessons(newLessons);
  };

  const handleSubmit = () => {
    if (!me?.ishomeroom) {
      if (showNotification) {
        showNotification("רק מחנכים יכולים לעדכן מערכת שעות", 'error');
      }
      return;
    }

    const homeroomClass = me?.classes?.find(cls => 
      cls.homeroomTeacher && cls.homeroomTeacher._id === me._id
    );
    
    if (!homeroomClass) {
      if (showNotification) {
        showNotification("לא נמצאה כיתה שאתה מחנך בה", 'error');
      }
      return;
    }

    const payload = { className: homeroomClass.name, day, lessons };
    onSubmit(payload);
  };

  return (
    <div className="update-day-form">
      <div className="form-row">
        <div className="form-group">
          <label>כיתת החינוך שלך</label>
          <input 
            type="text" 
            value={(() => {
              if (!me?.classes) return "טוען...";
              if (!me?.ishomeroom) return "אתה לא מחנך - אין הרשאה לעדכן מערכת";
              const homeroomClass = me.classes.find(cls => 
                cls.homeroomTeacher && cls.homeroomTeacher._id === me._id
              );
              return homeroomClass?.name || "לא נמצאה כיתה שאתה מחנך בה";
            })()}
            disabled
            style={{ backgroundColor: '#f7fafc', color: '#4a5568' }}
          />
        </div>
        <div className="form-group">
          <label>יום בשבוע</label>
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            {dayOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <h4>שיעורים</h4>
      {loading ? (
        <p>טוען...</p>
      ) : (
        lessons.map((lesson, index) => {
          const scheduleHour = me?.schoolId?.scheduleHours?.[index];
          return (
            <div key={index} className="lesson-row">
              <div className="lesson-info">
                <span className="lesson-number">שעה {index + 1}</span>
                {scheduleHour && (
                  <span className="lesson-time">({scheduleHour.start} - {scheduleHour.end})</span>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input 
                    type="text" 
                    value={lesson.teacherId} 
                    onChange={(e) => updateLesson(index, 'teacherId', e.target.value)}
                    placeholder="תעודת זהות מורה"
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="text" 
                    value={lesson.subject} 
                    onChange={(e) => updateLesson(index, 'subject', e.target.value)}
                    placeholder="מקצוע"
                  />
                </div>
              </div>
            </div>
          );
        })
      )}

      <button className="btn btn-primary" onClick={handleSubmit}>
        שמור עדכון יום
      </button>
    </div>
  );
}

/* --- רכיב עזר לטופס בקשת היעדרות --- */
function AbsenceForm({ onSubmit, onCancel, showNotification }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [start, setStart] = useState("08:30");
  const [end, setEnd] = useState("12:00");
  const [reason, setReason] = useState("");

  const handleSend = () => {
    if (!reason.trim()) {
      if (showNotification) {
        showNotification("חובה להכניס סיבת היעדרות", 'error');
      } else {
        alert("חובה להכניס סיבת היעדרות");
      }
      return;
    }
    const payload = {
      date,
      startTime: start,
      endTime: end,
      reason,
    };
    onSubmit(payload);
  };

  return (
    <div className="absence-form">
      <div className="form-group">
        <label>תאריך היעדרות</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>שעת התחלה</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="form-group">
          <label>שעת סיום</label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>סיבת ההיעדרות</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="3" />
      </div>
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={handleSend}>שלח בקשה</button>
        <button className="btn btn-outline" onClick={onCancel}>ביטול</button>
      </div>
    </div>
  );
}

/* --- רכיב עזר לטופס יצירת/עריכת מבחן --- */
function ExamForm({ onSubmit, onCancel, showNotification, me, editingExam }) {
  const [title, setTitle] = useState(editingExam?.title || "");
  const [subject, setSubject] = useState(editingExam?.subject || "");
  const [selectedClasses, setSelectedClasses] = useState(editingExam?.classes?.map(c => c.name) || []);
  const [date, setDate] = useState(editingExam?.date ? new Date(editingExam.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
  const [selectedLessons, setSelectedLessons] = useState(() => {
    if (editingExam?.selectedLessons) return editingExam.selectedLessons;
    return [1];
  });
  const [notes, setNotes] = useState(editingExam?.notes || "");
  const [targetTeacher, setTargetTeacher] = useState(editingExam?.targetTeacher || "");
  const [classScheduleSubjects, setClassScheduleSubjects] = useState([]);
  const [classScheduleTeachers, setClassScheduleTeachers] = useState([]);

  // כיתות שהמורה מלמדת
  const teacherClasses = me?.classes || [];
  const teacherSubjects = me?.subjects || [];
  
  // שליפת מקצועות ממערכת הכיתה למחנכת
  useEffect(() => {
    if (me?.ishomeroom) {
      const fetchClassScheduleSubjects = async () => {
        try {
          const scheduleData = await getHomeroomClassSchedule();
          const subjects = new Set();
          const teachers = new Set();
          scheduleData.forEach(dayObj => {
            dayObj.lessons.forEach(lesson => {
              if (lesson.subject) subjects.add(lesson.subject);
              if (lesson.teacherId && typeof lesson.teacherId === 'object') {
                teachers.add(JSON.stringify(lesson.teacherId));
              }
            });
          });
          setClassScheduleSubjects([...subjects]);
          setClassScheduleTeachers([...teachers].map(t => JSON.parse(t)));
        } catch (err) {
          console.error("Error fetching class schedule data:", err);
        }
      };
      fetchClassScheduleSubjects();
    }
  }, [me?.ishomeroom]);

  const handleClassToggle = (className) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleSubmit = () => {
    if (!title.trim() || !subject.trim() || selectedClasses.length === 0 || selectedLessons.length === 0) {
      if (showNotification) {
        showNotification("חובה למלא את כל השדות החובה ולבחור לפחות כיתה אחת", 'error');
      }
      return;
    }
    
    // בדיקה שהשיעורים רצופים
    const sortedLessons = [...selectedLessons].sort((a, b) => a - b);
    for (let i = 1; i < sortedLessons.length; i++) {
      if (sortedLessons[i] !== sortedLessons[i-1] + 1) {
        if (showNotification) {
          showNotification("השיעורים חייבים להיות רצופים", 'error');
        }
        return;
      }
    }
    
    // חישוב שעות לפי השיעורים הנבחרים
    const schoolHours = me?.schoolId?.scheduleHours || [];
    const minLesson = Math.min(...selectedLessons);
    const maxLesson = Math.max(...selectedLessons);
    const startHour = schoolHours[minLesson - 1];
    const endHour = schoolHours[maxLesson - 1];
    
    const payload = {
      title,
      subject,
      classes: selectedClasses,
      date,
      startTime: startHour?.start || "09:00",
      endTime: endHour?.end || "10:00",
      selectedLessons,
      notes,
      targetTeacher: targetTeacher || undefined
    };
    onSubmit(payload);
  };

  return (
    <div className="exam-form">
      <div className="form-group">
        <label>שם המבחן</label>
        <input 
          type="text" 
          placeholder="הכנס שם המבחן" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      
      {me?.ishomeroom && (
        <div className="form-group">
          <label>מבחן עבור מורה</label>
          <select value={targetTeacher} onChange={(e) => setTargetTeacher(e.target.value)}>
            <option value="">עבורי ({me?.firstName} {me?.lastName})</option>
            {classScheduleTeachers
            .filter(teacher => teacher._id !== me?._id)
            .map(teacher => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.firstName} {teacher.lastName} - {teacher.subjects?.join(', ')}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="form-row">
        <div className="form-group">
          <label>מקצוע</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">בחר מקצוע</option>
            {teacherSubjects.map(subj => (
              <option key={subj} value={subj}>{subj}</option>
            ))}
            {me?.ishomeroom && classScheduleSubjects.length > 0 && (
              <>
                <optgroup label="מקצועות של מורות מקצועיות בכיתת החינוך">
                  {classScheduleSubjects.filter(subj => !teacherSubjects.includes(subj)).map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        </div>
        <div className="form-group">
          <label>תאריך המבחן</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>שיעורים (בחר את השיעורים למבחן)</label>
        <div className="lessons-selection">
          {(me?.schoolId?.scheduleHours || []).map((hour, idx) => (
            <label key={idx} className="lesson-checkbox">
              <input
                type="checkbox"
                checked={selectedLessons.includes(idx + 1)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedLessons([...selectedLessons, idx + 1]);
                  } else {
                    setSelectedLessons(selectedLessons.filter(l => l !== idx + 1));
                  }
                }}
              />
              <span>שיעור {idx + 1} ({hour.start} - {hour.end})</span>
            </label>
          ))}
        </div>
        {selectedLessons.length === 0 && (
          <p className="error-text">חובה לבחור לפחות שיעור אחד</p>
        )}
        {(() => {
          if (selectedLessons.length <= 1) return null;
          const sortedLessons = [...selectedLessons].sort((a, b) => a - b);
          for (let i = 1; i < sortedLessons.length; i++) {
            if (sortedLessons[i] !== sortedLessons[i-1] + 1) {
              return <p className="error-text">השיעורים חייבים להיות רצופים</p>;
            }
          }
          return null;
        })()}
      </div>

      <div className="form-group">
        <label>כיתות (בחר את הכיתות למבחן)</label>
        <div className="classes-selection">
          {teacherClasses.map(cls => (
            <div key={cls._id} className="class-checkbox-item">
              <label className="class-checkbox">
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(cls.name)}
                  onChange={() => handleClassToggle(cls.name)}
                />
                <span className="checkbox-text">{cls.name}</span>
              </label>
            </div>
          ))}
        </div>
        {teacherClasses.length === 0 && (
          <p className="no-classes">אין כיתות משויכות</p>
        )}
      </div>

      <div className="form-group">
        <label>הערות לתלמידים</label>
        <textarea 
          placeholder="הערות או הוראות לתלמידים" 
          rows="3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={handleSubmit}>
          {editingExam ? "עדכן מבחן" : "קבע מבחן"}
        </button>
        <button className="btn btn-outline" onClick={onCancel}>ביטול</button>
      </div>
    </div>
  );
}

// ממיר את הפורמט שמחזיר getScheduleByTeacher למבנה weekPlan לפי ימים
const formatSchedule = (teacherSchedule) => {
  const weekPlan = {
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };

  teacherSchedule.forEach(dayObj => {
    const { day, lessons } = dayObj;
    // מיון לפי lessonNumber אם קיים, אחרת משאיר לפי הסדר
    const sortedLessons = lessons.sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));
    weekPlan[day] = sortedLessons;
  });

  return { weekPlan };
};

const formatDateFriendly = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0,0,0,0); // מאפס שעות, דקות ושניות
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) return "היום";
  if (date.getTime() === tomorrow.getTime()) return "מחר";
  if (date.getTime() === yesterday.getTime()) return "אתמול";

  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export default TeacherDashboard;


