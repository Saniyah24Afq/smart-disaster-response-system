import { useEffect, useState } from "react";
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
  const [allocating, setAllocating] = useState(false);

  const [form, setForm] = useState({
    resource_id: "",
    disaster_id: "",
    quantity: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const token = localStorage.getItem("resq_token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ============================================
  // FETCH DATA
  // ============================================

  const fetchData = async () => {
    try {
      setLoading(true);

      const [resourceResponse, disasterResponse, allocationResponse] =
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

      const resourceData = await resourceResponse.json();
      const disasterData = await disasterResponse.json();
      const allocationData = await allocationResponse.json();

      if (resourceResponse.ok) {
        setResources(
          Array.isArray(resourceData)
            ? resourceData
            : resourceData.resources || []
        );
      }

      if (disasterResponse.ok) {
        setDisasters(
          Array.isArray(disasterData)
            ? disasterData
            : disasterData.disasters || []
        );
      }

      if (allocationResponse.ok) {
        setAllocations(
          Array.isArray(allocationData)
            ? allocationData
            : allocationData.allocations || []
        );
      }
    } catch (error) {
      console.error("Allocation data error:", error);

      setMessage("Unable to load allocation data.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================
  // FORM CHANGE
  // ============================================

  const handleChange = (event) => {
    setForm((previousForm) => ({
      ...previousForm,
      [event.target.name]: event.target.value,
    }));

    setMessage("");
    setMessageType("");
  };

  // ============================================
  // ALLOCATE RESOURCE
  // ============================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!form.resource_id || !form.disaster_id || !form.quantity) {
      setMessage("Please fill all allocation fields.");
      setMessageType("error");
      return;
    }

    const selectedResource = resources.find(
      (resource) => String(resource.id) === String(form.resource_id)
    );

    if (!selectedResource) {
      setMessage("Resource not found.");
      setMessageType("error");
      return;
    }

    const requestedQuantity = Number(form.quantity);
    const availableQuantity = Number(selectedResource.quantity || 0);

    if (requestedQuantity <= 0) {
      setMessage("Quantity must be greater than 0.");
      setMessageType("error");
      return;
    }

    if (requestedQuantity > availableQuantity) {
      setMessage(
        `Only ${availableQuantity} units are available for this resource.`
      );
      setMessageType("error");
      return;
    }

    try {
      setAllocating(true);

      const response = await fetch(`${API_URL}/api/allocations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          resource_id: Number(form.resource_id),
          disaster_id: Number(form.disaster_id),
          quantity: requestedQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Failed to allocate resource."
        );
        setMessageType("error");
        return;
      }

      setMessage("Resource allocated successfully!");
      setMessageType("success");

      setForm({
        resource_id: "",
        disaster_id: "",
        quantity: "",
      });

      await fetchData();
    } catch (error) {
      console.error("Allocation error:", error);

      setMessage(
        "Server error while allocating resource."
      );
      setMessageType("error");
    } finally {
      setAllocating(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getDisasterName = (id) => {
    const disaster = disasters.find(
      (item) => String(item.id) === String(id)
    );

    if (!disaster) {
      return `Disaster #${id}`;
    }

    return (
      disaster.title ||
      disaster.disaster_type ||
      `Disaster #${disaster.id}`
    );
  };

  const getResourceName = (id) => {
    const resource = resources.find(
      (item) => String(item.id) === String(id)
    );

    return resource?.name || `Resource #${id}`;
  };

  const totalAllocated = allocations.reduce(
    (sum, allocation) =>
      sum +
      Number(
        allocation.quantity ||
          allocation.allocated_quantity ||
          0
      ),
    0
  );

  const availableResources = resources.filter(
    (resource) => Number(resource.quantity || 0) > 0
  ).length;

  const criticalDisasters = disasters.filter(
    (disaster) => disaster.severity === "CRITICAL"
  ).length;

  // ============================================
  // UI
  // ============================================

  return (
    <div className="allocation-page">

      <div className="allocation-background"></div>

      <div className="allocation-container">

        {/* HEADER */}

        <div className="allocation-header">

          <div className="allocation-title-row">

            <div className="allocation-title-icon">
              <Send size={27} />
            </div>

            <div>
              <span className="allocation-eyebrow">
                RESQ OPERATIONS
              </span>

              <h1>Resource Allocation</h1>

              <p>
                Allocate emergency resources to active
                disaster incidents.
              </p>
            </div>

          </div>

          <button
            className="allocation-refresh-btn"
            onClick={fetchData}
            type="button"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

        </div>

        {/* MESSAGE */}

        {message && (
          <div
            className={`allocation-message ${messageType}`}
          >
            {messageType === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}

            <span>{message}</span>
          </div>
        )}

        {/* STATS */}

        <div className="allocation-stats">

          <div className="allocation-stat-card">

            <div className="allocation-stat-icon green">
              <Boxes size={23} />
            </div>

            <div>
              <span>Available Resources</span>
              <strong>{availableResources}</strong>
              <small>Ready for deployment</small>
            </div>

          </div>

          <div className="allocation-stat-card">

            <div className="allocation-stat-icon blue">
              <Send size={23} />
            </div>

            <div>
              <span>Total Allocated</span>
              <strong>{totalAllocated}</strong>
              <small>Units dispatched</small>
            </div>

          </div>

          <div className="allocation-stat-card">

            <div className="allocation-stat-icon orange">
              <AlertTriangle size={23} />
            </div>

            <div>
              <span>Critical Incidents</span>
              <strong>{criticalDisasters}</strong>
              <small>Need immediate attention</small>
            </div>

          </div>

          <div className="allocation-stat-card">

            <div className="allocation-stat-icon red">
              <CheckCircle2 size={23} />
            </div>

            <div>
              <span>Allocations</span>
              <strong>{allocations.length}</strong>
              <small>Recorded operations</small>
            </div>

          </div>

        </div>

        {/* MAIN GRID */}

        <div className="allocation-main-grid">

          {/* ALLOCATION FORM */}

          <section className="allocation-form-card">

            <div className="card-heading">

              <div className="card-heading-icon">
                <Send size={21} />
              </div>

              <div>
                <span>DISPATCH CENTER</span>
                <h2>Allocate Resource</h2>
                <p>
                  Send available resources to an emergency.
                </p>
              </div>

            </div>

            <form onSubmit={handleSubmit}>

              {/* RESOURCE */}

              <div className="allocation-form-group">

                <label htmlFor="resource_id">
                  Select Resource
                </label>

                <select
                  id="resource_id"
                  name="resource_id"
                  value={form.resource_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Choose resource...
                  </option>

                  {resources
                    .filter(
                      (resource) =>
                        Number(resource.quantity || 0) > 0
                    )
                    .map((resource) => (
                      <option
                        key={resource.id}
                        value={resource.id}
                      >
                        {resource.name} —{" "}
                        {resource.quantity} available
                      </option>
                    ))}
                </select>

              </div>

              {/* DISASTER */}

              <div className="allocation-form-group">

                <label htmlFor="disaster_id">
                  Select Disaster
                </label>

                <select
                  id="disaster_id"
                  name="disaster_id"
                  value={form.disaster_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Choose disaster...
                  </option>

                  {disasters
                    .filter(
                      (disaster) =>
                        disaster.status !== "RESOLVED" &&
                        disaster.status !== "REJECTED"
                    )
                    .map((disaster) => (
                      <option
                        key={disaster.id}
                        value={disaster.id}
                      >
                        #{disaster.id} —{" "}
                        {disaster.disaster_type ||
                          "Emergency"}{" "}
                        —{" "}
                        {disaster.severity ||
                          "UNKNOWN"}
                      </option>
                    ))}
                </select>

              </div>

              {/* QUANTITY */}

              <div className="allocation-form-group">

                <label htmlFor="quantity">
                  Quantity
                </label>

                <div className="quantity-input-wrapper">

                  <input
                    id="quantity"
                    type="number"
                    name="quantity"
                    min="1"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="0"
                    required
                  />

                  <span>UNITS</span>

                </div>

                <small>
                  Enter the number of units you want
                  to allocate.
                </small>

              </div>

              {/* SELECTED RESOURCE */}

              {form.resource_id && (
                <div className="selected-resource-info">

                  <div className="selected-resource-icon">
                    <Package size={21} />
                  </div>

                  <div>
                    <strong>
                      {getResourceName(
                        form.resource_id
                      )}
                    </strong>

                    <span>
                      Available:{" "}
                      {
                        resources.find(
                          (resource) =>
                            String(resource.id) ===
                            String(form.resource_id)
                        )?.quantity
                      }{" "}
                      units
                    </span>
                  </div>

                  <CheckCircle2
                    size={20}
                    className="selected-check"
                  />

                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                className="allocate-submit-btn"
                disabled={allocating}
              >

                {allocating ? (
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

          </section>

          {/* RESOURCE AVAILABILITY */}

          <section className="allocation-resource-card">

            <div className="card-heading">

              <div className="card-heading-icon green-heading">
                <Boxes size={21} />
              </div>

              <div>
                <span>INVENTORY</span>
                <h2>Resource Availability</h2>
                <p>
                  Current emergency inventory.
                </p>
              </div>

            </div>

            {loading ? (
              <div className="allocation-loading">

                <RefreshCw
                  className="spin"
                  size={28}
                />

                <span>
                  Loading inventory...
                </span>

              </div>
            ) : resources.length === 0 ? (
              <div className="allocation-empty">

                <Package size={40} />

                <h3>No resources</h3>

                <p>
                  Add resources from Resource Management.
                </p>

              </div>
            ) : (
              <div className="availability-list">

                {resources.slice(0, 7).map((resource) => {

                  const quantity = Number(
                    resource.quantity || 0
                  );

                  let statusClass = "good";

                  if (quantity <= 0) {
                    statusClass = "empty";
                  } else if (quantity <= 10) {
                    statusClass = "low";
                  }

                  return (
                    <div
                      className="availability-item"
                      key={resource.id}
                    >

                      <div className="availability-icon">
                        <Package size={18} />
                      </div>

                      <div className="availability-info">
                        <strong>
                          {resource.name}
                        </strong>

                        <span>
                          {resource.category ||
                            "Emergency Resource"}
                        </span>

                        <small>
                          <MapPinned size={12} />
                          {resource.location ||
                            "Location not specified"}
                        </small>
                      </div>

                      <div
                        className={`availability-quantity ${statusClass}`}
                      >
                        <strong>
                          {quantity}
                        </strong>

                        <small>
                          {resource.unit || "units"}
                        </small>
                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </section>

        </div>

        {/* HISTORY */}

        <section className="allocation-history-card">

          <div className="history-header">

            <div>
              <span>ACTIVITY LOG</span>

              <h2>Allocation History</h2>

              <p>
                Resources previously assigned to incidents.
              </p>
            </div>

            <div className="history-live">
              <span></span>
              Live Records
            </div>

          </div>

          {loading ? (
            <div className="allocation-loading">
              <RefreshCw
                className="spin"
                size={28}
              />
              <span>
                Loading allocations...
              </span>
            </div>
          ) : allocations.length === 0 ? (
            <div className="allocation-empty">
              <Send size={38} />

              <h3>No allocations yet</h3>

              <p>
                Allocated resources will appear here
                automatically.
              </p>
            </div>
          ) : (
            <div className="allocation-table-wrapper">

              <table className="allocation-table">

                <thead>
                  <tr>
                    <th>Allocation</th>
                    <th>Resource</th>
                    <th>Disaster</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {allocations.map((allocation) => {

                    const quantity = Number(
                      allocation.quantity ||
                        allocation.allocated_quantity ||
                        0
                    );

                    return (
                      <tr key={allocation.id}>

                        <td>
                          <div className="allocation-id">
                            <span>
                              #{allocation.id}
                            </span>

                            <small>
                              Allocation
                            </small>
                          </div>
                        </td>

                        <td>
                          <div className="history-resource">

                            <div>
                              <Package size={16} />
                            </div>

                            <span>
                              {allocation.resource_name ||
                                getResourceName(
                                  allocation.resource_id
                                )}
                            </span>

                          </div>
                        </td>

                        <td>
                          <div className="history-disaster">

                            <MapPinned size={16} />

                            <span>
                              {allocation.disaster_name ||
                                getDisasterName(
                                  allocation.disaster_id
                                )}
                            </span>

                          </div>
                        </td>

                        <td>
                          <span className="quantity-badge">
                            {quantity} units
                          </span>
                        </td>

                        <td>
                          <span className="allocation-status">
                            <span></span>
                            {allocation.status ||
                              "ALLOCATED"}
                          </span>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>

    </div>
  );
}

export default ResourceAllocation;