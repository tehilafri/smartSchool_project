import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTeacherSchedule, fetchClassSchedule } from '../store/slices/scheduleSlice';

export const useDashboard = () => {
  const dispatch = useAppDispatch();
  const { teacherSchedules, classSchedules } = useAppSelector((state) => state.schedule);
  
  const [activeSection, setActiveSection] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Schedule related state
  const [activeScheduleTab, setActiveScheduleTab] = useState('teachers');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showScheduleUpdate, setShowScheduleUpdate] = useState(false);
  const [scheduleUpdateTarget, setScheduleUpdateTarget] = useState({ type: null, id: null, name: null });
  
  // Computed values from Redux
  const selectedTeacherSchedule = selectedTeacherId ? teacherSchedules[selectedTeacherId]?.schedule : null;
  const selectedClassSchedule = selectedClassId ? classSchedules[selectedClassId]?.schedule : null;

  // Modal handlers
  const openModal = (type, data = null) => {
    let modalDataCopy = data ? { ...data } : null;
    if (modalDataCopy?.date) {
      modalDataCopy.date = new Date(modalDataCopy.date).toISOString().split("T")[0];
    }
    if (modalDataCopy?.startTime) {
      modalDataCopy.startTime = modalDataCopy.startTime.slice(0,5);
    }
    if (modalDataCopy?.endTime) {
      modalDataCopy.endTime = modalDataCopy.endTime.slice(0,5);
    }
    if (modalDataCopy?.classes && Array.isArray(modalDataCopy.classes) && modalDataCopy.classes.length > 0) {
      if (typeof modalDataCopy.classes[0] === "object" && modalDataCopy.classes[0] !== null) {
        modalDataCopy.classes = modalDataCopy.classes.map(c => c.name);
      }
    }
    setModalType(type);
    setModalData(modalDataCopy);
    setFormData(modalDataCopy || {});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setModalData(null);
    setFormData({});
  };

  // Schedule handlers - עדכון להשתמש ב-Redux
  const loadTeacherSchedule = async (teacherId) => {
    try {
      await dispatch(fetchTeacherSchedule(teacherId));
    } catch (err) {
      console.error('Error loading teacher schedule:', err);
    }
  };

  const loadClassSchedule = async (classId) => {
    try {
      await dispatch(fetchClassSchedule(classId));
    } catch (err) {
      console.error('Error loading class schedule:', err);
    }
  };

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
      const sortedLessons = lessons.sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));
      weekPlan[day] = sortedLessons;
    });

    return { weekPlan };
  };

  const openScheduleUpdate = (type, id, name) => {
    setScheduleUpdateTarget({ type, id, name });
    setShowScheduleUpdate(true);
  };

  const closeScheduleUpdate = () => {
    setShowScheduleUpdate(false);
    setScheduleUpdateTarget({ type: null, id: null, name: null });
  };

  const handleScheduleUpdateSuccess = () => {
    if (scheduleUpdateTarget.type === 'class' && selectedClassId) {
      loadClassSchedule(selectedClassId);
    }
    closeScheduleUpdate();
  };

  return {
    // State
    activeSection,
    setActiveSection,
    showModal,
    setShowModal,
    modalType,
    setModalType,
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
    selectedTeacherSchedule,
    selectedClassSchedule,
    showScheduleUpdate,
    scheduleUpdateTarget,
    
    // Handlers
    openModal,
    closeModal,
    loadTeacherSchedule,
    loadClassSchedule,
    openScheduleUpdate,
    closeScheduleUpdate,
    handleScheduleUpdateSuccess,
    formatSchedule
  };
};

export default useDashboard;