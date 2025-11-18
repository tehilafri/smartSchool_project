const allowedOrigins = [
     'https://smartschool-project-react-sxbr.onrender.com', 'http://localhost:5173'
  ];
  
  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);  // מאפשר את הגישה
      } else {
        callback(new Error('Not allowed by CORS'));  // לא מאפשר גישה
      }
    },
    credentials: true,  // אם אתה עובד עם cookies או authentication
    optionsSuccessStatus: 200,  // סטטוס מוצלח (ל-Fetch API בדפדפן)
  };
  
export default corsOptions;
