import { useEffect, useState } from "react";
import {
  Package,
  Droplets,
  Utensils,
  HeartPulse,
  Truck,
  Home,
  Users,
  ShieldCheck,
  Plus,
  RefreshCw,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import "./Resources.css";

const API_URL = "http://localhost:5000";

const resourceTypes = [
  {
    type: "FOOD",
    label: "Food Supplies",
    icon: Utensils,
    color: "#16a34a",
    unit: "packets",
  },
  {
    type: "WATER",
    label: "Water",
    icon: Droplets,
    color: "#0284c7",
    unit: "litres",
  },
  {
    type: "MEDICAL_KITS",
    label: "Medical Kits",
    icon: HeartPulse,
    color: "#dc2626",
    unit: "kits",
  },
  {
    type: "VEHICLES",
    label: "Vehicles",
    icon: Truck,
    color: "#f59e0b",
    unit: "vehicles",
  },
  {
    type: "RESCUE_EQUIPMENT",
    label: "Rescue Equipment",
    icon: ShieldCheck,
    color: "#7c3aed",
    unit: "units",
  },
  {
    type: "SHELTERS",
    label: "Shelters",
    icon: Home,
    color: "#0891b2",
    unit: "shelters",
  },
  {
    type: "VOLUNTEERS",
    label: "Volunteers",
    icon: Users,
    color: "#db2777",
    unit: "people",
  },
];

function getStoredToken() {
  const storedToken = localStorage.getItem("resq_token");

  if (!storedToken) {
    return null;
  }

  try {
    // If token was accidentally saved as JSON
    const parsed = JSON.parse(storedToken);

    if (typeof parsed === "string") {
      return parsed.replace(/^Bearer\s+/i, "").trim();
    }

    if (parsed?.token) {
      return String(parsed.token)
        .replace(/^Bearer\s+/i, "")
        .trim();
    }
  } catch {
    // Normal JWT string
  }

  return storedToken.replace(/^Bearer\s+/i, "").trim();
}

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    category: "FOOD",
    name: "",
    quantity: "",
    unit: "packets",
    location: "",
  });

  const getToken = () => {
    const token = getStoredToken();

    console.log("TOKEN EXISTS:", !!token);
    console.log("TOKEN LENGTH:", token ? token.length : 0);
    console.log(
      "TOKEN START:",
      token ? token.substring(0, 10) : "NO TOKEN"
    );

    return token;
  };

  const fetchResources = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        console.error("No RESQ authentication token found.");
        setResources([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/resources`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResources(
          Array.isArray(data)
            ? data
            : Array.isArray(data.resources)
            ? data.resources
            : []
        );
      } else {
        console.error("Fetch resources failed:", data);
      }
    } catch (error) {
      console.error("Resource fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    if (name === "category") {
      const selectedType = resourceTypes.find(
        (item) => item.type === value
      );

      if (selectedType) {
        setForm((previousForm) => ({
          ...previousForm,
          category: value,
          unit: selectedType.unit,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = getToken();

      if (!token) {
        alert("Please login again before adding a resource.");
        return;
      }

      const selectedType = resourceTypes.find(
        (item) => item.type === form.category
      );

      const payload = {
        name: form.name.trim(),
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        location: form.location.trim(),
      };

      console.log("Adding resource:", {
        ...payload,
        tokenPresent: !!token,
      });

      const response = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Add resource failed:", data);

        alert(data.message || "Failed to add resource");
        return;
      }

      alert("Resource added successfully 🚑");

      setForm({
        category: "FOOD",
        name: "",
        quantity: "",
        unit: selectedType?.unit || "packets",
        location: "",
      });

      setShowModal(false);

      await fetchResources();
    } catch (error) {
      console.error("Add resource error:", error);
      alert("Server error while adding resource");
    }
  };

  const getResourceInfo = (resource) => {
    const category =
      resource.category || resource.resource_type || "OTHER";

    return (
      resourceTypes.find((item) => item.type === category) || {
        type: category,
        label: category,
        icon: Package,
        color: "#64748b",
        unit: resource.unit || "units",
      }
    );
  };

  const getResourceStatus = (resource) => {
    const quantity = Number(resource.quantity || 0);

    if (quantity <= 0) {
      return "EMPTY";
    }

    if (quantity <= 10) {
      return "LOW STOCK";
    }

    return "AVAILABLE";
  };

  const totalQuantity = resources.reduce(
    (sum, resource) => sum + Number(resource.quantity || 0),
    0
  );

  const availableResources = resources.filter(
    (resource) => Number(resource.quantity || 0) > 0
  ).length;

  const lowStock = resources.filter(
    (resource) =>
      Number(resource.quantity || 0) > 0 &&
      Number(resource.quantity || 0) <= 10
  ).length;

  const outOfStock = resources.filter(
    (resource) => Number(resource.quantity || 0) <= 0
  ).length;

  return (
    <div className="resources-page">
      <div className="resources-background"></div>

      <div className="resources-container">

        {/* Header */}
        <div className="resources-header">
          <div>
            <div className="resources-title-row">
              <div className="resources-title-icon">
                <Boxes size={28} />
              </div>

              <div>
                <h1>Resource Management</h1>

                <p>
                  Manage emergency supplies, vehicles, shelters and
                  response resources.
                </p>
              </div>
            </div>
          </div>

          <div className="resources-actions">
            <button
              className="refresh-btn"
              onClick={fetchResources}
              title="Refresh resources"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

            <button
              className="add-resource-btn"
              onClick={() => setShowModal(true)}
            >
              <Plus size={19} />
              Add Resource
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="resource-stats">

          <div className="resource-stat-card">
            <div className="stat-icon green">
              <Package size={22} />
            </div>

            <div>
              <span>Total Resources</span>
              <strong>{resources.length}</strong>
            </div>
          </div>

          <div className="resource-stat-card">
            <div className="stat-icon blue">
              <Boxes size={22} />
            </div>

            <div>
              <span>Total Quantity</span>
              <strong>{totalQuantity}</strong>
            </div>
          </div>

          <div className="resource-stat-card">
            <div className="stat-icon orange">
              <ShieldCheck size={22} />
            </div>

            <div>
              <span>Available</span>
              <strong>{availableResources}</strong>
            </div>
          </div>

          <div className="resource-stat-card">
            <div className="stat-icon red">
              <AlertTriangle size={22} />
            </div>

            <div>
              <span>Low / Empty</span>
              <strong>{lowStock + outOfStock}</strong>
            </div>
          </div>

        </div>

        {/* Resource Categories */}
        <section className="resource-types-section">

          <div className="section-heading">
            <div>
              <h2>Resource Categories</h2>

              <p>
                Quick overview of emergency resource categories.
              </p>
            </div>
          </div>

          <div className="resource-type-grid">

            {resourceTypes.map((item) => {
              const Icon = item.icon;

              const count = resources.filter(
                (resource) =>
                  (resource.category || resource.resource_type) ===
                  item.type
              ).length;

              const quantity = resources
                .filter(
                  (resource) =>
                    (resource.category || resource.resource_type) ===
                    item.type
                )
                .reduce(
                  (sum, resource) =>
                    sum + Number(resource.quantity || 0),
                  0
                );

              return (
                <div
                  className="resource-type-card"
                  key={item.type}
                >
                  <div
                    className="resource-type-icon"
                    style={{
                      background: `${item.color}18`,
                      color: item.color,
                    }}
                  >
                    <Icon size={24} />
                  </div>

                  <div className="resource-type-info">
                    <h3>{item.label}</h3>

                    <p>
                      {count} item{count !== 1 ? "s" : ""} •{" "}
                      {quantity} units
                    </p>
                  </div>

                  <div
                    className="resource-type-dot"
                    style={{
                      background: item.color,
                    }}
                  ></div>
                </div>
              );
            })}

          </div>
        </section>

        {/* Resource List */}
        <section className="resource-list-section">

          <div className="section-heading">

            <div>
              <h2>All Resources</h2>

              <p>
                Live inventory available for disaster response.
              </p>
            </div>

            <div className="inventory-badge">
              <span></span>
              Live Inventory
            </div>

          </div>

          {loading ? (
            <div className="resource-empty">
              <RefreshCw
                className="spin"
                size={30}
              />

              <h3>Loading resources...</h3>

              <p>
                Fetching latest emergency inventory.
              </p>
            </div>
          ) : resources.length === 0 ? (
            <div className="resource-empty">

              <Package size={42} />

              <h3>No resources found</h3>

              <p>
                Add your first emergency resource to begin
                inventory tracking.
              </p>

              <button
                className="empty-add-btn"
                onClick={() => setShowModal(true)}
              >
                <Plus size={18} />
                Add First Resource
              </button>

            </div>
          ) : (
            <div className="resource-table-wrapper">

              <table className="resource-table">

                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {resources.map((resource) => {
                    const info = getResourceInfo(resource);
                    const Icon = info.icon;

                    const quantity = Number(
                      resource.quantity || 0
                    );

                    const status = getResourceStatus(resource);

                    let stockClass = "stock-good";

                    if (quantity <= 0) {
                      stockClass = "stock-empty";
                    } else if (quantity <= 10) {
                      stockClass = "stock-low";
                    }

                    return (
                      <tr key={resource.id}>

                        <td>
                          <div className="resource-name-cell">

                            <div
                              className="mini-resource-icon"
                              style={{
                                color: info.color,
                                background: `${info.color}18`,
                              }}
                            >
                              <Icon size={19} />
                            </div>

                            <div>
                              <strong>
                                {resource.name || info.label}
                              </strong>

                              <small>
                                Resource #{resource.id}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="type-pill">
                            {info.label}
                          </span>
                        </td>

                        <td>
                          <div
                            className={`quantity-cell ${stockClass}`}
                          >
                            <strong>{quantity}</strong>

                            <span>
                              {resource.unit || info.unit || "units"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="location-text">
                            {resource.location ||
                              "Not specified"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-pill ${
                              status === "AVAILABLE"
                                ? "status-available"
                                : status === "LOW STOCK"
                                ? "status-allocated"
                                : "status-unavailable"
                            }`}
                          >
                            <span></span>
                            {status}
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

      {/* Add Resource Modal */}
      {showModal && (
        <div
          className="resource-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="resource-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">

              <div>
                <div className="modal-icon">
                  <Plus size={22} />
                </div>

                <h2>Add Emergency Resource</h2>

                <p>
                  Add a new resource to the RESQ inventory.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-group">

                <label>Resource Type</label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  {resourceTypes.map((item) => (
                    <option
                      key={item.type}
                      value={item.type}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>

              </div>

              <div className="form-group">

                <label>Resource Name</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Drinking Water Bottles"
                  required
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>Quantity</label>

                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="500"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>Unit</label>

                  <input
                    type="text"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    placeholder="packets"
                    required
                  />

                </div>

              </div>

              <div className="form-group">

                <label>Location</label>

                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai Central Warehouse"
                  required
                />

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-resource-btn"
                >
                  <Plus size={18} />
                  Add Resource
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resources;