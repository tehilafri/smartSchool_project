import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import HomePage from "./components/HomePage";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout/Layout";

function onLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("schoolId");
  localStorage.removeItem("user");
  window.location.href = "/";
}

function Router() {
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
        <Route path="/forgot-password" element={<Layout ><ForgotPassword /></Layout>} />
        <Route path="/reset-password/:token" element={<Layout ><ResetPassword /></Layout>} />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard onLogout={onLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/secretary"
          element={
            <ProtectedRoute allowedRoles={["secretary"]}>
              <SecretaryDashboard onLogout={onLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboard onLogout={onLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard onLogout={onLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Hero />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;