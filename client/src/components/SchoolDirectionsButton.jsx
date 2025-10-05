import React from 'react';
import './SchoolDirectionsButton.css';

const SchoolDirectionsButton = ({ schoolAddress }) => {
  const handleDirectionsClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const googleMapsUrl = `https://www.google.com/maps/dir/${latitude},${longitude}/${encodeURIComponent(schoolAddress)}`;
          window.open(googleMapsUrl, '_blank');
        },
        (error) => {
          // If geolocation fails, open directions without current location
          const googleMapsUrl = `https://www.google.com/maps/dir//${encodeURIComponent(schoolAddress)}`;
          window.open(googleMapsUrl, '_blank');
        }
      );
    } else {
      // If geolocation is not supported
      const googleMapsUrl = `https://www.google.com/maps/dir//${encodeURIComponent(schoolAddress)}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  return (
    <button className="school-directions-btn" onClick={handleDirectionsClick}>
      🗺️ דרך הגעה
    </button>
  );
};

export default SchoolDirectionsButton;