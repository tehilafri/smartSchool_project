import React from 'react';

const DataTable = ({ 
  // New format props
  columns, 
  actions,
  title,
  addButton,
  // Legacy format props
  type,
  onEdit,
  onDelete,
  onAdd,
  students,
  expandedClass,
  onExpandClass,
  onAddStudent,
  onRemoveStudent,
  loading,
  data = []
}) => {
  // If using new format with columns
  if (columns) {
    return (
      <div className="dashboard-content">
        <div className="section-header">
          <h2>{title}</h2>
          {addButton && (
            <button className="btn btn-primary" onClick={addButton.onClick}>
              {addButton.text}
            </button>
          )}
        </div>
        
        <div className="data-table">
          <table>
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index}>{column.header}</th>
                ))}
                {actions && <th>פעולות</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>
                      {column.render ? column.render(row) : row[column.key] || "-"}
                    </td>
                  ))}
                  {actions && (
                    <td>
                      {actions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          className={`btn-small ${action.className}`}
                          onClick={() => action.onClick(row)}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Legacy format - handle different types
  const renderContent = () => {
    if (loading) {
      return <div className="loading-message">טוען נתונים...</div>;
    }

    if (!data || data.length === 0) {
      return <div className="no-data-message">אין נתונים להצגה</div>;
    }

    switch (type) {
      case 'teachers':
        return renderTeachersTable();
      case 'students':
        return renderStudentsTable();
      case 'events':
        return renderEventsTable();
      case 'classes':
        return renderClassesTable();
      case 'substitutes':
        return renderSubstitutesTable();
      default:
        return <div>סוג טבלה לא נתמך</div>;
    }
  };

  const renderTeachersTable = () => (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>אימייל</th>
            <th>טלפון</th>
            <th>כיתות</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {data.map((teacher) => (
            <tr key={teacher._id}>
              <td>{teacher.firstName} {teacher.lastName}</td>
              <td>{teacher.email || "-"}</td>
              <td>{teacher.phone || "-"}</td>
              <td>{teacher.classes ? teacher.classes.map(cls => typeof cls === 'object' ? cls.name : cls).join(", ") : "-"}</td>
              <td>
                <button className="btn-small btn-outline" onClick={() => onEdit(teacher)}>✏️</button>
                <button className="btn-small btn-danger" onClick={() => onDelete(teacher._id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStudentsTable = () => (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>אימייל</th>
            <th>טלפון</th>
            <th>כיתה</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {data.map((student) => (
            <tr key={student._id}>
              <td>{student.firstName} {student.lastName}</td>
              <td>{student.email || "-"}</td>
              <td>{student.phone || "-"}</td>
              <td>{student.classes ? student.classes.map(cls => typeof cls === 'object' ? cls.name : cls).join(", ") : "-"}</td>
              <td>
                <button className="btn-small btn-outline" onClick={() => onEdit(student)}>✏️</button>
                <button className="btn-small btn-danger" onClick={() => onDelete(student._id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderEventsTable = () => (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>כותרת</th>
            <th>תיאור</th>
            <th>שעה</th>
            <th>כיתות</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {data.map((event) => (
            <tr key={event._id}>
              <td>{event.date ? new Date(event.date).toLocaleDateString('he-IL') : "-"}</td>
              <td>{event.title || "-"}</td>
              <td>{event.description || "-"}</td>
              <td>{event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : "-"}</td>
              <td>{event.classes ? event.classes.map(cls => typeof cls === 'object' ? cls.name : cls).join(", ") : "-"}</td>
              <td>
                <button className="btn-small btn-outline" onClick={() => onEdit(event)}>✏️</button>
                <button className="btn-small btn-danger" onClick={() => onDelete(event._id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderClassesTable = () => (
    <div className="classes-grid">
      {data.map((cls) => (
        <div className="class-card" key={cls._id}>
          <h3>{cls.name}</h3>
          <p><strong>מחנכ/ת:</strong> {cls.homeroomTeacher ? `${cls.homeroomTeacher.firstName} ${cls.homeroomTeacher.lastName}` : "-"}</p>
          <p><strong>מספר תלמידים:</strong> {cls.students ? cls.students.length : 0}</p>
          <div className="class-actions">
            <button className="btn-small btn-info" onClick={() => onExpandClass(cls._id)}>פרטים</button>
          </div>
          {expandedClass === cls._id && students && (
            <div className="students-list">
              <h4>תלמידים בכיתה {cls.name}</h4>
              {students.length > 0 ? (
                <ul>
                  {students.map((student) => (
                    <li key={student._id}>
                      {student.firstName} {student.lastName} - {student.email}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>אין תלמידים בכיתה זו.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderSubstitutesTable = () => (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>תעודת זהות</th>
            <th>אימייל</th>
            <th>טלפון</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {data.map((substitute) => (
            <tr key={substitute.identityNumber}>
              <td>{substitute.firstName} {substitute.lastName}</td>
              <td>{substitute.identityNumber}</td>
              <td>{substitute.email || "-"}</td>
              <td>{substitute.phone || "-"}</td>
              <td>
                <button className="btn-small btn-outline" onClick={() => onEdit(substitute)}>✏️</button>
                <button className="btn-small btn-danger" onClick={() => onDelete(substitute)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const getTitle = () => {
    switch (type) {
      case 'teachers': return 'ניהול מורים/ות';
      case 'students': return 'ניהול תלמידים';
      case 'events': return 'ניהול אירועים';
      case 'classes': return 'ניהול כיתות';
      case 'substitutes': return 'ממלאי מקום';
      default: return 'נתונים';
    }
  };

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <h2>{getTitle()}</h2>
        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd}>
            הוסף {type === 'teachers' ? 'מורה' : type === 'students' ? 'תלמיד' : type === 'events' ? 'אירוע' : type === 'substitutes' ? 'ממלא מקום' : 'פריט'}
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default DataTable;