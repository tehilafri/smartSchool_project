import { useState, useEffect } from 'react';
import { getMe } from '../services/userService';
import { getScheduleByTeacher, getHomeroomClassSchedule } from '../services/scheduleService';

export const useDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState(null);
  const [formData, setFormData] = useState({});
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Schedule related state
  const [activeScheduleTab, setActiveScheduleTab] = useState('teachers');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherSchedule, setSelectedTeacherSchedule] = useState(null);
  const [selectedClassSchedule, setSelectedClassSchedule] = useState(null);
  const [showScheduleUpdate, setShowScheduleUpdate] = useState(false);
  const [scheduleUpdateTarget, setScheduleUpdateTarget] = useState({ type: null, id: null, name: null });

  // Load user data
  useEffect(() => {
    const loadMe = async () => {
      try {
        setLoadingMe(true);
        const meRes = await getMe();
        setMe(meRes?.data);
      } catch (err) {
        console.error("getMe error", err);
      } finally {
        setLoadingMe(false);
      }
    };
    loadMe();
  }, []);

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

  // Schedule handlers
  const loadTeacherSchedule = async (teacherId) => {
    try {
      const scheduleData = await getScheduleByTeacher(teacherId);
      const formattedSchedule = formatSchedule(scheduleData);
      setSelectedTeacherSchedule(formattedSchedule);
    } catch (err) {
      console.error('Error loading teacher schedule:', err);
    }
  };

  const loadClassSchedule = async (classId) => {
    try {
      const scheduleData = await getHomeroomClassSchedule(classId);
      if (!scheduleData || scheduleData.length === 0) {
        setSelectedClassSchedule(null);
        return;
      }
      const formattedSchedule = formatSchedule(scheduleData);
      setSelectedClassSchedule(formattedSchedule);
    } catch (err) {
      setSelectedClassSchedule(null);
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
    me,
    setMe,
    loadingMe,
    setLoadingMe,
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