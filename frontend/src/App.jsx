import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  Globe2,
  HeartPulse,
  LogIn,
  Eye,
  EyeOff,
  MapPinned,
  Menu,
  ShieldCheck,
  Users,
  Waves,
  X,
  AlertTriangle,
  LockKeyhole,
  UserPlus,
  LogOut,
} from "lucide-react";

import { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ReportDisaster from "./pages/ReportDisaster";
import Signup from "./pages/Signup";
import ResponseTeamDashboard from "./pages/ResponseTeamDashboard";
import Resources from "./pages/Resources";
import ResourceAllocation from "./pages/ResourceAllocation";
import Notifications from "./pages/Notifications";

import "./App.css";

/* =====================================================
   API CONFIGURATION
===================================================== */

const API_URL = "http://localhost:5000";

/* =====================================================
   TOKEN HELPER
===================================================== */

const getValidToken = () => {
  const token = localStorage.getItem("resq_token");

  if (!token) {
    return null;
  }

  const cleanToken = token.trim();
  const parts = cleanToken.split(".");

  if (parts.length !== 3) {
    console.warn("Invalid stored RESQ token. Removing it.");

    localStorage.removeItem("resq_token");
    localStorage.removeItem("resq_user");

    return null;
  }

  return cleanToken;
};

/* =====================================================
   LOGOUT HELPER
===================================================== */

const logoutUser = () => {
  localStorage.removeItem("resq_token");
  localStorage.removeItem("resq_user");

  window.location.href = "/login";
};

/* =====================================================
   LOGIN FORM
===================================================== */

function LoginForm({ standalone = false }) {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Citizen");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoginError("");
    setIsLoggingIn(true);

    try {
      const roleMap = {
        Citizen: "CITIZEN",
        "Response Team": "RESPONSE_TEAM",
        Admin: "ADMIN",
      };

      const selectedRole = roleMap[role];

      localStorage.removeItem("resq_token");
      localStorage.removeItem("resq_user");

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid email or password."
        );
      }

      if (!data.token) {
        throw new Error(
          "Login successful but token was not received."
        );
      }

      if (!data.user) {
        throw new Error(
          "Login successful but user information was not received."
        );
      }

      if (data.user.role !== selectedRole) {
        throw new Error(
          `This account is registered as ${data.user.role}. Please select the correct login role.`
        );
      }

      const cleanToken = String(data.token).trim();

      if (cleanToken.split(".").length !== 3) {
        throw new Error(
          "Server returned an invalid authentication token."
        );
      }

      localStorage.setItem(
        "resq_token",
        cleanToken
      );

      localStorage.setItem(
        "resq_user",
        JSON.stringify(data.user)
      );

      console.log("RESQ login successful");
      console.log("User:", data.user);

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setLoginError(
        error.message ||
          "Something went wrong during login."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      className={
        standalone
          ? "login-modal standalone-login"
          : "login-modal"
      }
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      {!standalone && (
        <button
          type="button"
          className="login-close"
          onClick={() => navigate("/")}
          aria-label="Close login"
        >
          <X size={20} />
        </button>
      )}

      {/* LOGIN VISUAL */}

      <div className="login-visual">
        <div className="login-visual-glow"></div>

        <div className="login-shield">
          <ShieldCheck
            size={42}
            strokeWidth={2}
          />
        </div>

        <span className="login-brand">
          RESQ SMART RESPONSE
        </span>

        <h2>
          Together,
          <br />
          we respond.
        </h2>

        <p>
          Access your disaster response dashboard
          and stay connected when it matters most.
        </p>

        <div className="login-emergency-card">
          <div className="emergency-icon">
            <AlertTriangle size={18} />
          </div>

          <div>
            <strong>
              Emergency network
            </strong>

            <small>
              All systems operational
            </small>
          </div>

          <span className="network-online">
            <i></i>
            ONLINE
          </span>
        </div>

        <div className="login-live">
          <i></i>
          Emergency network online
        </div>
      </div>

      {/* LOGIN FORM */}

      <div className="login-form-area">
        <span className="login-label">
          WELCOME BACK
        </span>

        <h2>
          Sign in to RESQ
        </h2>

        <p className="login-subtitle">
          Continue to your response dashboard.
        </p>

        <form onSubmit={handleLogin}>
          {/* EMAIL */}

          <label htmlFor="login-email">
            Email address
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          {/* PASSWORD */}

          <label htmlFor="login-password">
            Password
          </label>

          <div className="password-wrapper">
            <input
              id="login-password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {/* ROLE */}

          <label>
            Login as
          </label>

          <div className="role-selector">
            <button
              type="button"
              className={
                role === "Citizen"
                  ? "role-btn active"
                  : "role-btn"
              }
              onClick={() =>
                setRole("Citizen")
              }
            >
              <Users size={16} />
              Citizen
            </button>

            <button
              type="button"
              className={
                role === "Response Team"
                  ? "role-btn active"
                  : "role-btn"
              }
              onClick={() =>
                setRole("Response Team")
              }
            >
              <HeartPulse size={16} />
              Response Team
            </button>

            <button
              type="button"
              className={
                role === "Admin"
                  ? "role-btn active admin-role"
                  : "role-btn admin-role"
              }
              onClick={() =>
                setRole("Admin")
              }
            >
              <ShieldCheck size={16} />
              Admin
            </button>
          </div>

          {/* LOGIN ERROR */}

          {loginError && (
            <div
              className="login-error"
              role="alert"
            >
              <AlertTriangle size={16} />

              <span>
                {loginError}
              </span>
            </div>
          )}

          {/* OPTIONS */}

          <div className="login-options">
            <label className="remember">
              <input type="checkbox" />

              <span>
                Remember me
              </span>
            </label>

            <a href="#forgot">
              Forgot password?
            </a>
          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-submit"
            disabled={isLoggingIn}
          >
            {isLoggingIn
              ? "Signing in..."
              : `Sign in as ${role}`}

            {!isLoggingIn && (
              <ArrowRight size={17} />
            )}
          </button>
        </form>

        {/* SIGNUP */}

        <button
          type="button"
          className="signup-link-button"
          onClick={() =>
            navigate("/signup")
          }
        >
          <UserPlus size={16} />

          Don't have an account? Create one
        </button>

        {/* SECURITY */}

        <div className="login-divider">
          <span>
            SECURE ACCESS
          </span>
        </div>

        <p className="login-security">
          <LockKeyhole size={15} />

          Your account is protected with secure
          authentication.
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   STANDALONE LOGIN PAGE
===================================================== */

function LoginPage() {
  return (
    <div className="login-page">
      <LoginForm standalone />
    </div>
  );
}

/* =====================================================
   LANDING PAGE
===================================================== */

function LandingPage() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const openLogin = () => {
    setMenuOpen(false);
    setShowLogin(true);
  };

  const closeLogin = () => {
    setShowLogin(false);
  };

  return (
    <div className="app">

      {/* NAVBAR */}

      <header className="navbar">
        <div className="nav-container">

          <a
            href="#home"
            className="brand"
          >
            <div className="brand-icon">
              <ShieldCheck
                size={25}
                strokeWidth={2.5}
              />
            </div>

            <div className="brand-text">
              <span>
                RESQ
              </span>

              <small>
                SMART RESPONSE
              </small>
            </div>
          </a>

          <nav
            className={`nav-links ${
              menuOpen ? "open" : ""
            }`}
          >
            <a
              href="#home"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Home
            </a>

            <a
              href="#services"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Services
            </a>

            <a
              href="#about"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              About
            </a>

            <a
              href="#contact"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Contact
            </a>

            <button
              type="button"
              className="mobile-login"
              onClick={openLogin}
            >
              <LogIn size={16} />
              Login
            </button>
          </nav>

          <div className="nav-actions">

            <button
              type="button"
              className="notification-btn"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => {
                setMenuOpen(false);
                navigate(
                  "/notifications"
                );
              }}
            >
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            <button
              type="button"
              className="login-btn"
              onClick={openLogin}
            >
              <LogIn size={16} />
              Login
            </button>

            <button
              type="button"
              className="menu-btn"
              aria-label="Toggle menu"
              onClick={() =>
                setMenuOpen(!menuOpen)
              }
            >
              {menuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>

          </div>
        </div>
      </header>

      {/* HERO */}

      <main>

        <section
          className="hero-section"
          id="home"
        >
          <div className="hero-container">

            <div className="hero-content">

              <div
                className="status-pill"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  alignSelf: "flex-start",
                  width: "max-content",
                  minWidth: "max-content",
                  maxWidth: "none",
                  whiteSpace: "nowrap",
                  flexWrap: "nowrap",
                  flexShrink: 0,
                  gap: "9px",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                <span
                  className="status-pulse"
                  style={{
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                ></span>

                <span
                  style={{
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                >
                  24/7 Emergency Response Network
                </span>
              </div>

              <h1>
                Respond Faster.
                <span>
                  Save More Lives.
                </span>
              </h1>

              <p className="hero-description">
                A smart disaster response platform
                connecting citizens, response teams,
                and critical resources when every
                second matters.
              </p>

              <div className="hero-buttons">

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    navigate(
                      "/report-disaster"
                    )
                  }
                >
                  <HeartPulse size={19} />

                  Report an Emergency

                  <ArrowRight size={18} />
                </button>

                <a
                  href="#map"
                  className="secondary-btn"
                >
                  <MapPinned size={18} />

                  Explore Live Map
                </a>

              </div>

              <div className="hero-trust">

                <div className="trust-avatars">
                  <span>R</span>
                  <span>T</span>
                  <span>V</span>
                  <span>+</span>
                </div>

                <div>
                  <strong>
                    Trusted response network
                  </strong>

                  <small>
                    Connecting people with help
                  </small>
                </div>

              </div>
            </div>

            {/* MAP */}

            <div
              className="hero-visual"
              id="map"
            >
              <div className="visual-glow"></div>

              <div className="map-card">

                <div className="map-grid"></div>

                <div className="map-road road-one"></div>
                <div className="map-road road-two"></div>
                <div className="map-road road-three"></div>

                <div className="map-marker marker-red">
                  <span></span>
                </div>

                <div className="map-marker marker-blue">
                  <span></span>
                </div>

                <div className="map-marker marker-green">
                  <span></span>
                </div>

                <div className="map-marker marker-orange">
                  <span></span>
                </div>

                <div className="map-label label-one">
                  <span className="label-dot red"></span>
                  Critical
                </div>

                <div className="map-label label-two">
                  <span className="label-dot green"></span>
                  Safe Zone
                </div>

                <div className="map-label label-three">
                  <span className="label-dot blue"></span>
                  Response Team
                </div>

                <div className="map-overlay">

                  <div>
                    <small>
                      LIVE STATUS
                    </small>

                    <strong>
                      Emergency Network
                    </strong>
                  </div>

                  <span className="live-indicator">
                    <i></i>
                    LIVE
                  </span>

                </div>
              </div>

              {/* RESPONSE CARD */}

              <div className="floating-card response-card">

                <div className="floating-icon blue-icon">
                  <Users size={20} />
                </div>

                <div>
                  <strong>
                    48 Teams
                  </strong>

                  <small>
                    Available now
                  </small>
                </div>

                <CheckCircle2
                  className="check-icon"
                  size={19}
                />

              </div>

              {/* ALERT CARD */}

              <div className="floating-card alert-card">

                <div className="floating-icon orange-icon">
                  <Waves size={20} />
                </div>

                <div>
                  <strong>
                    Flood Alert
                  </strong>

                  <small>
                    2.4 km away
                  </small>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* STATS */}

        <section className="stats-section">

          <div className="stats-container">

            <div className="stat-item">

              <div className="stat-icon">
                <Clock3 size={22} />
              </div>

              <div>
                <strong>
                  &lt; 5 min
                </strong>

                <span>
                  Average response time
                </span>
              </div>

            </div>

            <div className="stat-divider"></div>

            <div className="stat-item">

              <div className="stat-icon">
                <Users size={22} />
              </div>

              <div>
                <strong>
                  1,200+
                </strong>

                <span>
                  Response volunteers
                </span>
              </div>

            </div>

            <div className="stat-divider"></div>

            <div className="stat-item">

              <div className="stat-icon">
                <Globe2 size={22} />
              </div>

              <div>
                <strong>
                  24/7
                </strong>

                <span>
                  Monitoring & support
                </span>
              </div>

            </div>

          </div>
        </section>

        {/* SERVICES */}

        <section
          className="services-section"
          id="services"
        >

          <div className="section-heading">

            <span>
              HOW IT WORKS
            </span>

            <h2>
              One platform.{" "}
              <strong>
                Complete response.
              </strong>
            </h2>

            <p>
              From the first emergency report to
              final resolution, everything is connected
              in one intelligent system.
            </p>

          </div>

          <div className="service-grid">

            <article className="service-card">

              <div className="service-number">
                01
              </div>

              <div className="service-icon red-service">
                <Bell size={24} />
              </div>

              <h3>
                Report Emergency
              </h3>

              <p>
                Citizens can quickly report disasters
                with location, severity, description
                and supporting information.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/report-disaster"
                  )
                }
              >
                Report now
                <ArrowRight size={16} />
              </button>

            </article>

            <article
              className="service-card"
              id="teams"
            >

              <div className="service-number">
                02
              </div>

              <div className="service-icon blue-service">
                <Users size={24} />
              </div>

              <h3>
                Deploy Response Teams
              </h3>

              <p>
                Coordinators verify incidents and
                assign the right response teams based
                on location and emergency severity.
              </p>

              <a href="#teams">
                View teams
                <ArrowRight size={16} />
              </a>

            </article>

            <article
              className="service-card"
              id="resources"
            >

              <div className="service-number">
                03
              </div>

              <div className="service-icon green-service">
                <ShieldCheck size={24} />
              </div>

              <h3>
                Manage Resources
              </h3>

              <p>
                Track food, water, medical kits,
                vehicles, shelters and other critical
                resources in real time.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/resources")
                }
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Explore resources
                <ArrowRight size={16} />
              </button>

            </article>

          </div>
        </section>

        {/* ABOUT */}

        <section
          className="about-section"
          id="about"
        >

          <div className="about-container">

            <div className="about-content">

              <span className="section-label">
                BUILT FOR EMERGENCIES
              </span>

              <h2>
                Technology that keeps
                <span>
                  people connected.
                </span>
              </h2>

              <p>
                RESQ brings disaster reporting,
                incident management, resource
                allocation and response coordination
                together into one centralized platform.
              </p>

              <div className="about-points">

                <div>
                  <CheckCircle2 size={20} />

                  <span>
                    Real-time incident tracking
                  </span>
                </div>

                <div>
                  <CheckCircle2 size={20} />

                  <span>
                    Smart resource allocation
                  </span>
                </div>

                <div>
                  <CheckCircle2 size={20} />

                  <span>
                    Role-based response management
                  </span>
                </div>

              </div>
            </div>

            <div className="about-visual">

              <div className="about-circle circle-one"></div>
              <div className="about-circle circle-two"></div>

              <div className="about-dashboard">

                <div className="mini-header">

                  <span>
                    Response Dashboard
                  </span>

                  <span className="mini-live">
                    LIVE
                  </span>

                </div>

                <div className="mini-chart">

                  <div className="chart-bar bar-one"></div>
                  <div className="chart-bar bar-two"></div>
                  <div className="chart-bar bar-three"></div>
                  <div className="chart-bar bar-four"></div>
                  <div className="chart-bar bar-five"></div>
                  <div className="chart-bar bar-six"></div>

                </div>

                <div className="mini-stats">

                  <div>
                    <strong>
                      86%
                    </strong>

                    <span>
                      Resolved
                    </span>
                  </div>

                  <div>
                    <strong>
                      32
                    </strong>

                    <span>
                      Active
                    </span>
                  </div>

                  <div>
                    <strong>
                      94%
                    </strong>

                    <span>
                      Resources
                    </span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CTA */}

        <section
          className="cta-section"
          id="contact"
        >

          <div className="cta-container">

            <div>

              <span>
                READY WHEN YOU NEED US
              </span>

              <h2>
                Every second counts.
              </h2>

              <p>
                Be prepared. Stay informed. Respond together.
              </p>

            </div>

            <button
              type="button"
              className="cta-btn"
              onClick={openLogin}
            >
              Get Started
              <ArrowRight size={18} />
            </button>

          </div>
        </section>

      </main>

      {/* FOOTER */}

      <footer className="footer">

        <div className="footer-container">

          <div className="footer-brand">

            <a
              href="#home"
              className="brand"
            >

              <div className="brand-icon">
                <ShieldCheck size={22} />
              </div>

              <div className="brand-text">

                <span>
                  RESQ
                </span>

                <small>
                  SMART RESPONSE
                </small>

              </div>

            </a>

            <p>
              Smart technology for faster, safer
              and more coordinated disaster response.
            </p>

          </div>

          <div className="footer-links">

            <div>

              <strong>
                Platform
              </strong>

              <a href="#services">
                Services
              </a>

              <a href="#about">
                About
              </a>

              <a href="#map">
                Live Map
              </a>

            </div>

            <div>

              <strong>
                Emergency
              </strong>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/report-disaster"
                  )
                }
              >
                Report Disaster
              </button>

              <a href="#teams">
                Response Teams
              </a>

              <button
                type="button"
                onClick={() =>
                  navigate("/resources")
                }
              >
                Resources
              </button>

            </div>

          </div>
        </div>

        <div className="footer-bottom">

          <span>
            © 2026 RESQ. Smart Disaster Response System.
          </span>

          <span>
            Built for safer communities.
          </span>

        </div>

      </footer>

      {/* LOGIN MODAL */}

      {showLogin && (
        <div
          className="login-modal-overlay"
          onClick={closeLogin}
        >
          <LoginForm />
        </div>
      )}

    </div>
  );
}

