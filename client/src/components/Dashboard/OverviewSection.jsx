import React from 'react';

const OverviewSection = ({ 
  stats, 
  quickActions, 
  recentActivities, 
  userRole 
}) => {
  return (
    <div className="dashboard-content">
      <h2>סקירה כללית</h2>
      
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {quickActions && quickActions.length > 0 && (
        <div className={`${userRole}-quick-actions`}>
          <h3>פעולות מהירות</h3>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button 
                key={index} 
                className="quick-action-card" 
                onClick={action.onClick}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-text">{action.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {recentActivities && recentActivities.length > 0 && (
        <div className="recent-activities">
          <h3>מה חדש?</h3>
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-time">{activity.time}</span>
                <span className="activity-text">{activity.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;