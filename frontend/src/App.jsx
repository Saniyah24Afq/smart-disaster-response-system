
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Globe2,
  HeartPulse,
  LifeBuoy,
  LocateFixed,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  MapPinned,
  Menu,
  Package,
  Radio,
  ShieldCheck,
  Siren,
  TrendingUp,
  UserPlus,
  Users,
  Waves,
  X,
  Zap,
} from "lucide-react";
import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Link,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ReportDisaster from "./pages/ReportDisaster";
import Signup from "./pages/Signup";
import ResponseTeamDashboard from "./pages/ResponseTeamDashboard";
import Resources from "./pages/Resources";
import ResourceAllocation from "./pages/ResourceAllocation";
import Notifications from "./pages/Notifications";
import "./App.css";

const API_URL = "http://localhost:5000";

const ROLE_MAP = {
  Citizen: "CITIZEN",
  "Response Team": "RESPONSE_TEAM",
  Admin: "ADMIN",
};

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function readSavedUser() {
  try {
    const raw =
      localStorage.getItem("resq_user") ||
      sessionStorage.getItem("resq_user");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readSavedToken() {
  const token =
    localStorage.getItem("resq_token") ||
    sessionStorage.getItem("resq_token");

  if (!token || token.split(".").length !== 3) return null;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      clearSession();
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("resq_token");
  localStorage.removeItem("resq_user");
  sessionStorage.removeItem("resq_token");
  sessionStorage.removeItem("resq_user");
}

function getDashboardPath(role) {
  switch (normalizeRole(role)) {
    case "CITIZEN":
      return "/dashboard";
    case "RESPONSE_TEAM":
      return "/response-team";
    case "ADMIN":
      return "/admin";
    default:
      return "/login";
  }
}

/* =========================
   LOGIN FORM
========================= */

function LoginForm({ onClose, standalone = false }) {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("Citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const expectedRole = ROLE_MAP[selectedRole];

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: expectedRole,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Login failed. Please try again."
        );
      }

      const token =
        data.token || data.accessToken || data.access_token;

      const user =
        data.user ||
        data.data?.user ||
        data.data;

      if (!token || typeof token !== "string") {
        throw new Error("The server did not return a login token.");
      }

      if (!user || typeof user !== "object" || Array.isArray(user)) {
        throw new Error(
          "The server response did not include user information."
        );
      }

      const returnedRole = normalizeRole(
        user.role || user.userRole || data.role
      );

      if (!returnedRole) {
        throw new Error(
          "The server did not return your account role. Please check the backend login response."
        );
      }

      if (returnedRole !== expectedRole) {
        throw new Error(
          `This account belongs to ${returnedRole.replace(/_/g, " ")}. Please select the correct role.`
        );
      }

      const normalizedUser = {
        ...user,
        role: returnedRole,
      };

      clearSession();

      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("resq_token", token);
      storage.setItem("resq_user", JSON.stringify(normalizedUser));

      setSuccess("Login successful. Opening your dashboard...");

      const destination = getDashboardPath(returnedRole);

      window.setTimeout(() => {
        if (onClose) onClose();
        navigate(destination, { replace: true });
      }, 300);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the server. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <div
      className={`login-layout ${
        standalone ? "login-layout-standalone" : ""
      }`}
    >
      <aside className="login-visual-panel">
        <Link to="/" className="login-brand" onClick={onClose}>
          <span className="brand-icon">
            <ShieldCheck size={25} />
          </span>
          <span>
            <strong>RESQ</strong>
            <small>SMART RESPONSE</small>
          </span>
        </Link>

        <div className="login-visual-heading">
          <span className="eyebrow-light">
            <Radio size={15} /> EMERGENCY RESPONSE NETWORK
          </span>
          <h1>
            Every second
            <br />
            <span>can save a life.</span>
          </h1>
          <p>
            Connect citizens, response teams, and emergency administrators
            through one coordinated disaster response platform.
          </p>
        </div>

        <div className="login-benefits">
          <div>
            <span className="login-benefit-icon">
              <Clock3 size={18} />
            </span>
            <span>
              <strong>Faster response</strong>
              <small>Coordinate emergency assistance</small>
            </span>
          </div>

          <div>
            <span className="login-benefit-icon">
              <MapPinned size={18} />
            </span>
            <span>
              <strong>Location awareness</strong>
              <small>Keep critical information connected</small>
            </span>
          </div>

          <div>
            <span className="login-benefit-icon">
              <Users size={18} />
            </span>
            <span>
              <strong>Connected teams</strong>
              <small>Support coordinated operations</small>
            </span>
          </div>
        </div>

        <div className="login-security-note">
          <ShieldCheck size={17} />
          RESQ Emergency Coordination Platform
        </div>
      </aside>

      <section className="login-form-panel">
        {!standalone && (
          <button
            type="button"
            className="login-close-button"
            onClick={onClose}
            aria-label="Close login"
          >
            <X size={20} />
          </button>
        )}

        <div className="login-form-container">
          <div className="login-mobile-brand">
            <span className="brand-icon">
              <ShieldCheck size={24} />
            </span>
            <span>
              <strong>RESQ</strong>
              <small>SMART RESPONSE</small>
            </span>
          </div>

          <span className="login-welcome-label">WELCOME BACK</span>
          <h2>Sign in to RESQ</h2>
          <p className="login-subtitle">
            Access your account and emergency response tools.
          </p>

          <div className="role-selector">
            {["Citizen", "Response Team", "Admin"].map((role) => (
              <button
                key={role}
                type="button"
                className={`role-option ${
                  selectedRole === role ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedRole(role);
                  setError("");
                  setSuccess("");
                }}
              >
                {role === "Citizen" && <Users size={17} />}
                {role === "Response Team" && <HeartPulse size={17} />}
                {role === "Admin" && <ShieldCheck size={17} />}
                <span>{role}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="login-email">Email address</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <LogIn size={18} />
              </span>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <LockKeyhole size={18} />
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            <div className="login-form-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password-button"
                onClick={() =>
                  setError(
                    "For password assistance, please contact your system administrator."
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="login-message login-error" role="alert">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="login-message login-success" role="status">
                <CheckCircle2 size={17} />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in securely <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>NEW TO RESQ?</span>
          </div>

          <button
            type="button"
            className="signup-link-button"
            onClick={() => {
              if (onClose) onClose();
              navigate("/signup");
            }}
          >
            <UserPlus size={18} />
            Create an account
            <ArrowRight size={17} />
          </button>

          <div className="login-help-note">
            <ShieldCheck size={16} />
            Secure access for the RESQ response network.
          </div>
        </div>
      </section>
    </div>
  );

  if (standalone) {
    return <div className="login-page">{formContent}</div>;
  }

  return (
    <div
      className="login-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="login-modal">{formContent}</div>
    </div>
  );
}

function LoginPage() {
  return <LoginForm standalone />;
}

/* =========================
   NAVIGATION
========================= */

function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/" || location.pathname === "/login") {
    return null;
  }

  return (
    <button
      type="button"
      className="global-back-button"
      onClick={() => {
        if (window.history.state?.idx > 0) {
          navigate(-1);
        } else {
          navigate("/");
        }
      }}
      aria-label="Go back"
    >
      <ArrowLeft size={18} />
      <span>Back</span>
    </button>
  );
}

/* =========================
   LANDING PAGE
========================= */

function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(
      () => setCurrentTime(new Date()),
      60000
    );

    return () => window.clearInterval(timer);
  }, []);

  function openLogin() {
    setMobileMenuOpen(false);
    setLoginOpen(true);
  }

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div className="resq-app">
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <span className="navbar-logo">
              <ShieldCheck size={27} />
            </span>
            <span className="navbar-brand-text">
              <strong>RESQ</strong>
              <small>SMART RESPONSE</small>
            </span>
          </Link>

          <nav className={`nav-links ${mobileMenuOpen ? "nav-open" : ""}`}>
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#services" onClick={closeMenu}>Services</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <button
              type="button"
              className="mobile-login-button"
              onClick={openLogin}
            >
              <LogIn size={17} /> Login
            </button>
          </nav>

          <div className="navbar-actions">
            <button
              type="button"
              className="navbar-notification"
              onClick={() => navigate("/notifications")}
              aria-label="Open notifications"
              title="Notifications"
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <button
              type="button"
              className="navbar-login-button"
              onClick={openLogin}
            >
              <LogIn size={17} /> Login
            </button>

            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-background-glow hero-glow-one" />
          <div className="hero-background-glow hero-glow-two" />

          <div className="hero-container">
            <div className="hero-copy">
              <div className="hero-status-pill">
                <span className="status-live-dot" />
                <Radio size={15} />
                24/7 Emergency Response Platform
              </div>

              <h1>
                Respond Faster.
                <br />
                <span>Save More Lives.</span>
              </h1>

              <p className="hero-description">
                RESQ brings citizens, response teams, and essential resources
                together to coordinate disaster response when every second
                matters.
              </p>

              {/* Landing page kept informational: no emergency/map action buttons here. */}

              <div className="hero-trust-row">
                <div className="hero-avatar-stack" aria-hidden="true">
                  <span className="hero-avatar avatar-blue"><Users size={16} /></span>
                  <span className="hero-avatar avatar-orange"><HeartPulse size={16} /></span>
                  <span className="hero-avatar avatar-purple"><ShieldCheck size={16} /></span>
                  <span className="hero-avatar avatar-green"><LifeBuoy size={16} /></span>
                </div>
                <div className="hero-trust-copy">
                  <strong>One connected response network</strong>
                  <span>Citizens · Volunteers · Response teams</span>
                </div>
              </div>

              <div className="hero-feature-row">
                <div>
                  <span className="hero-feature-icon feature-red"><Zap size={17} /></span>
                  <span>Rapid reporting</span>
                </div>
                <div>
                  <span className="hero-feature-icon feature-blue"><LocateFixed size={17} /></span>
                  <span>Location-aware</span>
                </div>
                <div>
                  <span className="hero-feature-icon feature-green"><ShieldCheck size={17} /></span>
                  <span>Team coordination</span>
                </div>
              </div>
            </div>

            <div className="hero-visual" id="live-map">
              <div className="map-visual-topbar">
                <div className="map-topbar-title">
                  <span className="map-topbar-icon"><MapPinned size={19} /></span>
                  <span>
                    <strong>Emergency Network</strong>
                    <small>Illustrative operations view</small>
                  </span>
                </div>
                <span className="map-live-badge">
                  <span className="status-live-dot" /> PREVIEW
                </span>
              </div>

              <div className="map-canvas">
                <div className="map-grid" />
                <div className="map-water water-one" />
                <div className="map-water water-two" />
                <div className="map-park park-one"><span>GREEN PARK</span></div>
                <div className="map-park park-two"><span>RIVERSIDE</span></div>
                <div className="map-road road-horizontal road-h-one" />
                <div className="map-road road-horizontal road-h-two" />
                <div className="map-road road-horizontal road-h-three" />
                <div className="map-road road-vertical road-v-one" />
                <div className="map-road road-vertical road-v-two" />
                <div className="map-road road-vertical road-v-three" />
                <div className="map-road road-diagonal road-d-one" />
                <div className="map-road road-diagonal road-d-two" />

                <div className="map-place-label place-label-one">
                  <MapPin size={12} /> CENTRAL AREA
                </div>
                <div className="map-place-label place-label-two">
                  <MapPin size={12} /> NORTH ZONE
                </div>

                <div className="map-route route-one" />
                <div className="map-route route-two" />

                <div className="map-marker marker-critical">
                  <span className="marker-pulse" />
                  <span className="marker-symbol"><AlertTriangle size={17} /></span>
                  <span className="map-marker-label">Critical</span>
                </div>

                <div className="map-marker marker-team">
                  <span className="marker-symbol"><HeartPulse size={17} /></span>
                  <span className="map-marker-label">Response Team</span>
                </div>

                <div className="map-marker marker-safe">
                  <span className="marker-symbol"><ShieldCheck size={17} /></span>
                  <span className="map-marker-label">Safe Zone</span>
                </div>

                <div className="map-marker marker-location">
                  <span className="marker-symbol"><LocateFixed size={18} /></span>
                </div>

                <div className="map-center-status">
                  <span className="status-live-dot" />
                  <span>
                    <strong>NETWORK STATUS</strong>
                    <small>Coordination interface preview</small>
                  </span>
                  <Activity size={20} />
                </div>

                <div className="map-zoom-controls">
                  <button type="button" disabled aria-label="Zoom in">+</button>
                  <button type="button" disabled aria-label="Zoom out">−</button>
                </div>

                <div className="map-attribution">
                  Conceptual illustration · Not a live GPS map
                </div>
              </div>

              <div className="map-visual-footer">
                <div className="map-footer-item">
                  <span className="map-footer-dot dot-red" />
                  <span>Emergency alert</span>
                </div>
                <div className="map-footer-item">
                  <span className="map-footer-dot dot-blue" />
                  <span>Response team</span>
                </div>
                <div className="map-footer-item">
                  <span className="map-footer-dot dot-green" />
                  <span>Safe zone</span>
                </div>
              </div>

              <div className="floating-response-card">
                <span className="floating-card-icon floating-blue"><Users size={21} /></span>
                <div className="floating-card-copy">
                  <span>Response network</span>
                  <strong>48 Teams</strong>
                  <small><span className="status-live-dot" /> Sample statistic</small>
                </div>
                <ArrowRight size={18} className="floating-card-arrow" />
              </div>

              <div className="floating-alert-card">
                <span className="floating-card-icon floating-red"><Waves size={21} /></span>
                <div className="floating-card-copy">
                  <span>Illustrative alert</span>
                  <strong>Flood Alert</strong>
                  <small>Example alert · 2.4 km</small>
                </div>
                <span className="alert-card-indicator"><AlertTriangle size={17} /></span>
              </div>
            </div>
          </div>

          <div className="hero-bottom-decoration"><span /><span /><span /></div>
        </section>

        <section className="stats-section" aria-label="Platform highlights">
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-icon stat-red"><Clock3 size={23} /></span>
              <div><strong>&lt; 5 min</strong><span>Response time goal</span></div>
            </div>
            <div className="stat-separator" />
            <div className="stat-item">
              <span className="stat-icon stat-blue"><Users size={23} /></span>
              <div><strong>1,200+</strong><span>Volunteer network target</span></div>
            </div>
            <div className="stat-separator" />
            <div className="stat-item">
              <span className="stat-icon stat-green"><Radio size={23} /></span>
              <div><strong>24/7</strong><span>Monitoring concept</span></div>
            </div>
            <div className="stat-separator" />
            <div className="stat-item">
              <span className="stat-icon stat-purple"><Globe2 size={23} /></span>
              <div><strong>One Network</strong><span>Connected coordination</span></div>
            </div>
          </div>
          <p className="stats-disclaimer">
            Illustrative project metrics and goals; not verified real-time operational statistics.
          </p>
        </section>

        <section className="services-section section-padding" id="services">
          <div className="section-container">
            <div className="section-heading">
              <span className="section-eyebrow">
                <span className="eyebrow-line" /> WHAT RESQ OFFERS <span className="eyebrow-line" />
              </span>
              <h2>Everything connected.<br /><span>One mission: save lives.</span></h2>
              <p>
                A coordinated platform designed to bring emergency reporting,
                response operations, and resource management into one place.
              </p>
            </div>

            <div className="services-grid">
              <article className="service-card service-card-red">
                <div className="service-card-top">
                  <span className="service-icon"><Siren size={26} /></span>
                  <span className="service-card-number">01</span>
                </div>
                <h3>Report Emergency</h3>
                <p>Submit an emergency report with incident details so the response workflow can begin.</p>
                <ul className="service-feature-list">
                  <li><CheckCircle2 size={16} /> Incident details</li>
                  <li><CheckCircle2 size={16} /> Location information</li>
                  <li><CheckCircle2 size={16} /> Report tracking workflow</li>
                </ul>
              </article>

              <article className="service-card service-card-blue">
                <div className="service-card-top">
                  <span className="service-icon"><HeartPulse size={26} /></span>
                  <span className="service-card-number">02</span>
                </div>
                <h3>Deploy Response Teams</h3>
                <p>Help response personnel review incidents, coordinate assignments, and manage their workflow.</p>
                <ul className="service-feature-list">
                  <li><CheckCircle2 size={16} /> Incident review</li>
                  <li><CheckCircle2 size={16} /> Team coordination</li>
                  <li><CheckCircle2 size={16} /> Status updates</li>
                </ul>
              </article>

              <article className="service-card service-card-purple">
                <div className="service-card-top">
                  <span className="service-icon"><Package size={26} /></span>
                  <span className="service-card-number">03</span>
                </div>
                <h3>Manage Resources</h3>
                <p>Organize emergency supplies and allocation workflows to support better coordination.</p>
                <ul className="service-feature-list">
                  <li><CheckCircle2 size={16} /> Resource inventory</li>
                  <li><CheckCircle2 size={16} /> Allocation workflow</li>
                  <li><CheckCircle2 size={16} /> Resource monitoring</li>
                </ul>
              </article>
            </div>

          </div>
        </section>

        <section className="about-section section-padding" id="about">
          <div className="section-container about-container">
            <div className="about-visual">
              <div className="about-visual-background" />
              <div className="about-dashboard-window">
                <div className="about-window-header">
                  <div className="about-window-brand">
                    <span><ShieldCheck size={17} /></span>
                    <strong>RESQ Operations</strong>
                  </div>
                  <span className="about-window-live"><span className="status-live-dot" /> PREVIEW</span>
                </div>
                <div className="about-window-body">
                  <div className="about-window-title">
                    <div><span>OVERVIEW</span><h3>Response Dashboard</h3></div>
                    <span className="about-window-date"><Clock3 size={14} /> Sample view</span>
                  </div>
                  <div className="about-mini-stats">
                    <div className="about-mini-stat mini-stat-red">
                      <span><AlertTriangle size={17} /></span><small>Incidents</small><strong>24</strong><em>Sample data</em>
                    </div>
                    <div className="about-mini-stat mini-stat-blue">
                      <span><Users size={17} /></span><small>Teams</small><strong>32</strong><em>Sample data</em>
                    </div>
                    <div className="about-mini-stat mini-stat-green">
                      <span><Package size={17} /></span><small>Resources</small><strong>94%</strong><em>Illustrative value</em>
                    </div>
                  </div>
                  <div className="about-chart-card">
                    <div className="about-chart-heading">
                      <div><strong>Response activity</strong><span>Illustrative activity chart</span></div>
                      <TrendingUp size={19} />
                    </div>
                    <div className="about-chart">
                      <div className="chart-y-labels"><span>100</span><span>75</span><span>50</span><span>25</span></div>
                      <div className="chart-bars">
                        {[35,48,42,67,55,76,61,85,70,92,78,100].map((height, index) => (
                          <div className="chart-bar-column" key={index}>
                            <span className={`chart-bar ${index === 9 ? "chart-bar-highlight" : ""}`} style={{ height: `${height}%` }} />
                            <small>{["M","T","W","T","F","S"][index % 6]}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="about-window-footer">
                    <span><CheckCircle2 size={15} /> Dashboard concept</span>
                    <span>RESQ · Smart Response</span>
                  </div>
                </div>
              </div>
              <div className="about-floating-badge about-badge-top">
                <span className="about-badge-icon badge-icon-green"><CheckCircle2 size={19} /></span>
                <span><strong>Connected workflows</strong><small>Designed for coordination</small></span>
              </div>
              <div className="about-floating-badge about-badge-bottom">
                <span className="about-badge-icon badge-icon-purple"><Activity size={19} /></span>
                <span><strong>Centralized overview</strong><small>Project dashboard preview</small></span>
              </div>
            </div>

            <div className="about-copy">
              <span className="section-eyebrow about-eyebrow"><span className="eyebrow-line" /> ABOUT RESQ</span>
              <h2>Technology that<br />keeps people <span>connected.</span></h2>
              <p className="about-description">
                RESQ is a Smart Disaster Response System project built around
                a simple idea: make emergency information easier to report,
                review, and coordinate.
              </p>
              <div className="about-benefits">
                <div className="about-benefit">
                  <span className="about-benefit-icon benefit-red"><AlertTriangle size={21} /></span>
                  <div><h3>Structured incident reporting</h3><p>Capture emergency details and support an organized incident-reporting workflow.</p></div>
                </div>
                <div className="about-benefit">
                  <span className="about-benefit-icon benefit-blue"><Users size={21} /></span>
                  <div><h3>Role-based coordination</h3><p>Provide separate workflows for citizens, response teams, and administrators.</p></div>
                </div>
                <div className="about-benefit">
                  <span className="about-benefit-icon benefit-green"><Package size={21} /></span>
                  <div><h3>Resource management</h3><p>Organize resource records and allocation activities to support emergency operations.</p></div>
                </div>
                <div className="about-benefit">
                  <span className="about-benefit-icon benefit-purple"><Bell size={21} /></span>
                  <div><h3>Centralized updates</h3><p>Keep notifications and operational information accessible through the application.</p></div>
                </div>
              </div>
              <button type="button" className="primary-button about-cta-button" onClick={openLogin}>
                Explore the platform <ArrowRight size={19} />
              </button>
            </div>
          </div>
        </section>

        <section className="workflow-section section-padding">
          <div className="section-container">
            <div className="section-heading">
              <span className="section-eyebrow"><span className="eyebrow-line" /> HOW IT WORKS <span className="eyebrow-line" /></span>
              <h2>From alert to action.<br /><span>A coordinated workflow.</span></h2>
              <p>A clear workflow helps different users work toward a common emergency response objective.</p>
            </div>
            <div className="workflow-steps">
              <article className="workflow-step">
                <div className="workflow-step-number">01</div>
                <span className="workflow-step-icon step-icon-red"><Siren size={25} /></span>
                <h3>Report</h3>
                <p>A citizen submits incident details through the reporting interface.</p>
                <span className="workflow-step-caption">INCIDENT INPUT</span>
              </article>
              <div className="workflow-connector"><ArrowRight size={22} /></div>
              <article className="workflow-step">
                <div className="workflow-step-number">02</div>
                <span className="workflow-step-icon step-icon-blue"><Activity size={25} /></span>
                <h3>Review</h3>
                <p>Authorized users review the incident and coordinate the next steps.</p>
                <span className="workflow-step-caption">INCIDENT REVIEW</span>
              </article>
              <div className="workflow-connector"><ArrowRight size={22} /></div>
              <article className="workflow-step">
                <div className="workflow-step-number">03</div>
                <span className="workflow-step-icon step-icon-purple"><HeartPulse size={25} /></span>
                <h3>Respond</h3>
                <p>Response teams use their assigned workflow to coordinate operations.</p>
                <span className="workflow-step-caption">TEAM COORDINATION</span>
              </article>
              <div className="workflow-connector"><ArrowRight size={22} /></div>
              <article className="workflow-step">
                <div className="workflow-step-number">04</div>
                <span className="workflow-step-icon step-icon-green"><CheckCircle2 size={25} /></span>
                <h3>Update</h3>
                <p>Incident and resource information can be updated as the workflow progresses.</p>
                <span className="workflow-step-caption">STATUS UPDATES</span>
              </article>
            </div>
          </div>
        </section>

        <section className="cta-section" id="contact">
          <div className="cta-decoration cta-decoration-one" />
          <div className="cta-decoration cta-decoration-two" />
          <div className="cta-decoration cta-decoration-three" />
          <div className="cta-container">
            <div className="cta-icon"><HeartPulse size={31} /></div>
            <span className="cta-eyebrow"><span className="status-live-dot" /> BUILT FOR COORDINATED RESPONSE</span>
            <h2>Every second <span>counts.</span></h2>
            <p>Explore RESQ's emergency reporting, response-team, and resource coordination workflows.</p>
            <div className="cta-actions">
              <button type="button" className="cta-primary-button" onClick={openLogin}>Get Started <ArrowRight size={19} /></button>
            </div>
            <div className="cta-trust-line"><ShieldCheck size={16} /> Smart Disaster Response System <span className="cta-trust-separator">•</span> RESQ Project Platform</div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand-column">
            <Link to="/" className="footer-brand">
              <span className="footer-brand-icon"><ShieldCheck size={25} /></span>
              <span><strong>RESQ</strong><small>SMART RESPONSE</small></span>
            </Link>
            <p>Connecting emergency reports, response teams, and resource coordination through one smart disaster response platform.</p>
            <div className="footer-status"><span className="status-live-dot" /><span>Emergency coordination project</span></div>
          </div>
          <div className="footer-links-column">
            <h3>Platform</h3>
            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#about">About RESQ</a>
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
          </div>
          <div className="footer-contact-column">
            <h3>Our mission</h3>
            <div className="footer-contact-item"><span><HeartPulse size={18} /></span><p><strong>People first</strong><small>Designed around emergency coordination</small></p></div>
            <div className="footer-contact-item"><span><Globe2 size={18} /></span><p><strong>Connected workflows</strong><small>Citizens, teams, and administrators</small></p></div>
            <div className="footer-contact-item"><span><ShieldCheck size={18} /></span><p><strong>One common mission</strong><small>Support faster, organized response</small></p></div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} RESQ Smart Response. Project demonstration interface.</p>
          <div className="footer-bottom-links">
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <button type="button" onClick={openLogin}>Sign in</button>
          </div>
          <span className="footer-clock"><Clock3 size={14} />{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </footer>

      {loginOpen && <LoginForm onClose={() => setLoginOpen(false)} />}
    </div>
  );
}

/* =========================
   ADMIN DASHBOARD
   This dashboard is defined here to avoid requiring an
   AdminDashboard.jsx file that may not exist yet.
========================= */

function AdminDashboard() {
  const navigate = useNavigate();
  const user = readSavedUser();

  const name =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "Administrator";

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <main className="response-dashboard admin-dashboard">
      <header className="response-header">
        <div className="response-brand">
          <div className="response-brand-icon"><ShieldCheck size={25} /></div>
          <div className="response-brand-copy">
            <span className="response-brand-name">RESQ</span>
            <span className="response-brand-subtitle">ADMINISTRATION</span>
          </div>
        </div>
        <div className="response-header-right">
          <div className="response-user">
            <div className="response-user-avatar">{String(name).charAt(0).toUpperCase()}</div>
            <div className="response-user-copy">
              <span className="response-user-name">{name}</span>
              <span className="response-user-role">Administrator</span>
            </div>
          </div>
          <button type="button" className="refresh-btn" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <section className="response-hero">
        <div className="response-hero-content">
          <div className="response-hero-eyebrow">
            <ShieldCheck size={15} /> ADMIN CONTROL CENTER
          </div>
          <h1>Welcome, <span>Administrator.</span></h1>
          <p>
            Access RESQ management modules, oversee resource allocation, and
            review platform notifications from one place.
          </p>
          <div className="response-hero-meta">
            <span><ShieldCheck size={16} /> Administrator access</span>
            <span><Activity size={16} /> Management workspace</span>
          </div>
        </div>
        <div className="response-hero-visual" aria-hidden="true">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-orbit hero-orbit-three" />
          <div className="hero-center-icon"><ShieldCheck size={49} /></div>
        </div>
      </section>

      <section className="response-section">
        <div className="response-section-heading">
          <div>
            <span className="section-eyebrow">ADMINISTRATION</span>
            <h2>Management modules</h2>
            <p>Choose a module to continue managing the RESQ platform.</p>
          </div>
        </div>

        <div className="response-stats">
          <article className="stat-card stat-blue">
            <div className="stat-card-top"><span className="stat-icon"><ShieldCheck size={21} /></span></div>
            <div className="stat-value">Admin</div>
            <div className="stat-label">Current role</div>
          </article>
          <article className="stat-card stat-purple">
            <div className="stat-card-top"><span className="stat-icon"><Package size={21} /></span></div>
            <div className="stat-value">Resources</div>
            <div className="stat-label">Inventory management</div>
          </article>
          <article className="stat-card stat-amber">
            <div className="stat-card-top"><span className="stat-icon"><Activity size={21} /></span></div>
            <div className="stat-value">Allocation</div>
            <div className="stat-label">Resource assignments</div>
          </article>
          <article className="stat-card stat-green">
            <div className="stat-card-top"><span className="stat-icon"><Bell size={21} /></span></div>
            <div className="stat-value">Updates</div>
            <div className="stat-label">Platform notifications</div>
          </article>
        </div>

        <div className="mission-grid">
          <article className="mission-card">
            <div className="mission-card-top">
              <div className="mission-type-icon"><Package size={22} /></div>
              <div className="mission-title-group">
                <div className="mission-eyebrow">MODULE 01</div>
                <h3 className="mission-title">Resources</h3>
              </div>
            </div>
            <p className="mission-description">View and manage the resources available through your RESQ installation.</p>
            <div className="mission-actions">
              <button type="button" className="action-btn" onClick={() => navigate("/resources")}>
                Open resources <ArrowRight size={16} />
              </button>
            </div>
          </article>

          <article className="mission-card">
            <div className="mission-card-top">
              <div className="mission-type-icon"><Activity size={22} /></div>
              <div className="mission-title-group">
                <div className="mission-eyebrow">MODULE 02</div>
                <h3 className="mission-title">Resource allocation</h3>
              </div>
            </div>
            <p className="mission-description">Open the resource allocation module to review available allocation workflows.</p>
            <div className="mission-actions">
              <button type="button" className="action-btn" onClick={() => navigate("/resource-allocation")}>
                Manage allocation <ArrowRight size={16} />
              </button>
            </div>
          </article>

          <article className="mission-card">
            <div className="mission-card-top">
              <div className="mission-type-icon"><Bell size={22} /></div>
              <div className="mission-title-group">
                <div className="mission-eyebrow">MODULE 03</div>
                <h3 className="mission-title">Notifications</h3>
              </div>
            </div>
            <p className="mission-description">View the notification page and check the updates available to your account.</p>
            <div className="mission-actions">
              <button type="button" className="action-btn" onClick={() => navigate("/notifications")}>
                View notifications <ArrowRight size={16} />
              </button>
            </div>
          </article>

          {/* MODULE 04: Disaster reports and response-team assignment */}
          <article className="mission-card">
            <div className="mission-card-top">
              <div className="mission-type-icon"><Siren size={22} /></div>
              <div className="mission-title-group">
                <div className="mission-eyebrow">MODULE 04</div>
                <h3 className="mission-title">Disaster Reports</h3>
              </div>
            </div>
            <p className="mission-description">
              Review disaster reports, verify or reject incidents, and assign available response teams.
            </p>
            <div className="mission-actions">
              <button
                type="button"
                className="action-btn"
                onClick={() => navigate("/admin/disaster-reports")}
              >
                Review reports <ArrowRight size={16} />
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

/* =========================
   ACCOUNT MENU
========================= */

export function DashboardLogout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = readSavedUser();
  const displayName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "RESQ User";
  const displayRole = normalizeRole(user?.role || "USER").replace(/_/g, " ");

  return (
    <div className="dashboard-account-wrapper">
      <button
        type="button"
        className="dashboard-account-button"
        onClick={() => setMenuOpen((value) => !value)}
        aria-expanded={menuOpen}
      >
        <span className="dashboard-account-avatar">
          {String(displayName).charAt(0).toUpperCase()}
        </span>
        <span className="dashboard-account-text">
          <strong>{displayName}</strong>
          <small>{displayRole}</small>
        </span>
        <ChevronRight
          size={17}
          className={menuOpen ? "account-chevron-open" : ""}
        />
      </button>

      {menuOpen && (
        <div className="dashboard-account-menu">
          <div className="dashboard-account-menu-header">
            <strong>{displayName}</strong>
            <small>{user?.email || "Signed-in RESQ account"}</small>
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              navigate("/notifications");
            }}
          >
            <Bell size={17} /> Notifications
          </button>
          <button
            type="button"
            className="account-logout-button"
            onClick={() => {
              clearSession();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================
   ROLE-PROTECTED DASHBOARDS
========================= */

function DashboardRouter({ allowedRole, children }) {
  const navigate = useNavigate();

  const [auth, setAuth] = useState(() => ({
    token: readSavedToken(),
    user: readSavedUser(),
  }));

  useEffect(() => {
    setAuth({
      token: readSavedToken(),
      user: readSavedUser(),
    });
  }, []);

  if (!auth.token || !auth.user) {
    return (
      <div className="session-expired-page">
        <div className="session-expired-card">
          <span className="session-expired-icon">
            <LockKeyhole size={30} />
          </span>
          <h2>Sign in required</h2>
          <p>Please sign in to access this RESQ dashboard.</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/login", { replace: true })}
          >
            <LogIn size={18} /> Login Again
          </button>
          <button
            type="button"
            className="session-home-button"
            onClick={() => navigate("/")}
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  const actualRole = normalizeRole(
    auth.user.role || auth.user.userRole
  );

  if (actualRole !== allowedRole) {
    const correctPath = getDashboardPath(actualRole);

    if (correctPath === "/login") {
      clearSession();
      return <Navigate to="/login" replace />;
    }

    return <Navigate to={correctPath} replace />;
  }

  return children;
}

/* =========================
   APP ROUTES
========================= */

function AppRoutes() {
  return (
    <>
      <BackButton />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Signup />} />

        {/* Citizen dashboard */}
        <Route
          path="/dashboard"
          element={
            <DashboardRouter allowedRole="CITIZEN">
              <Dashboard />
            </DashboardRouter>
          }
        />

        {/* Response Team dashboard */}
        <Route
          path="/response-team"
          element={
            <DashboardRouter allowedRole="RESPONSE_TEAM">
              <ResponseTeamDashboard />
            </DashboardRouter>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={
            <DashboardRouter allowedRole="ADMIN">
              <AdminDashboard />
            </DashboardRouter>
          }
        />

        {/* Admin disaster reports: reuses the existing dashboard and its report actions. */}
        <Route
          path="/admin/disaster-reports"
          element={
            <DashboardRouter allowedRole="ADMIN">
              <Dashboard />
            </DashboardRouter>
          }
        />

        <Route path="/report-disaster" element={<ReportDisaster />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resource-allocation" element={<ResourceAllocation />} />
        <Route path="/notifications" element={<Notifications />} />

        <Route
          path="*"
          element={
            <div className="not-found-page">
              <div className="not-found-card">
                <span className="not-found-icon">
                  <MapPinned size={30} />
                </span>
                <h1>Page not found</h1>
                <p>The page you're looking for doesn't exist or may have been moved.</p>
                <Link to="/" className="primary-button">
                  <ArrowLeft size={18} /> Back to Home
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}