/* =====================================================
   DASHBOARD LOGOUT CONTROL
===================================================== */

function DashboardLogout() {
  const [showLogout, setShowLogout] = useState(false);

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("resq_user") || "{}"
    );
  } catch {
    user = {};
  }

  const userName =
    user.name ||
    user.email?.split("@")[0] ||
    "User";

  const userRole =
    user.role === "RESPONSE_TEAM"
      ? "Response Officer"
      : user.role === "ADMIN"
        ? "Administrator"
        : "Citizen";

  return (
    <div
      style={{
        position: "fixed",
        top: "112px",
        right: "28px",
        zIndex: 9999,
      }}
    >
      <button
        type="button"
        onClick={() =>
          setShowLogout(!showLogout)
        }
        aria-label="Account menu"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          border: "1px solid #dbe5e1",
          background: "#ffffff",
          color: "#0f513f",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "16px",
          boxShadow:
            "0 6px 20px rgba(15, 23, 42, 0.10)",
        }}
        title="Account"
      >
        {(userName.charAt(0) || "U").toUpperCase()}
      </button>

      {showLogout && (
        <div
          style={{
            position: "absolute",
            top: "52px",
            right: "0",
            width: "220px",
            background: "#ffffff",
            border: "1px solid #dce6e2",
            borderRadius: "14px",
            padding: "12px",
            boxShadow:
              "0 16px 40px rgba(15, 23, 42, 0.16)",
          }}
        >
          <div
            style={{
              padding: "8px 9px 12px",
              borderBottom:
                "1px solid #edf2f0",
              marginBottom: "8px",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#0b1f3a",
                fontSize: "14px",
              }}
            >
              {userName}
            </strong>

            <span
              style={{
                display: "block",
                marginTop: "4px",
                color: "#718096",
                fontSize: "12px",
              }}
            >
              {userRole}
            </span>
          </div>

          <button
            type="button"
            onClick={logoutUser}
            style={{
              width: "100%",
              border: "0",
              borderRadius: "10px",
              background: "#fff1f2",
              color: "#dc2626",
              padding: "11px 12px",
              cursor: "pointer",
              fontWeight: 750,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   ROLE BASED DASHBOARD
===================================================== */

function DashboardRouter() {
  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem(
        "resq_user"
      ) || "{}"
    );
  } catch (error) {
    console.error(
      "Unable to read RESQ user:",
      error
    );

    localStorage.removeItem(
      "resq_user"
    );
  }

  const role = user.role;
  const token = getValidToken();

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "15px",
          fontFamily:
            "Inter, sans-serif",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <ShieldCheck size={50} />

        <h2>
          Session expired
        </h2>

        <p>
          Please login again to continue.
        </p>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(
              "resq_token"
            );

            localStorage.removeItem(
              "resq_user"
            );

            window.location.href = "/login";
          }}
          style={{
            padding: "12px 22px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "700",
          }}
        >
          Login Again
        </button>
      </div>
    );
  }

  return (
    <>
      <DashboardLogout />

      {role === "RESPONSE_TEAM" ? (
        <ResponseTeamDashboard />
      ) : (
        <Dashboard />
      )}
    </>
  );
}

/* =====================================================
   APPLICATION ROUTES
===================================================== */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LANDING */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* LOGIN */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={<DashboardRouter />}
        />

        {/* REPORT DISASTER */}

        <Route
          path="/report-disaster"
          element={<ReportDisaster />}
        />

        {/* RESOURCES */}

        <Route
          path="/resources"
          element={<Resources />}
        />

        {/* RESOURCE ALLOCATION */}

        <Route
          path="/resource-allocation"
          element={
            <ResourceAllocation />
          }
        />

        {/* NOTIFICATIONS */}

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        {/* SIGNUP */}

        <Route
          path="/signup"
          element={<Signup />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;