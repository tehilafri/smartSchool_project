import React from 'react';

const DataTable = ({ 
  columns, 
  data, 
  actions,
  title,
  addButton
}) => {
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
};

export default DataTable;