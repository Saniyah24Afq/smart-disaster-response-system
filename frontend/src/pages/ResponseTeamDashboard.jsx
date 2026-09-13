import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
  Navigation,
  RefreshCw,
  Play,
  Check,
  Siren,
} from "lucide-react";
import "./ResponseTeamDashboard.css";

const API_URL = "http://localhost:5000";

function ResponseTeamDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const user = JSON.parse(
    localStorage.getItem("resq_user") || "{}"
  );

  const token = localStorage.getItem("resq_token");

  // ============================================
  // FETCH ASSIGNMENTS
  // ============================================

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/assignments/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch assignments"
        );
      }

      setAssignments(
        data.assignments || []
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // ============================================
  // UPDATE STATUS
  // ============================================

  const updateStatus = async (
    assignmentId,
    status
  ) => {
    try {
      setActionLoading(assignmentId);

      const response = await fetch(
        `${API_URL}/api/assignments/${assignmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update status"
        );
      }

      await fetchAssignments();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // STATISTICS
  // ============================================

  const activeAssignments =
    assignments.filter(
      (item) =>
        item.assignment_status !==
        "RESOLVED"
    );

  const resolvedAssignments =
    assignments.filter(
      (item) =>
        item.assignment_status ===
        "RESOLVED"
    );

  const criticalAssignments =
    assignments.filter(
      (item) =>
        item.severity === "CRITICAL" &&
        item.assignment_status !==
          "RESOLVED"
    );

  const inProgressAssignments =
    assignments.filter(
      (item) =>
        item.assignment_status ===
        "IN_PROGRESS"
    ).length;

  // ============================================
  // HELPERS
  // ============================================

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "severity-critical";

      case "HIGH":
        return "severity-high";

      case "MEDIUM":
        return "severity-medium";

      default:
        return "severity-low";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "status-assigned";

      case "IN_PROGRESS":
        return "status-progress";

      case "RESOLVED":
        return "status-resolved";

      default:
        return "";
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <div className="response-loading">
        <div className="loading-ring"></div>

        <h2>
          Loading response center...
        </h2>

        <p>
          Connecting to RESQ emergency network
        </p>
      </div>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <div className="response-dashboard">

      {/* TOP HEADER */}

      <header className="response-header">

        <div className="brand-area">

          <div className="brand-icon">
            <ShieldCheck size={27} />
          </div>

          <div>
            <h1>
              RESQ Response Center
            </h1>

            <p>
              Emergency Response Operations
            </p>
          </div>

        </div>

        <div className="header-actions">

          <div className="online-status">
            <span></span>
            ONLINE
          </div>

          <button
            className="refresh-btn"
            onClick={fetchAssignments}
            title="Refresh assignments"
            type="button"
          >
            <RefreshCw size={18} />
          </button>

          <div className="team-user">

            <div className="avatar">
              {(user.name || "R")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.name ||
                  "Response Team"}
              </strong>

              <small>
                Response Officer
              </small>
            </div>

          </div>

        </div>

      </header>

      {/* HERO */}

      <section className="response-hero">

        <div className="hero-content">

          <div className="hero-label">
            <Siren size={17} />
            RESPONSE TEAM PORTAL
          </div>

          <h2>
            Stay ready.
            <br />
            <span>Save lives.</span>
          </h2>

          <p>
            Monitor assigned emergencies,
            coordinate field operations,
            and resolve incidents faster.
          </p>

        </div>

        <div className="hero-emergency">

          <div className="pulse-circle">
            <AlertTriangle size={38} />
          </div>

          <div>
            <strong>
              {activeAssignments.length}
            </strong>

            <span>
              Active missions
            </span>
          </div>

        </div>

      </section>

      {/* ERROR */}

      {error && (
        <div className="response-error">
          <AlertTriangle size={19} />
          {error}
        </div>
      )}

      {/* STATS */}

      <section className="response-stats">

        <div className="response-stat">

          <div className="stat-icon blue">
            <Navigation size={22} />
          </div>

          <div>
            <span>
              Active Missions
            </span>

            <strong>
              {activeAssignments.length}
            </strong>
          </div>

        </div>

        <div className="response-stat">

          <div className="stat-icon red">
            <AlertTriangle size={22} />
          </div>

          <div>
            <span>
              Critical Alerts
            </span>

            <strong>
              {criticalAssignments.length}
            </strong>
          </div>

        </div>

        <div className="response-stat">

          <div className="stat-icon orange">
            <Clock3 size={22} />
          </div>

          <div>
            <span>
              In Progress
            </span>

            <strong>
              {inProgressAssignments}
            </strong>
          </div>

        </div>

        <div className="response-stat">

          <div className="stat-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>
              Resolved
            </span>

            <strong>
              {resolvedAssignments.length}
            </strong>
          </div>

        </div>

      </section>

      {/* MAIN CONTENT */}

      <main className="response-main">

        <div className="section-heading">

          <div>

            <span className="section-kicker">
              LIVE OPERATIONS
            </span>

            <h2>
              My Assigned Emergencies
            </h2>

          </div>

          <span className="mission-count">
            {assignments.length}{" "}
            {assignments.length === 1
              ? "Mission"
              : "Missions"}
          </span>

        </div>

        {assignments.length === 0 ? (
          <div className="empty-missions">

            <div className="empty-icon">
              <ShieldCheck size={42} />
            </div>

            <h3>
              No missions assigned
            </h3>

            <p>
              You're currently available.
              New emergency assignments will
              appear here.
            </p>

          </div>
        ) : (
          <div className="mission-grid">

            {assignments.map(
              (assignment) => (
                <article
                  className="mission-card"
                  key={assignment.id}
                >

                  {/* CARD TOP */}

                  <div className="mission-top">

                    <div className="mission-type">

                      <div className="incident-icon">
                        <AlertTriangle size={21} />
                      </div>

                      <div>

                        <span>
                          INCIDENT #
                          {assignment.disaster_id}
                        </span>

                        <h3>
                          {assignment.disaster_type}
                        </h3>

                      </div>

                    </div>

                    <span
                      className={`severity-badge ${getSeverityClass(
                        assignment.severity
                      )}`}
                    >
                      {assignment.severity}
                    </span>

                  </div>

                  {/* STATUS */}

                  <div className="mission-status-row">

                    <span
                      className={`mission-status ${getStatusClass(
                        assignment.assignment_status
                      )}`}
                    >
                      <span className="status-dot"></span>

                      {assignment.assignment_status.replace(
                        "_",
                        " "
                      )}
                    </span>

                    {assignment.assignment_status ===
                      "RESOLVED" && (
                      <span className="resolved-label">
                        <CheckCircle2 size={15} />
                        Completed
                      </span>
                    )}

                  </div>

                  {/* DESCRIPTION */}

                  <div className="mission-description">

                    <p>
                      {assignment.description ||
                        "Emergency response required at reported location."}
                    </p>

                  </div>

                  {/* LOCATION */}

                  <div className="mission-details">

                    <div className="detail-item">

                      <MapPin size={18} />

                      <div>

                        <span>
                          Location
                        </span>

                        <strong>
                          {assignment.location}
                        </strong>

                      </div>

                    </div>

                    <div className="detail-item">

                      <Users size={18} />

                      <div>

                        <span>
                          Team
                        </span>

                        <strong>
                          {assignment.team_name}
                        </strong>

                      </div>

                    </div>

                    <div className="detail-item">

                      <Phone size={18} />

                      <div>

                        <span>
                          Team Contact
                        </span>

                        <strong>
                          {assignment.team_phone ||
                            "N/A"}
                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* COORDINATES */}

                  {assignment.latitude &&
                    assignment.longitude && (
                      <div className="coordinates">

                        <MapPin size={15} />

                        <span>
                          {assignment.latitude},{" "}
                          {assignment.longitude}
                        </span>

                      </div>
                    )}

                  {/* ACTIONS */}

                  <div className="mission-actions">

                    {assignment.assignment_status ===
                      "ASSIGNED" && (
                      <button
                        className="action-btn start-btn"
                        disabled={
                          actionLoading ===
                          assignment.id
                        }
                        onClick={() =>
                          updateStatus(
                            assignment.id,
                            "IN_PROGRESS"
                          )
                        }
                        type="button"
                      >
                        <Play
                          size={17}
                          fill="currentColor"
                        />

                        {actionLoading ===
                        assignment.id
                          ? "Starting..."
                          : "Start Response"}
                      </button>
                    )}

                    {assignment.assignment_status ===
                      "IN_PROGRESS" && (
                      <button
                        className="action-btn resolve-btn"
                        disabled={
                          actionLoading ===
                          assignment.id
                        }
                        onClick={() =>
                          updateStatus(
                            assignment.id,
                            "RESOLVED"
                          )
                        }
                        type="button"
                      >
                        <Check size={18} />

                        {actionLoading ===
                        assignment.id
                          ? "Resolving..."
                          : "Mark Resolved"}
                      </button>
                    )}

                    {assignment.assignment_status ===
                      "RESOLVED" && (
                      <div className="completed-box">

                        <CheckCircle2 size={18} />

                        Mission successfully resolved

                      </div>
                    )}

                    {assignment.latitude &&
                      assignment.longitude && (
                        <a
                          className="map-btn"
                          href={`https://www.google.com/maps?q=${assignment.latitude},${assignment.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Navigation size={17} />
                          Navigate
                        </a>
                      )}

                  </div>

                </article>
              )
            )}

          </div>
        )}

      </main>

      {/* FOOTER STATUS */}

      <footer className="response-footer">

        <div>
          <ShieldCheck size={18} />
          <span>
            RESQ Emergency Network
          </span>
        </div>

        <span>
          System operational • Secure connection
        </span>

      </footer>

    </div>
  );
}

export default ResponseTeamDashboard;