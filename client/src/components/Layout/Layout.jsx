import { useEffect, useState } from "react";
import DashboardHeader from "../Dashboard/DashboardHeader";
import Footer from "../Footer/Footer";
import { getMe } from "../../services/userService";
import Header from "../Header/Header";
import "./Layout.css";

const Layout = ({ children, showHeader = true, showFooter = true }) => {
  const [user, setUser] = useState(null);
  const [schoolId, setSchoolId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        const userData = await getMe();
        setUser(userData);
        setSchoolId(userData.schoolId?._id);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    if (showHeader) {
      fetchUser();
    }
  }, [showHeader]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("schoolId");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="layout-container">
      {showHeader && <Header />}
      {showHeader && schoolId && (
        <DashboardHeader schoolId={schoolId} onLogout={handleLogout} />
      )}
      <main className={showHeader ? "main-with-header" : "main-without-header"}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;