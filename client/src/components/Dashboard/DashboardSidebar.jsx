import React from 'react';

const DashboardSidebar = ({ 
  activeSection, 
  setActiveSection, 
  menuItems, 
  userRole, 
  onLogout 
}) => {
  const getRoleTitle = () => {
    switch (userRole) {
      case 'admin': return 'פאנל מנהלת';
      case 'teacher': return 'פאנל מורה';
      case 'secretary': return 'פאנל מזכירה';
      case 'student': return 'פאנל תלמיד';
      default: return 'פאנל משתמש';
    }
  };

  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-header" style={{marginTop: 70}}>
        <h2>Smart School</h2>
        <p>{getRoleTitle()}</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
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
  );
};

export default DashboardSidebar;