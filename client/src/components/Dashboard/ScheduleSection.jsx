import React from 'react';
import ScheduleTable, { TeacherScheduleView } from './ScheduleTable';

const ScheduleSection = ({
  activeTab,
  setActiveTab,
  teachers,
  classes,
  selectedTeacherId,
  setSelectedTeacherId,
  selectedClassId,
  setSelectedClassId,
  selectedTeacherSchedule,
  selectedClassSchedule,
  events,
  me,
  onEventClick,
  onLoadTeacherSchedule,
  onLoadClassSchedule,
  onOpenScheduleUpdate
}) => {
  return (
    <div className="dashboard-content">
      <h2>מערכת שעות</h2>
      
      <div className="schedule-tabs">
        <button 
          className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('teachers')}
        >
          מערכת מורות
        </button>
        <button 
          className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          מערכת כיתות
        </button>
      </div>
      
      {activeTab === 'teachers' && (
        <div className="teachers-schedule-section">
          <div className="teacher-selector">
            <label>בחר מורה:</label>
            <select 
              value={selectedTeacherId} 
              onChange={(e) => {
                setSelectedTeacherId(e.target.value);
                if (e.target.value) onLoadTeacherSchedule(e.target.value);
              }}
            >
              <option value="">בחר מורה...</option>
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
            </select>
          </div>
          {selectedTeacherId && (
            <>
              {selectedTeacherSchedule ? (
                <TeacherScheduleView 
                  schedule={selectedTeacherSchedule.weekPlan}
                  events={events}
                  teacherInfo={teachers.find(t => t._id === selectedTeacherId)}
                  schoolInfo={me?.schoolId}
                  onEventClick={onEventClick}
                />
              ) : (
                <div className="no-schedule-message">
                  <p>לא הוכנסה מערכת שעות למורה זו</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {activeTab === 'classes' && (
        <div className="classes-schedule-section">
          <div className="class-selector">
            <label>בחר כיתה:</label>
            <select 
              value={selectedClassId} 
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                if (e.target.value) onLoadClassSchedule(e.target.value);
              }}
            >
              <option value="">בחר כיתה...</option>
              {classes.map(cls => (
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
                  schedule={selectedClassSchedule.weekPlan}
                  events={events.filter(event => {
                    const selectedClass = classes.find(c => c._id === selectedClassId);
                    return selectedClass && event.classes?.some(cls => cls.name === selectedClass.name);
                  })}
                  userInfo={{
                    ...me,
                    classes: [classes.find(c => c._id === selectedClassId)]
                  }}
                  onEventClick={onEventClick}
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
                    const selectedClass = classes.find(c => c._id === selectedClassId);
                    onOpenScheduleUpdate('class', selectedClassId, selectedClass?.name);
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
};

export default ScheduleSection;