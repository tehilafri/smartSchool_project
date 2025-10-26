import React, { useState, useEffect } from 'react';
import { getJewishHolidays } from '../../services/holidayService';
import './HolidayIndicator.css';

const HolidayIndicator = ({ date }) => {
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const response = await getJewishHolidays();
        setHolidays(response.data.holidays || []);
      } catch (error) {
        console.error('Error loading holidays:', error);
      }
    };
    loadHolidays();
  }, []);

  const getHolidayForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.find(holiday => holiday.date === dateStr);
  };

  const holiday = getHolidayForDate(date);

  if (!holiday) return null;

  return (
    <div className="holiday-indicator" title={holiday.hebrew || holiday.title}>
      🎆 {holiday.hebrew || holiday.title}
    </div>
  );
};

export default HolidayIndicator;