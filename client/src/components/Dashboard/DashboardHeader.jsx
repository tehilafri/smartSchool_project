import { useEffect, useState } from "react";
import { getSchoolById } from "../../services/schoolService";
import "./DashboardHeader.css";

const DashboardHeader = ({ schoolId }) => {
  const [logo, setLogo] = useState("");
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    async function fetchSchool() {
      try {
        const school = await getSchoolById(schoolId);
        console.log("Fetched school data:", school);
        let logoUrl = school.imageUrl;
        console.log("Original logo URL:", logoUrl);
        // אם ה-URL יחסי, הפוך אותו למלא
        if (logoUrl && logoUrl.startsWith("/uploads/")) {
          logoUrl = `${window.location.origin}${logoUrl}`;
        }
        // ננסה לטעון את התמונה עם כל סיומת אפשרית אם הראשונה לא עובדת
        if (logoUrl) {
          const extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]; // סדר עדיפויות
          let found = false;
          let base = logoUrl.replace(/\.[^/.]+$/, ""); // מסיר סיומת
          for (let ext of extensions) {
            const testUrl = base + ext;
            try {
              // נבדוק אם הקובץ קיים
              const res = await fetch(testUrl, { method: "HEAD" });
              if (res.ok) {
                setLogo(testUrl);
                console.log("✔️ Loaded logo with URL:", testUrl);
                found = true;
                break;
              }
            } catch {}
          }
          if (!found)
          {
            setLogo(logoUrl); // fallback
            console.log("✔️ Fallback to original logo URL:", logoUrl);
          }
        } else {
          setLogo("");
        }
        setSchoolName(school.name);
      } catch (err) {
        setLogo("");
      }
    }
    if (schoolId) fetchSchool();
  }, [schoolId]);

  return (
    <header className="dashboard-header-fixed">
      <div className="dashboard-header-content">
        <div className="dashboard-header-logo-circle">
          {logo ? (
            <img src={logo} alt="School Logo" className="dashboard-logo-img-circle" onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div className="dashboard-logo-placeholder" />
          )}
        </div>
        <div className="dashboard-header-title">{schoolName}</div>
        {/* Debug info */}
        <div style={{fontSize:12, color:'#888', marginRight:16}}>
          {logo ? `Logo URL: ${logo}` : 'לא נמצאה תמונה'}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
