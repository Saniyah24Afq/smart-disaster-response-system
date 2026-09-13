import { useCallback, useEffect, useState } from "react";
import {
  Package,
  Plus,
  RefreshCw,
  Boxes,
  MapPinned,
  Layers,
  AlertTriangle,
} from "lucide-react";
import "./Resources.css";

const API_URL = "http://localhost:5000";

const getStoredToken = () => localStorage.getItem("resq_token");

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "",
    location: "",
  });

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getStoredToken();

      if (!token) {
        throw new Error("Please login again.");
      }

      const response = await fetch(`${API_URL}/api/resources`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch resources");
      }

      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Resources fetch error:", err);
      setError(err.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

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

    if (
      !form.name ||
      !form.category ||
      !form.quantity ||
      !form.unit ||
      !form.location
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (Number(form.quantity) <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);

      const token = getStoredToken();

      if (!token) {
        throw new Error("Please login again.");
      }

      const response = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          quantity: Number(form.quantity),
          unit: form.unit,
          location: form.location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add resource");
      }

      setMessage("Resource added successfully.");

      setForm({
        name: "",
        category: "",
        quantity: "",
        unit: "",
        location: "",
      });

      setShowForm(false);

      await fetchResources();
    } catch (err) {
      console.error("Add resource error:", err);
      setError(err.message || "Failed to add resource");
    } finally {
      setSubmitting(false);
    }
  };

  const totalResources = resources.length;

  const totalQuantity = resources.reduce(
    (total, resource) => total + Number(resource.quantity || 0),
    0
  );

  const categories = new Set(
    resources.map((resource) => resource.category).filter(Boolean)
  ).size;

  const lowStock = resources.filter(
    (resource) => Number(resource.quantity || 0) <= 10
  ).length;

  if (loading) {
    return (
      <div className="resources-page">
        <div className="resources-loading">
          <RefreshCw className="spin" size={30} />
          <p>Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resources-page">
      <div className="resources-container">
        {/* Header */}
        <div className="resources-header">
          <div className="resources-heading">
            <div className="resources-heading-icon">
              <Boxes size={30} />
            </div>

            <div>
              <h1>Resource Management</h1>
              <p>
                Monitor emergency supplies, equipment, and response resources.
              </p>
            </div>
          </div>

          <div className="resources-header-actions">
            <button
              type="button"
              className="resource-refresh-btn"
              onClick={fetchResources}
            >
              <RefreshCw size={18} />
              Refresh
            </button>

            <button
              type="button"
              className="add-resource-btn"
              onClick={() => {
                setShowForm((previous) => !previous);
                setMessage("");
                setError("");
              }}
            >
              <Plus size={18} />
              Add Resource
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="resource-alert success">
            <Package size={19} />
            {message}
          </div>
        )}

        {error && (
          <div className="resource-alert error">
            <AlertTriangle size={19} />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="resources-stats">
          <div className="resources-stat-card">
            <div className="resources-stat-icon blue">
              <Boxes size={22} />
            </div>

            <div>
              <span>Resource Types</span>
              <strong>{totalResources}</strong>
            </div>
          </div>

          <div className="resources-stat-card">
            <div className="resources-stat-icon green">
              <Package size={22} />
            </div>

            <div>
              <span>Total Units</span>
              <strong>{totalQuantity}</strong>
            </div>
          </div>

          <div className="resources-stat-card">
            <div className="resources-stat-icon purple">
              <Layers size={22} />
            </div>

            <div>
              <span>Categories</span>
              <strong>{categories}</strong>
            </div>
          </div>

          <div className="resources-stat-card">
            <div className="resources-stat-icon red">
              <AlertTriangle size={22} />
            </div>

            <div>
              <span>Low Stock</span>
              <strong>{lowStock}</strong>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="resources-form-card">
            <div className="resources-form-heading">
              <div>
                <h2>Add Emergency Resource</h2>
                <p>
                  Register food, water, medical supplies, vehicles, equipment,
                  or shelters.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="resources-form">
              <div className="resource-form-group">
                <label htmlFor="name">Resource Name</label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Drinking Water"
                  required
                />
              </div>

              <div className="resource-form-group">
                <label htmlFor="category">Category</label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  <option value="FOOD">Food</option>
                  <option value="WATER">Water</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="VEHICLE">Vehicle</option>
                  <option value="RESCUE_EQUIPMENT">
                    Rescue Equipment
                  </option>
                  <option value="SHELTER">Shelter</option>
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="resource-form-group">
                <label htmlFor="quantity">Quantity</label>

                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div className="resource-form-group">
                <label htmlFor="unit">Unit</label>

                <input
                  id="unit"
                  name="unit"
                  type="text"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder="e.g. bottles"
                  required
                />
              </div>

              <div className="resource-form-group">
                <label htmlFor="location">Location</label>

                <div className="input-with-icon">
                  <MapPinned size={18} />

                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai Central Warehouse"
                    required
                  />
                </div>
              </div>

              <div className="resources-form-actions">
                <button
                  type="button"
                  className="cancel-resource-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-resource-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Add Resource
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resource List */}
        <div className="resources-list-card">
          <div className="resources-list-heading">
            <div>
              <h2>Available Resources</h2>
              <p>Current stock available for emergency response.</p>
            </div>

            <span className="resource-count">
              {resources.length} resources
            </span>
          </div>

          {resources.length === 0 ? (
            <div className="resources-empty">
              <Package size={45} />
              <h3>No resources available</h3>
              <p>Add your first emergency resource to get started.</p>

              <button
                type="button"
                className="add-resource-btn"
                onClick={() => setShowForm(true)}
              >
                <Plus size={18} />
                Add Resource
              </button>
            </div>
          ) : (
            <div className="resources-table-wrapper">
              <table className="resources-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Location</th>
                    <th>Availability</th>
                  </tr>
                </thead>

                <tbody>
                  {resources.map((resource) => {
                    const quantity = Number(resource.quantity || 0);

                    let availability = "Available";

                    if (quantity === 0) {
                      availability = "Out of Stock";
                    } else if (quantity <= 10) {
                      availability = "Low Stock";
                    }

                    return (
                      <tr key={resource.id}>
                        <td>
                          <div className="resource-table-name">
                            <div className="resource-table-icon">
                              <Package size={18} />
                            </div>

                            <div>
                              <strong>{resource.name}</strong>
                              <span>#{resource.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="category-badge">
                            {resource.category || "OTHER"}
                          </span>
                        </td>

                        <td>
                          <div className="quantity-cell">
                            <strong>{quantity}</strong>
                            <span>{resource.unit || "units"}</span>
                          </div>
                        </td>

                        <td>
                          <div className="location-cell">
                            <MapPinned size={16} />
                            {resource.location || "Not specified"}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`availability-badge ${
                              quantity === 0
                                ? "out"
                                : quantity <= 10
                                  ? "low"
                                  : "available"
                            }`}
                          >
                            {availability}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Resources;