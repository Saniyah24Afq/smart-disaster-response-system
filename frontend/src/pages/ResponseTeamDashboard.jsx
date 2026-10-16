import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  ExternalLink,
  Filter,
  MapPin,
  Navigation,
  Phone,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Siren,
  Users,
  X,
  FileText,
  Send,
  Package,
  ClipboardCheck,
} from "lucide-react";
import "./ResponseTeamDashboard.css";

const API_URL = "http://localhost:5000";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All missions" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
];

const GROUND_CONDITIONS = [
  "Stable",
  "Flooded",
  "Fire / Smoke",
  "Building damage",
  "Road blocked",
  "People trapped",
  "Medical emergency",
  "Unsafe / Critical",
  "Other",
];

const RESOURCE_OPTIONS = [
  "Ambulance",
  "Medical kit",
  "Rescue team",
  "Fire brigade",
  "Food and water",
  "Rescue vehicle",
  "Protective equipment",
  "Temporary shelter",
  "Heavy machinery",
  "Other",
];

function getToken() {
  return localStorage.getItem("resq_token");
}

function getAssignmentId(item) {
  return (
    item?._id ??
    item?.id ??
    item?.assignmentId ??
    item?.assignment?._id ??
    item?.assignment?.id ??
    ""
  );
}

function getReport(item) {
  return (
    item?.disaster ??
    item?.report ??
    item?.emergency ??
    item?.disasterReport ??
    item?.request ??
    {}
  );
}

function getStatus(item) {
  const value = String(
    item?.status ?? item?.assignmentStatus ?? "ASSIGNED"
  ).toUpperCase();

  if (value === "PENDING") return "ASSIGNED";
  if (value === "COMPLETED") return "RESOLVED";

  return value;
}

function getText(...values) {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== ""
  );

  return value === undefined ? "" : String(value);
}

function getLocation(item) {
  const report = getReport(item);
  const location = report?.location ?? item?.location ?? {};

  if (typeof location === "string") {
    return location;
  }

  return getText(
    location?.address,
    location?.formattedAddress,
    location?.name,
    report?.address,
    item?.address,
    report?.locationName,
    "Location not provided"
  );
}

function getCoordinates(item) {
  const report = getReport(item);
  const location = report?.location ?? item?.location ?? {};

  const latitude = Number(
    location?.latitude ??
      location?.lat ??
      report?.latitude ??
      report?.lat ??
      item?.latitude ??
      item?.lat
  );

  const longitude = Number(
    location?.longitude ??
      location?.lng ??
      location?.long ??
      report?.longitude ??
      report?.lng ??
      item?.longitude ??
      item?.lng
  );

  const hasLatitude =
    location?.latitude != null ||
    location?.lat != null ||
    report?.latitude != null ||
    report?.lat != null ||
    item?.latitude != null ||
    item?.lat != null;

  const hasLongitude =
    location?.longitude != null ||
    location?.lng != null ||
    location?.long != null ||
    report?.longitude != null ||
    report?.lng != null ||
    item?.longitude != null ||
    item?.lng != null;

  if (
    hasLatitude &&
    hasLongitude &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  ) {
    return { latitude, longitude };
  }

  return null;
}

function getPriority(item) {
  const report = getReport(item);

  const raw = getText(
    item?.priority,
    report?.priority,
    item?.severity,
    report?.severity,
    item?.urgency,
    report?.urgency,
    "MEDIUM"
  ).toUpperCase();

  if (
    raw.includes("CRITICAL") ||
    raw.includes("URGENT") ||
    raw.includes("HIGH") ||
    raw.includes("SEVERE")
  ) {
    return "HIGH";
  }

  if (raw.includes("LOW") || raw.includes("MINOR")) {
    return "LOW";
  }

  return "MEDIUM";
}

function getEmergencyType(item) {
  const report = getReport(item);

  return getText(
    report?.disasterType,
    report?.emergencyType,
    report?.type,
    report?.category,
    report?.title,
    item?.disasterType,
    item?.emergencyType,
    item?.type,
    item?.title,
    "Emergency response"
  );
}

