import React from 'react';

const EventDetailsModal = ({ selectedEvent, onClose }) => {
  if (!selectedEvent) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{selectedEvent.type === 'exam' ? '📄' : '🎯'} {selectedEvent.title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
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
  );
};

export default EventDetailsModal;