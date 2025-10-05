import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "./Hero/Hero";
import Features from "./Features/Features";
import About from "./About/About";
import Testimonials from "./Testimonials/Testimonials";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";

function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.replace("#", ""));
      if (element) {
        // גלילה חלקה למיקום המבוקש
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <>
      <Header />
      <div id="hero">
        <Hero />
      </div>
      <div id="features">
        <Features />
      </div>
      <div id="about">
        <About />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <Footer />
    </>
  );
}

export default HomePage;