function getDescription(item) {
  const report = getReport(item);

  return getText(
    report?.description,
    report?.details,
    report?.message,
    item?.description,
    item?.details,
    "Please review the reported emergency and coordinate the appropriate response."
  );
}

function getReporter(item) {
  const report = getReport(item);
  const reporter =
    report?.reportedBy ?? report?.user ?? item?.reportedBy;

  if (typeof reporter === "string") {
    return reporter;
  }

  return getText(
    reporter?.name,
    reporter?.fullName,
    report?.reporterName,
    item?.reporterName,
    "Reporter information unavailable"
  );
}

function getPhone(item) {
  const report = getReport(item);
  const reporter = report?.reportedBy ?? report?.user ?? {};

  return getText(
    reporter?.phone,
    reporter?.phoneNumber,
    report?.phone,
    report?.phoneNumber,
    item?.phone,
    item?.phoneNumber
  );
}

function getDate(item) {
  const report = getReport(item);

  const raw = getText(
    item?.createdAt,
    item?.assignedAt,
    report?.createdAt,
    item?.updatedAt
  );

  if (!raw) {
    return "Date unavailable";
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUserName() {
  try {
    const user = JSON.parse(
      localStorage.getItem("resq_user") || "{}"
    );

    return getText(
      user?.name,
      user?.fullName,
      user?.username,
      "Response Team"
    );
  } catch {
    return "Response Team";
  }
}

function StatusBadge({ status }) {
  const labels = {
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In progress",
    RESOLVED: "Resolved",
  };

  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span className="status-dot" />
      {labels[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`priority-badge priority-${priority.toLowerCase()}`}
    >
      <span className="priority-indicator" />
      {priority === "HIGH"
        ? "High priority"
        : priority === "LOW"
          ? "Low priority"
          : "Medium priority"}
    </span>
  );
}

function StatCard({ label, value, description, tone }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-caption">{description}</span>
      </div>

      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </article>
  );
}

/* =========================================
   FIELD INCIDENT REPORT
   ========================================= */

function FieldIncidentReport({ item, assignmentId, onSubmitted }) {
  const [expanded, setExpanded] = useState(false);
  const [groundCondition, setGroundCondition] = useState("");
  const [affectedPeople, setAffectedPeople] = useState("0");
  const [selectedResources, setSelectedResources] = useState([]);
  const [otherResource, setOtherResource] = useState("");
  const [fieldNotes, setFieldNotes] = useState("");
  const [damageLevel, setDamageLevel] = useState("MODERATE");
  const [rescueProgress, setRescueProgress] = useState("ASSESSMENT");
  const [submitting, setSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  const toggleResource = (resource) => {
    setSelectedResources((current) =>
      current.includes(resource)
        ? current.filter((item) => item !== resource)
        : [...current, resource]
    );
  };

  const resetForm = () => {
    setGroundCondition("");
    setAffectedPeople("0");
    setSelectedResources([]);
    setOtherResource("");
    setFieldNotes("");
    setDamageLevel("MODERATE");
    setRescueProgress("ASSESSMENT");
  };

  const submitReport = async (event) => {
    event.preventDefault();

    if (!assignmentId) {
      setReportError(
        "Assignment ID is missing. Cannot submit this report."
      );
      return;
    }

    if (!groundCondition) {
      setReportError(
        "Please select the current ground condition."
      );
      return;
    }

    if (
      affectedPeople.trim() === "" ||
      !Number.isInteger(Number(affectedPeople)) ||
      Number(affectedPeople) < 0
    ) {
      setReportError("Enter a valid number of affected people.");
      return;
    }

    if (!fieldNotes.trim()) {
      setReportError(
        "Please add field notes about the situation or rescue progress."
      );
      return;
    }

    setSubmitting(true);
    setReportError("");
    setReportSuccess("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Your login session was not found. Please sign in again."
        );
      }

      const resources = [
        ...selectedResources.filter(
          (resource) => resource !== "Other"
        ),
        ...(selectedResources.includes("Other") &&
        otherResource.trim()
          ? [otherResource.trim()]
          : []),
      ];

      const payload = {
        assignmentId,
        groundCondition,
        affectedPeople: Number(affectedPeople),
        resourcesRequired: resources,
        fieldNotes: fieldNotes.trim(),
        damageLevel,
        rescueProgress,
        location: getLocation(item),
        coordinates: getCoordinates(item),
        reportedAt: new Date().toISOString(),
      };

      const response = await fetch(
        `${API_URL}/api/assignments/${encodeURIComponent(
          assignmentId
        )}/incident-report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Could not submit field report (HTTP ${response.status}).`
        );
      }

      setReportSuccess(
        "Field incident report submitted successfully."
      );
      resetForm();
      onSubmitted?.(data);
    } catch (err) {
      setReportError(
        err?.message ||
          "Could not submit the field report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="field-report">
      <button
        type="button"
        className="field-report-toggle"
        onClick={() => {
          setExpanded((current) => !current);
          setReportError("");
        }}
        aria-expanded={expanded}
      >
        <span className="field-report-toggle-icon">
          <FileText size={19} />
        </span>

        <span className="field-report-toggle-copy">
          <strong>Field Incident Report</strong>
          <small>
            Record ground conditions, people affected and rescue updates
          </small>
        </span>

        <span className="field-report-toggle-action">
          {expanded ? "Close" : "Add report"}
        </span>
      </button>

      {expanded && (
        <form className="field-report-form" onSubmit={submitReport}>
          {reportError && (
            <div
              className="field-report-message field-report-error"
              role="alert"
            >
              <AlertTriangle size={17} />
              <span>{reportError}</span>
            </div>
          )}

          {reportSuccess && (
            <div
              className="field-report-message field-report-success"
              role="status"
            >
              <CheckCircle2 size={17} />
              <span>{reportSuccess}</span>
            </div>
          )}

          <div className="field-report-heading">
            <div>
              <span className="section-eyebrow">
                ON-SITE ASSESSMENT
              </span>
              <h4>Submit field observations</h4>
            </div>
            <ClipboardCheck size={23} />
          </div>

          <div className="field-report-grid">
            <label className="field-report-field">
              <span>
                <MapPin size={15} />
                Ground condition *
              </span>

              <select
                value={groundCondition}
                onChange={(event) =>
                  setGroundCondition(event.target.value)
                }
                required
              >
                <option value="">Select current condition</option>
                {GROUND_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-report-field">
              <span>
                <Users size={15} />
                People affected *
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={affectedPeople}
                onChange={(event) =>
                  setAffectedPeople(event.target.value)
                }
                required
              />
            </label>

            <label className="field-report-field">
              <span>
                <AlertTriangle size={15} />
                Damage severity
              </span>

              <select
                value={damageLevel}
                onChange={(event) =>
                  setDamageLevel(event.target.value)
                }
              >
                <option value="LOW">Low</option>
                <option value="MODERATE">Moderate</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
                <option value="UNKNOWN">Not assessed</option>
              </select>
            </label>

            <label className="field-report-field">
              <span>
                <Activity size={15} />
                Rescue progress
              </span>

              <select
                value={rescueProgress}
                onChange={(event) =>
                  setRescueProgress(event.target.value)
                }
              >
                <option value="ASSESSMENT">Initial assessment</option>
                <option value="RESCUE_STARTED">Rescue started</option>
                <option value="EVACUATION">
                  Evacuation underway
                </option>
                <option value="MEDICAL_ASSISTANCE">
                  Medical assistance
                </option>
                <option value="AWAITING_SUPPORT">
                  Awaiting support
                </option>
                <option value="COMPLETED">
                  Field operation completed
                </option>
              </select>
            </label>
          </div>

          <div className="field-report-resource-section">
            <div className="field-report-label">
              <Package size={16} />
              Resources required
            </div>

            <div className="field-resource-options">
              {RESOURCE_OPTIONS.map((resource) => (
                <label
                  key={resource}
                  className={`field-resource-option ${
                    selectedResources.includes(resource)
                      ? "field-resource-selected"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedResources.includes(resource)}
                    onChange={() => toggleResource(resource)}
                  />
                  <span>{resource}</span>
                </label>
              ))}
            </div>

            {selectedResources.includes("Other") && (
              <label className="field-report-field field-report-other">
                <span>Specify other resource</span>
                <input
                  type="text"
                  value={otherResource}
                  onChange={(event) =>
                    setOtherResource(event.target.value)
                  }
                  placeholder="Describe the resource required"
                />
              </label>
            )}
          </div>

          <label className="field-report-field field-report-notes">
            <span>
              <ClipboardList size={16} />
              Field notes and rescue observations *
            </span>

            <textarea
              value={fieldNotes}
              onChange={(event) => setFieldNotes(event.target.value)}
              placeholder="Describe the actual ground situation, visible damage, injured or trapped people, rescue actions completed, access problems and support needed..."
              rows={5}
              maxLength={3000}
              required
            />

            <small>{fieldNotes.length}/3000 characters</small>
          </label>

          <div className="field-report-footer">
            <p>
              <ShieldCheck size={15} />
              Report will be associated with this assigned mission.
            </p>

            <div className="field-report-buttons">
              <button
                type="button"
                className="field-report-cancel"
                onClick={() => {
                  resetForm();
                  setReportError("");
                  setReportSuccess("");
                }}
                disabled={submitting}
              >
                Reset
              </button>

              <button
                type="submit"
                className="field-report-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <RefreshCw size={16} className="spin-icon" />
                ) : (
                  <Send size={16} />
                )}
                {submitting
                  ? "Submitting..."
                  : "Submit field report"}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

/* =========================================
   MISSION CARD
   ========================================= */

function MissionCard({
  item,
  onUpdate,
  updatingId,
  onIncidentSubmitted,
}) {
  const report = getReport(item);
  const id = getAssignmentId(item);
  const status = getStatus(item);
  const priority = getPriority(item);
  const type = getEmergencyType(item);
  const location = getLocation(item);
  const coordinates = getCoordinates(item);
  const reporter = getReporter(item);
  const phone = getPhone(item);
  const description = getDescription(item);
  const isUpdating = String(updatingId) === String(id);

  const mapUrl = coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        location
      )}`;

  const nextStatus =
    status === "ASSIGNED"
      ? "IN_PROGRESS"
      : status === "IN_PROGRESS"
        ? "RESOLVED"
        : null;

  const nextLabel =
    status === "ASSIGNED"
      ? "Start mission"
      : status === "IN_PROGRESS"
        ? "Mark as resolved"
        : "Mission resolved";

  const reportedId = getText(
    report?.reportId,
    report?.caseId,
    report?.ticketId,
    report?._id,
    item?.reportId,
    item?.caseId
  );

  return (
    <article className={`mission-card mission-${status.toLowerCase()}`}>
      <div className="mission-card-top">
        <div className="mission-type-icon">
          <Siren size={22} />
        </div>

        <div className="mission-title-group">
          <div className="mission-eyebrow">
            {reportedId
              ? `CASE #${reportedId.slice(-8)}`
              : "EMERGENCY MISSION"}
          </div>

          <h3 className="mission-title">{type}</h3>

          <p className="mission-date">
            <Clock3 size={14} />
            {getDate(item)}
          </p>
        </div>

        <div className="mission-badges">
          <PriorityBadge priority={priority} />
          <StatusBadge status={status} />
        </div>
      </div>

      <p className="mission-description">{description}</p>

      <div className="mission-details">
        <div className="mission-detail-row">
          <span className="detail-icon">
            <MapPin size={17} />
          </span>

          <div className="detail-content">
            <span className="detail-label">Emergency location</span>
            <span className="detail-value">{location}</span>
          </div>

          <a
            className="map-link"
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open emergency location in Google Maps"
          >
            <Navigation size={16} />
            <span>Navigate</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="mission-detail-row">
          <span className="detail-icon">
            <Users size={17} />
          </span>

          <div className="detail-content">
            <span className="detail-label">Reported by</span>
            <span className="detail-value">{reporter}</span>
          </div>
        </div>

        {phone && (
          <div className="mission-detail-row">
            <span className="detail-icon">
              <Phone size={17} />
            </span>

            <div className="detail-content">
              <span className="detail-label">Contact number</span>
              <span className="detail-value">{phone}</span>
            </div>

            <a className="map-link" href={`tel:${phone}`}>
              <Phone size={15} />
              <span>Call</span>
            </a>
          </div>
        )}
      </div>

      <FieldIncidentReport
        item={item}
        assignmentId={id}
        onSubmitted={onIncidentSubmitted}
      />

      <div className="mission-card-footer">
        <div className="mission-footer-note">
          {status === "RESOLVED" ? (
            <>
              <CheckCircle2 size={17} />
              <span>This mission has been completed.</span>
            </>
          ) : status === "IN_PROGRESS" ? (
            <>
              <Activity size={17} />
              <span>Response team is handling this mission.</span>
            </>
          ) : (
            <>
              <CircleAlert size={17} />
              <span>Review details and begin your response.</span>
            </>
          )}
        </div>

        <div className="mission-actions">
          {status !== "RESOLVED" && (
            <button
              type="button"
              className="action-btn"
              onClick={() => onUpdate(id, nextStatus)}
              disabled={isUpdating || !id}
            >
              {isUpdating ? (
                <RefreshCw size={16} className="spin-icon" />
              ) : status === "ASSIGNED" ? (
                <Play size={16} />
              ) : (
                <Check size={17} />
              )}

              {isUpdating ? "Updating..." : nextLabel}
            </button>
          )}

          {status === "RESOLVED" && (
            <span className="resolved-label">
              <CheckCircle2 size={17} />
              Completed
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================
   RESPONSE TEAM DASHBOARD
   ========================================= */

export default function ResponseTeamDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const userName = useMemo(() => getUserName(), []);

  const loadAssignments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Your login session was not found. Please sign in again."
        );
      }

      const response = await fetch(`${API_URL}/api/assignments/my`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Unable to load assignments (HTTP ${response.status}).`
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.assignments)
          ? data.assignments
          : Array.isArray(data?.data?.assignments)
            ? data.data.assignments
            : Array.isArray(data?.data)
              ? data.data
              : [];

      setAssignments(list);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load missions. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const updateStatus = async (assignmentId, newStatus) => {
    if (!assignmentId || !newStatus) {
      setError("This mission does not have a valid assignment ID.");
      return;
    }

    const previousAssignments = assignments;

    setUpdatingId(String(assignmentId));
    setError("");
    setSuccess("");

    setAssignments((current) =>
      current.map((item) =>
        String(getAssignmentId(item)) === String(assignmentId)
          ? { ...item, status: newStatus }
          : item
      )
    );

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Your login session has expired. Please sign in again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/assignments/${encodeURIComponent(
          assignmentId
        )}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Could not update mission status (HTTP ${response.status}).`
        );
      }

      const updated = data?.assignment ?? data?.data?.assignment;

      if (updated) {
        setAssignments((current) =>
          current.map((item) =>
            String(getAssignmentId(item)) === String(assignmentId)
              ? { ...item, ...updated }
              : item
          )
        );
      }

      setSuccess(
        newStatus === "IN_PROGRESS"
          ? "Mission started successfully."
          : "Mission marked as resolved successfully."
      );
    } catch (err) {
      setAssignments(previousAssignments);

      setError(
        err?.message ||
          "Status update failed. Please check your connection and try again."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const handleIncidentSubmitted = () => {
    setSuccess("Field incident report submitted successfully.");
    loadAssignments(true);
  };

  const stats = useMemo(() => {
    return assignments.reduce(
      (result, item) => {
        const status = getStatus(item);

        result.total += 1;

        if (status === "ASSIGNED") result.assigned += 1;
        if (status === "IN_PROGRESS") result.inProgress += 1;
        if (status === "RESOLVED") result.resolved += 1;

        if (getPriority(item) === "HIGH" && status !== "RESOLVED") {
          result.highPriority += 1;
        }

        return result;
      },
      {
        total: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        highPriority: 0,
      }
    );
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((item) => {
      const status = getStatus(item);
      const priority = getPriority(item);
      const report = getReport(item);

      const searchableText = [
        getEmergencyType(item),
        getLocation(item),
        getDescription(item),
        getReporter(item),
        report?.reportId,
        report?.caseId,
        item?.reportId,
        item?.caseId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [assignments, search, statusFilter, priorityFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  return (
    <main className="response-dashboard">
      <header className="response-header">
        <div className="response-brand">
          <div className="response-brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div className="response-brand-copy">
            <span className="response-brand-name">RESQ</span>
            <span className="response-brand-subtitle">
              SMART RESPONSE
            </span>
          </div>
        </div>

        <div className="response-header-right">
          <span className="response-live-indicator">
            <span className="live-dot" />
            Response network
          </span>

          <div className="response-user">
            <div className="response-user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="response-user-copy">
              <span className="response-user-name">{userName}</span>
              <span className="response-user-role">
                Response team
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="response-hero">
        <div className="response-hero-content">
          <div className="response-hero-eyebrow">
            <span className="hero-eyebrow-icon">
              <Activity size={15} />
            </span>
            RESPONSE OPERATIONS
          </div>

          <h1>
            Every second
            <br />
            <span>makes a difference.</span>
          </h1>

          <p>
            Manage your assigned emergency missions, coordinate field
            responses, and help your community when it matters most.
          </p>

          <div className="response-hero-meta">
            <span>
              <ShieldCheck size={16} />
              Secure response workspace
            </span>

            <span>
              <Clock3 size={16} />
              Mission status overview
            </span>
          </div>
        </div>

        <div
          className="response-hero-visual"
          aria-hidden="true"
        >
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-orbit hero-orbit-three" />

          <div className="hero-center-icon">
            <Siren size={49} strokeWidth={1.7} />
          </div>

          <span className="hero-floating-icon hero-floating-one">
            <MapPin size={22} />
          </span>

          <span className="hero-floating-icon hero-floating-two">
            <ShieldCheck size={22} />
          </span>

          <span className="hero-floating-icon hero-floating-three">
            <Activity size={22} />
          </span>
        </div>
      </section>

      {error && (
        <div
          className="response-alert response-alert-error"
          role="alert"
        >
          <AlertTriangle size={19} />
          <span>{error}</span>

          <button
            type="button"
            className="alert-dismiss"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div
          className="response-alert response-alert-success"
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{success}</span>

          <button
            type="button"
            className="alert-dismiss"
            onClick={() => setSuccess("")}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="response-section response-overview">
        <div className="response-section-heading">
          <div>
            <span className="section-eyebrow">YOUR WORKSPACE</span>
            <h2>Mission overview</h2>
            <p>
              Here is the latest summary of your assigned operations.
            </p>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={() => loadAssignments(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "spin-icon" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="response-stats">
          <StatCard
            label="Total missions"
            value={stats.total}
            description="All assignments"
            tone="blue"
          />

          <StatCard
            label="Awaiting response"
            value={stats.assigned}
            description="Ready to start"
            tone="amber"
          />

          <StatCard
            label="In progress"
            value={stats.inProgress}
            description="Active missions"
            tone="purple"
          />

          <StatCard
            label="Resolved"
            value={stats.resolved}
            description="Completed missions"
            tone="green"
          />
        </div>

        <div className="response-summary">
          <div className="summary-main">
            <div className="summary-icon">
              <Siren size={21} />
            </div>

            <div className="summary-copy">
              <strong>Stay alert. Stay prepared.</strong>
              <span>
                {stats.highPriority > 0
                  ? `${stats.highPriority} high-priority mission${
                      stats.highPriority === 1 ? "" : "s"
                    } require${
                      stats.highPriority === 1 ? "s" : ""
                    } attention.`
                  : "Review your missions regularly and keep their status updated."}
              </span>
            </div>
          </div>

          <div className="summary-high-priority">
            <span className="summary-priority-number">
              {stats.highPriority}
            </span>
            <span className="summary-priority-label">
              High priority
            </span>
          </div>
        </div>
      </section>

      <section className="response-section response-missions-section">
        <div className="response-section-heading">
          <div>
            <span className="section-eyebrow">FIELD OPERATIONS</span>
            <h2>Your missions</h2>
            <p>
              View assignment details and update progress as you respond.
            </p>
          </div>

          <span className="mission-count">
            {filteredAssignments.length}{" "}
            {filteredAssignments.length === 1
              ? "mission"
              : "missions"}
          </span>
        </div>

        <div className="mission-toolbar">
          <label className="mission-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search by emergency, location or reporter..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </label>

          <label className="mission-filter">
            <Filter size={17} />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mission-filter">
            <AlertTriangle size={17} />

            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
            >
              <option value="ALL">All priorities</option>
              <option value="HIGH">High priority</option>
              <option value="MEDIUM">Medium priority</option>
              <option value="LOW">Low priority</option>
            </select>
          </label>

          {(search ||
            statusFilter !== "ALL" ||
            priorityFilter !== "ALL") && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <RotateCcw size={15} />
              Clear
            </button>
          )}
        </div>

        <div
          className="mission-tabs"
          role="group"
          aria-label="Mission status"
        >
          {STATUS_OPTIONS.map((option) => {
            const count =
              option.value === "ALL"
                ? assignments.length
                : assignments.filter(
                    (item) => getStatus(item) === option.value
                  ).length;

            return (
              <button
                type="button"
                key={option.value}
                className={`mission-tab ${
                  statusFilter === option.value
                    ? "mission-tab-active"
                    : ""
                }`}
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
                <span className="mission-tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="mission-state">
            <div className="loading-spinner" />
            <h3>Loading your missions</h3>
            <p>
              Connecting to the RESQ response network...
            </p>
          </div>
        ) : filteredAssignments.length > 0 ? (
          <div className="mission-grid">
            {filteredAssignments.map((item, index) => (
              <MissionCard
                key={getAssignmentId(item) || `mission-${index}`}
                item={item}
                onUpdate={updateStatus}
                updatingId={updatingId}
                onIncidentSubmitted={handleIncidentSubmitted}
              />
            ))}
          </div>
        ) : (
          <div className="mission-state mission-empty-state">
            <div className="empty-state-icon">
              {assignments.length === 0 ? (
                <ClipboardList size={30} />
              ) : (
                <Search size={30} />
              )}
            </div>

            <h3>
              {assignments.length === 0
                ? "No missions assigned yet"
                : "No matching missions"}
            </h3>

            <p>
              {assignments.length === 0
                ? "New assignments will appear here when they are assigned to your response team."
                : "Try another search term or clear your filters to view more missions."}
            </p>

            {assignments.length > 0 && (
              <button
                type="button"
                className="action-btn"
                onClick={clearFilters}
              >
                <RotateCcw size={16} />
                Clear filters
              </button>
            )}

            {assignments.length === 0 && (
              <button
                type="button"
                className="refresh-btn"
                onClick={() => loadAssignments(true)}
                disabled={refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "spin-icon" : ""}
                />
                Try again
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="response-footer">
        <div className="footer-brand">
          <ShieldCheck size={19} />
          <strong>RESQ</strong>
          <span>Smart Disaster Response System</span>
        </div>

        <div className="footer-status">
          <span className="live-dot" />
          Response workspace
        </div>
      </footer>
    </main>
  );
}
