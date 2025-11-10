import { useState, useEffect } from 'react';
import './ErrorNotification.css';

let showErrorFunction = null;

export const showError = (message) => {
  if (showErrorFunction) {
    showErrorFunction(message);
  }
};

const ErrorNotification = () => {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    showErrorFunction = (message) => {
      const id = Date.now();
      setErrors(prev => [...prev, { id, message }]);
      
      setTimeout(() => {
        setErrors(prev => prev.filter(error => error.id !== id));
      }, 5000);
    };

    return () => {
      showErrorFunction = null;
    };
  }, []);

  const removeError = (id) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  return (
    <div className="error-notifications">
      {errors.map(error => (
        <div key={error.id} className="error-notification">
          <span>{error.message}</span>
          <button onClick={() => removeError(error.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default ErrorNotification;