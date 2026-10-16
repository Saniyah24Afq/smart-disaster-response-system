import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  Package,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Send,
  MapPinned,
} from "lucide-react";
import "./ResourceAllocation.css";

const API_URL = "http://localhost:5000";

function ResourceAllocation() {
  const [resources, setResources] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    resource_id: "",
    disaster_id: "",
    quantity: "",
  });

  const token = localStorage.getItem("resq_token");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error("Access token missing. Please login again.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [resourcesRes, disastersRes, allocationsRes] =
        await Promise.all([
          fetch(`${API_URL}/api/resources`, {
            headers,
          }),

          fetch(`${API_URL}/api/disasters`, {
            headers,
          }),

          fetch(`${API_URL}/api/allocations`, {
            headers,
          }),
        ]);

      if (!resourcesRes.ok) {
        const data = await resourcesRes.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch resources");
      }

      if (!disastersRes.ok) {
        const data = await disastersRes.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch disasters");
      }

      if (!allocationsRes.ok) {
        const data = await allocationsRes.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch allocations");
      }

      const resourcesData = await resourcesRes.json();
      const disastersData = await disastersRes.json();
      const allocationsData = await allocationsRes.json();

      /*
       * Backend APIs return objects like:
       *
       * {
       *   message: "Resources fetched successfully",
       *   resources: [...]
       * }
       *
       * So we need to read the nested arrays.
       */

      const resourcesList = Array.isArray(resourcesData)
        ? resourcesData
        : Array.isArray(resourcesData.resources)
          ? resourcesData.resources
          : [];

      const disastersList = Array.isArray(disastersData)
        ? disastersData
        : Array.isArray(disastersData.disasters)
          ? disastersData.disasters
          : [];

      const allocationsList = Array.isArray(allocationsData)
        ? allocationsData
        : Array.isArray(allocationsData.allocations)
          ? allocationsData.allocations
          : [];

      setResources(resourcesList);
      setDisasters(disastersList);
      setAllocations(allocationsList);
    } catch (err) {
      console.error("Resource allocation fetch error:", err);
      setError(err.message || "Failed to load resource allocation data");

      setResources([]);
      setDisasters([]);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError("Your session has expired. Please login again.");
      return;
    }

    if (!form.resource_id || !form.disaster_id || !form.quantity) {
      setError("Please fill all required fields.");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    const selectedResource = resources.find(
      (resource) => String(resource.id) === String(form.resource_id)
    );

    if (!selectedResource) {
      setError("Selected resource was not found.");
      return;
    }

    const availableQuantity = Number(selectedResource.quantity || 0);

    if (quantity > availableQuantity) {
      setError(
        `Only ${availableQuantity} ${
          selectedResource.unit || "units"
        } available.`
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/api/allocations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resource_id: Number(form.resource_id),
          disaster_id: Number(form.disaster_id),
          quantity,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Resource allocation failed"
        );
      }

      setMessage("Resource allocated successfully.");

      setForm({
        resource_id: "",
        disaster_id: "",
        quantity: "",
      });

      await fetchData();
    } catch (err) {
      console.error("Allocation error:", err);
      setError(err.message || "Resource allocation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const totalResources = resources.length;

  const totalAvailable = resources.reduce(
    (total, resource) =>
      total + Number(resource.quantity || 0),
    0
  );

  const totalAllocated = allocations.reduce(
    (total, allocation) =>
      total + Number(allocation.quantity || 0),
    0
  );

  const activeDisasters = disasters.filter(
    (disaster) =>
      disaster.status !== "RESOLVED" &&
      disaster.status !== "REJECTED"
  ).length;

  const activeDisasterList = disasters.filter(
    (disaster) =>
      disaster.status !== "RESOLVED" &&
      disaster.status !== "REJECTED"
  );

  if (loading) {
    return (
      <div className="resource-page">
        <div className="resource-loading">
          <RefreshCw className="spin" size={30} />
          <p>Loading resource center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resource-page">
      <div className="resource-container">
        {/* HEADER */}
        <div className="resource-header">
          <div className="resource-title-row">
            <div className="resource-title-icon">
              <Boxes size={30} />
            </div>

            <div>
              <h1>Resource Allocation</h1>

              <p>
                Manage emergency resources and allocate supplies
                to active disaster incidents.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="refresh-resource-btn"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              size={18}
              className={loading ? "spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* STATS */}
        <div className="resource-stats">
          <div className="resource-stat-card">
            <div className="stat-icon blue">
              <Boxes size={22} />
            </div>

            <div>
              <span>Total Resources</span>
              <strong>{totalResources}</strong>
            </div>
          </div>

          <div className="resource-stat-card">
            <div className="stat-icon green">
              <Package size={22} />
            </div>

            <div>
              <span>Available Units</span>
              <strong>{totalAvailable}</strong>
            </div>
          </div>

          <div className="resource-stat-card">
            <div className="stat-icon orange">
              <Send size={22} />
            </div>

            <div>
              <span>Allocated Units</span>
              <strong>{totalAllocated}</strong>
            </div>
          </div>

          <div className="resource-stat-card">
            <div className="stat-icon red">
              <AlertTriangle size={22} />
            </div>

            <div>
              <span>Active Disasters</span>
              <strong>{activeDisasters}</strong>
            </div>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="resource-message success">
            <CheckCircle2 size={20} />
            <span>{message}</span>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="resource-message error">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="resource-grid">
          {/* ALLOCATION FORM */}
          <div className="resource-card allocation-card">
            <div className="card-heading">
              <div className="card-heading-icon">
                <Send size={21} />
              </div>

              <div>
                <h2>Allocate Resource</h2>

                <p>
                  Send available resources to a disaster
                  incident.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="allocation-form"
            >
              {/* RESOURCE */}
              <div className="form-group">
                <label htmlFor="resource_id">
                  Resource
                </label>

                <select
                  id="resource_id"
                  name="resource_id"
                  value={form.resource_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    {resources.length === 0
                      ? "No resources available"
                      : "Select resource"}
                  </option>

                  {resources.map((resource) => (
                    <option
                      key={resource.id}
                      value={resource.id}
                    >
                      {resource.name} —{" "}
                      {resource.quantity}{" "}
                      {resource.unit || "units"} available
                    </option>
                  ))}
                </select>
              </div>

              {/* DISASTER */}
              <div className="form-group">
                <label htmlFor="disaster_id">
                  Disaster Incident
                </label>

                <select
                  id="disaster_id"
                  name="disaster_id"
                  value={form.disaster_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    {activeDisasterList.length === 0
                      ? "No active disasters"
                      : "Select disaster"}
                  </option>

                  {activeDisasterList.map((disaster) => (
                    <option
                      key={disaster.id}
                      value={disaster.id}
                    >
                      #{disaster.id} —{" "}
                      {disaster.disaster_type ||
                        disaster.type ||
                        "Disaster"}{" "}
                      — {disaster.severity}
                    </option>
                  ))}
                </select>
              </div>

              {/* QUANTITY */}
              <div className="form-group">
                <label htmlFor="quantity">
                  Quantity
                </label>

                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="allocate-btn"
                disabled={
                  submitting ||
                  resources.length === 0 ||
                  activeDisasterList.length === 0
                }
              >
                {submitting ? (
                  <>
                    <RefreshCw
                      className="spin"
                      size={18}
                    />
                    Allocating...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Allocate Resource
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RESOURCE AVAILABILITY */}
          <div className="resource-card">
            <div className="card-heading">
              <div className="card-heading-icon green-bg">
                <Package size={21} />
              </div>

              <div>
                <h2>Resource Availability</h2>

                <p>
                  Current emergency stock across the
                  response center.
                </p>
              </div>
            </div>

            <div className="resource-list">
              {resources.length === 0 ? (
                <div className="empty-state">
                  <Package size={35} />

                  <p>No resources available.</p>
                </div>
              ) : (
                resources.map((resource) => (
                  <div
                    className="resource-item"
                    key={resource.id}
                  >
                    <div className="resource-item-left">
                      <div className="resource-item-icon">
                        <Package size={19} />
                      </div>

                      <div>
                        <h3>{resource.name}</h3>

                        <span>
                          {resource.category ||
                            "General"}

                          {resource.location
                            ? ` • ${resource.location}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="resource-quantity">
                      <strong>
                        {resource.quantity}
                      </strong>

                      <span>
                        {resource.unit || "units"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ALLOCATION HISTORY */}
        <div className="resource-card history-card">
          <div className="card-heading">
            <div className="card-heading-icon orange-bg">
              <MapPinned size={21} />
            </div>

            <div>
              <h2>Allocation History</h2>

              <p>
                Recent resource distributions to disaster
                incidents.
              </p>
            </div>
          </div>

          {allocations.length === 0 ? (
            <div className="empty-state history-empty">
              <MapPinned size={40} />

              <p>
                No resource allocations recorded yet.
              </p>
            </div>
          ) : (
            <div className="allocation-table-wrapper">
              <table className="allocation-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Disaster</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {allocations.map((allocation) => (
                    <tr key={allocation.id}>
                      <td>
                        {allocation.resource_name ||
                          allocation.resource?.name ||
                          `Resource #${allocation.resource_id}`}
                      </td>

                      <td>
                        {allocation.disaster_type ||
                          allocation.disaster?.type ||
                          `Incident #${allocation.disaster_id}`}
                      </td>

                      <td>
                        <strong>
                          {allocation.quantity}
                        </strong>
                      </td>

                      <td>
                        <span className="status-badge">
                          {allocation.status ||
                            "ALLOCATED"}
                        </span>
                      </td>

                      <td>
                        {allocation.created_at
                          ? new Date(
                              allocation.created_at
                            ).toLocaleString()
                          : allocation.allocated_at
                            ? new Date(
                                allocation.allocated_at
                              ).toLocaleString()
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResourceAllocation;