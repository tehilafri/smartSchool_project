import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppDispatch } from "./store/hooks";
import { logout } from "./store/slices/authSlice";
import { clearPersistedState } from "./store/middleware/persistenceMiddleware";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Hero from "./components/Hero/Hero";
import Features from "./components/Features/Features";
import About from "./components/About/About";
import Testimonials from "./components/Testimonials/Testimonials";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import SecretaryDashboard from "./components/Dashboard/SecretaryDashboard";
import StudentDashboard from "./components/Dashboard/StudentDashboard";
import TeacherDashboard from "./components/Dashboard/TeacherDashboard";
import Login from "./components/Auth/Login";
import RegisterSchool from "./components/Auth/RegisterSchool";
import RegisterUser from "./components/Auth/RegisterUser";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import AdminRegistration from "./components/Auth/AdminRegistration";
import ApproveAdmin from "./components/Auth/ApproveAdmin";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import HomePage from "./components/HomePage";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout/Layout";

function Router() {
  const dispatch = useAppDispatch();
  
  const handleLogout = () => {
    clearPersistedState();
    dispatch(logout());
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<Layout showHeader={false}><Features /></Layout>} />
        <Route path="/about" element={<Layout showHeader={false}><About /></Layout>} />
        <Route path="/testimonials" element={<Layout showHeader={false}><Testimonials /></Layout>} />
        <Route path="/login" element={<Layout ><Login /></Layout>} />
        <Route
          path="/register_user"
          element={
            <ProtectedRoute allowedRoles={["admin", "secretary"]}>
              <RegisterUser />
            </ProtectedRoute>
          }
        />
        <Route path="/register_school" element={<Layout ><RegisterSchool /></Layout>} />
        <Route path="/admin-registration" element={<Layout ><AdminRegistration /></Layout>} />
        <Route path="/approve-admin/:token" element={<Layout ><ApproveAdmin /></Layout>} />
        <Route path="/forgot-password" element={<Layout ><ForgotPassword /></Layout>} />
        <Route path="/reset-password/:token" element={<Layout ><ResetPassword /></Layout>} />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/secretary"
          element={
            <ProtectedRoute allowedRoles={["secretary"]}>
              <SecretaryDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Hero />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;