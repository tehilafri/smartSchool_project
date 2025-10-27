import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import OverviewSection from "./OverviewSection";
import DataTable from "./DataTable";
import DashboardModal from "./DashboardModal";
import ScheduleSection from "./ScheduleSection";
import useDashboard from "../../hooks/useDashboard";
import { useCache } from "../../hooks/useCache";
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
import { connectWebSocket, disconnectWebSocket } from "../../store/middleware/websocketMiddleware";

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
  
  const {
    activeSection,
    setActiveSection,
    showModal,
    modalType,
    modalData,
    formData,
    setFormData,
    selectedEvent,
    setSelectedEvent,
    activeScheduleTab,
    setActiveScheduleTab,
    selectedTeacherId,
    setSelectedTeacherId,
    selectedClassId,
    setSelectedClassId,
    showScheduleUpdate,
    scheduleUpdateTarget,
    openModal,
    closeModal,
    openScheduleUpdate,
    closeScheduleUpdate,
    handleScheduleUpdateSuccess
  } = useDashboard();
  
  const { refreshIfNeeded, forceRefresh } = useCache();
  
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

  const fetchAllData = async (force = false) => {
    try {
      await dispatch(fetchCurrentUser());
      
      if (force) {
        await forceRefresh('all');
        await dispatch(fetchExternalSubstitutes());
      } else {
        await refreshIfNeeded('all');
        await refreshIfNeeded('substitutes');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    dispatch(connectWebSocket());
    
    return () => {
      dispatch(disconnectWebSocket());
    };
  }, [dispatch]);

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
    const today = new Date();
    today.setHours(0,0,0,0);

    const sortedByDistance = events
      .map(event => ({
        ...event,
        distance: Math.abs(new Date(event.date).getTime() - today.getTime())
      }))
      .sort((a, b) => a.distance - b.distance);

    return sortedByDistance.slice(0, 3);
  }, [events]);

  const handleDeleteUser = async (id) => {
    const user = [...teachers, ...students].find(u => u._id === id);
    setConfirmDelete({
      show: true,
      type: 'user',
      item: user,
      action: async () => {
        await deleteUser(id);
        fetchAllData();
        setConfirmDelete({ show: false, type: '', item: null, action: null });
      }
    });
  };

  const handleUpdateUser = async (id) => {
    const classNames = (formData.classes || []).map(id => {
      const cls = classes.find(c => c._id === id);
      return cls ? cls.name : id;
    });
    
    const userData = { ...formData, classes: classNames };
    const user = [...teachers, ...students].find(u => u._id === id);
    
    if (user?.role === 'teacher') {
      dispatch(updateTeacher({ _id: id, ...userData }));
    } else {
      dispatch(updateStudent({ _id: id, ...userData }));
    }
    
    try {
      await updateUser(id, userData);
      closeModal();
    } catch (err) {
      await refreshIfNeeded(user?.role === 'teacher' ? 'teachers' : 'students');
      console.error('Error updating user:', err);
    }
  };

  const handleAddEvent = async () => {
    const classNames = (formData.classes || []).map(id => {
      const cls = classes.find(c => c._id === id);
      return cls ? cls.name : id;
    });
    
    const eventData = { ...formData, classes: classNames };
    const newEvent = { ...eventData, _id: Date.now().toString() };
    
    dispatch(addEventToStore(newEvent));
    
    try {
      await addEvent(eventData);
      closeModal();
      await refreshIfNeeded('events');
    } catch (err) {
      await refreshIfNeeded('events');
      console.error('Error adding event:', err);
    }
  };

  const handleUpdateEvent = async (id) => {
    const classNames = (formData.classes || []).map(cid => {
      const cls = classes.find(c => c._id === cid);
      return cls ? cls.name : cid;
    });
    
    const eventData = { ...formData, classes: classNames };
    
    dispatch(updateEventInStore({ _id: id, ...eventData }));
    
    try {
      await updateEvent(id, eventData);
      closeModal();
    } catch (err) {
      await refreshIfNeeded('events');
      console.error('Error updating event:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    const event = events.find(e => e._id === id);
    setConfirmDelete({
      show: true,
      type: 'event',
      item: event,
      action: async () => {
        await deleteEvent(event.eventId);
        await refreshIfNeeded('events');
        setConfirmDelete({ show: false, type: '', item: null, action: null });
      }
    });
  };

  const handleAddExternalSubstitute = async () => {
    const newSubstitute = { ...formData, identityNumber: formData.identityNumber || Date.now().toString() };
    dispatch(addExternalSubstituteOptimistic(newSubstitute));
    
    try {
      await dispatch(addExternalSubstituteThunk(formData)).unwrap();
      closeModal();
    } catch (err) {
      await refreshIfNeeded('substitutes');
      console.error('Error adding substitute:', err);
    }
  };

  const handleUpdateExternalSubstitute = async (id) => {
    dispatch(updateExternalSubstituteOptimistic({ identityNumber: id, ...formData }));
    
    try {
      await dispatch(updateExternalSubstituteThunk({ id, data: formData })).unwrap();
      closeModal();
    } catch (err) {
      await refreshIfNeeded('substitutes');
      console.error('Error updating substitute:', err);
    }
  };

  const handleDeleteExternalSubstitute = async (identityNumber) => {
    const substitute = substitutes.find(s => s.identityNumber === identityNumber);
    setConfirmDelete({
      show: true,
      type: 'substitute',
      item: substitute,
      action: async () => {
        dispatch(removeExternalSubstituteOptimistic(identityNumber));
        
        try {
          await dispatch(removeExternalSubstituteThunk(identityNumber)).unwrap();
          setConfirmDelete({ show: false, type: '', item: null, action: null });
        } catch (err) {
          await refreshIfNeeded('substitutes');
          console.error('Error deleting substitute:', err);
        }
      }
    });
  };

  const handleAddStudentToClass = async (className, studentId) => {
    await addStudentToClass({ className, studentId });
    closeModal();
    await refreshIfNeeded('students');
  };

  const handleRemoveStudentFromClass = async (className, studentId) => {
    await removeStudentFromClass({ className, studentId });
    closeModal();
    await refreshIfNeeded('students');
  };

  const handleExpandClass = async (classId) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
      setClassStudents([]);
    } else {
      setExpandedClass(classId);
      const className = classes.find(c => c._id === classId)?.name;
      if (className) {
        const students = await getStudentsByName(className);
        setClassStudents(students || []);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <DashboardHeader 
        user={me} 
        onLogout={onLogout}
        onRefresh={() => fetchAllData(true)}
      />
      
      <div className="dashboard-content">
        <DashboardSidebar 
          menuItems={menuItems}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        <main className="dashboard-main">
          {activeSection === "overview" && (
            <OverviewSection 
              teachers={teachers}
              students={students}
              classes={classes}
              events={nearestEvents}
              onEventClick={setSelectedEvent}
            />
          )}
          
          {(activeSection === "teachers" || activeSection === "students") && (
            <DataTable 
              type={activeSection}
              data={activeSection === "teachers" ? teachers : students}
              onEdit={(item) => openModal('edit', activeSection.slice(0, -1), item)}
              onDelete={handleDeleteUser}
              onAdd={() => openModal('add', activeSection.slice(0, -1))}
            />
          )}
          
          {activeSection === "events" && (
            <DataTable 
              type="events"
              data={events}
              onEdit={(item) => openModal('edit', 'event', item)}
              onDelete={handleDeleteEvent}
              onAdd={() => openModal('add', 'event')}
            />
          )}
          
          {activeSection === "classes" && (
            <DataTable 
              type="classes"
              data={classes}
              students={classStudents}
              expandedClass={expandedClass}
              onExpandClass={handleExpandClass}
              onAddStudent={(classId) => openModal('addStudentToClass', 'class', { classId })}
              onRemoveStudent={(className, studentId) => handleRemoveStudentFromClass(className, studentId)}
            />
          )}
          
          {activeSection === "substitutes" && (
            <DataTable 
              type="substitutes"
              data={substitutes}
              loading={substituteLoading}
              onEdit={(item) => openModal('edit', 'substitute', item)}
              onDelete={(item) => handleDeleteExternalSubstitute(item.identityNumber)}
              onAdd={() => openModal('add', 'substitute')}
            />
          )}
          
          {activeSection === "schedule" && (
            <ScheduleSection 
              teachers={teachers}
              classes={classes}
              activeTab={activeScheduleTab}
              onTabChange={setActiveScheduleTab}
              selectedTeacherId={selectedTeacherId}
              selectedClassId={selectedClassId}
              onTeacherSelect={setSelectedTeacherId}
              onClassSelect={setSelectedClassId}
              onLoadTeacherSchedule={loadTeacherSchedule}
              onLoadClassSchedule={loadClassSchedule}
              teacherSchedule={selectedTeacherSchedule}
              classSchedule={selectedClassSchedule}
              onUpdateSchedule={openScheduleUpdate}
            />
          )}
        </main>
      </div>
      
      {showModal && (
        <DashboardModal 
          type={modalType}
          data={modalData}
          formData={formData}
          setFormData={setFormData}
          onSave={modalType === 'event' ? 
            (modalData ? () => handleUpdateEvent(modalData._id) : handleAddEvent) :
            modalType === 'substitute' ?
            (modalData ? () => handleUpdateExternalSubstitute(modalData.identityNumber) : handleAddExternalSubstitute) :
            modalType === 'addStudentToClass' ?
            () => handleAddStudentToClass(classes.find(c => c._id === modalData.classId)?.name, formData.studentId) :
            (modalData ? () => handleUpdateUser(modalData._id) : null)
          }
          onClose={closeModal}
          teachers={teachers}
          students={students}
          classes={classes}
        />
      )}
      
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
      
      {showScheduleUpdate && (
        <ScheduleUpdateComponent 
          target={scheduleUpdateTarget}
          onClose={closeScheduleUpdate}
          onSuccess={handleScheduleUpdateSuccess}
        />
      )}
      
      {confirmDelete.show && (
        <ConfirmDeleteModal 
          type={confirmDelete.type}
          item={confirmDelete.item}
          onConfirm={confirmDelete.action}
          onCancel={() => setConfirmDelete({ show: false, type: '', item: null, action: null })}
        />
      )}
    </div>
  );
};

export default SecretaryDashboard;