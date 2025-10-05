import { useEffect, useState } from "react";
import { getSchoolById } from "../../services/schoolService";
import { getMe } from "../../services/userService";
import "./DashboardHeader.css";

const DashboardHeader = ({ schoolId, onLogout }) => {
  const [logo, setLogo] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [user, setUser] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // שליפת נתוני בית הספר
        const schoolCode = localStorage.getItem("schoolCode");
        const school = await getSchoolById(schoolCode);
        let logoUrl = school.imageUrl;
        if (logoUrl && logoUrl.startsWith("/uploads/")) {
          logoUrl = `${import.meta.env.VITE_API_URL}${logoUrl}`;
        }
        // if (logoUrl) {
        //   const extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];
        //   let found = false;
        //   let base = logoUrl.replace(/\.[^/.]+$/, "");
        //   for (let ext of extensions) {
        //     const testUrl = base + ext;
        //     try {
        //       const res = await fetch(testUrl, { method: "HEAD" });
        //       if (res.ok) {
        //         setLogo(testUrl);
        //         found = true;
        //         break;
        //       }
        //     } catch {}
        //   }
        //   if (!found) {
        //     setLogo(logoUrl);
        //   }
        // }
        if (logoUrl) {
          setLogo(logoUrl);
        } else {
          setLogo("");
        }
        setSchoolName(school.name);
        
        // שליפת נתוני המשתמש
        const userData = await getMe();
        setUser(userData?.data);
      } catch (err) {
        setLogo("");
      }
    }
    if (schoolId) fetchData();
  }, [schoolId]);

  // סגירת התפריט כשלוחצים מחוץ לו
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAccountMenu && !event.target.closest('.account-menu-container')) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu]);

  const getInitials = () => {
    if (!user) return "";
    const firstInitial = user.firstName?.charAt(0) || "";
    const lastInitial = user.lastName?.charAt(0) || "";
    return (firstInitial + lastInitial).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("schoolId");
    localStorage.removeItem("user");
    if (onLogout) onLogout();
    window.location.href = "/";
  };

  return (
    <header className="dashboard-header-fixed">
      <div className="dashboard-header-content">
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div className="dashboard-header-logo-circle">
            {logo ? (
              <img 
                src={logo} 
                alt="School Logo" 
                className="dashboard-logo-img-circle"
                onError={e => {
                  console.log('Image load error:', e);
                  e.target.src = '/default-school.png'; // תמונת ברירת מחדל בתיקיית public
                }}
              />
            ) : (
              <div className="dashboard-logo-placeholder" />
            )}
          </div>
          <div className="dashboard-header-title">{schoolName}</div>
        </div>
        
        <div className="account-menu-container">
          <button 
            className="account-button"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
          >
            <div className="user-initials">{getInitials()}</div>
            <span className="account-text"></span>
          </button>
          
          {showAccountMenu && (
            <div className="account-dropdown">
              <div className="user-info">
                <span>{user?.firstName} {user?.lastName}</span>
              </div>
              <button className="logout-button" onClick={handleLogout}>
                יציאה
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
