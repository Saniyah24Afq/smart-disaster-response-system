import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  Send,
  ShieldAlert,
  Siren,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './ReportDisaster.css'

const API_URL = 'http://localhost:5000'

function ReportDisaster() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    disaster_type: '',
    description: '',
    severity: '',
    location: '',
    latitude: '',
    longitude: '',
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('resq_token')

      if (!token) {
        setError('Please login before reporting a disaster.')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/disasters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          disaster_type: formData.disaster_type,
          description: formData.description,
          severity: formData.severity,
          location: formData.location,
          latitude: formData.latitude
            ? Number(formData.latitude)
            : null,
          longitude: formData.longitude
            ? Number(formData.longitude)
            : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to submit disaster report'
        )
      }

      setSuccess(
        'Emergency report submitted successfully. Response teams can now review it.'
      )

      setFormData({
        disaster_type: '',
        description: '',
        severity: '',
        location: '',
        latitude: '',
        longitude: '',
      })
    } catch (err) {
      console.error('Disaster report error:', err)
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="report-page">

      {/* NAVBAR */}
      <header className="report-navbar">
        <button
          className="report-back"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="report-brand">
          <div className="report-brand-icon">
            <ShieldAlert size={23} />
          </div>

          <div>
            <strong>RESQ</strong>
            <span>SMART RESPONSE</span>
          </div>
        </div>

        <div className="report-live">
          <span></span>
          Emergency Network Online
        </div>
      </header>

      {/* CONTENT */}
      <main className="report-content">

        {/* HERO */}
        <section className="report-hero">
          <div className="report-hero-icon">
            <Siren size={32} />
          </div>

          <div>
            <span className="report-kicker">
              EMERGENCY REPORTING CENTER
            </span>

            <h1>Report a Disaster</h1>

            <p>
              Help our response teams act faster. Provide accurate
              information about the emergency and its location.
            </p>
          </div>
        </section>

        {/* FORM CARD */}
        <section className="report-layout">

          <div className="report-form-card">

            <div className="form-card-header">
              <div>
                <span className="form-kicker">
                  INCIDENT DETAILS
                </span>

                <h2>Emergency Information</h2>

                <p>
                  Please provide as much accurate information as possible.
                </p>
              </div>

              <div className="form-header-icon">
                <AlertTriangle size={24} />
              </div>
            </div>

            <form onSubmit={handleSubmit}>

              {/* DISASTER TYPE */}
              <div className="form-group">
                <label htmlFor="disaster_type">
                  Disaster Type
                  <span>*</span>
                </label>

                <select
                  id="disaster_type"
                  name="disaster_type"
                  value={formData.disaster_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select disaster type
                  </option>

                  <option value="FLOOD">Flood</option>
                  <option value="FIRE">Fire</option>
                  <option value="EARTHQUAKE">Earthquake</option>
                  <option value="CYCLONE">Cyclone</option>
                  <option value="LANDSLIDE">Landslide</option>
                  <option value="BUILDING_COLLAPSE">
                    Building Collapse
                  </option>
                  <option value="MEDICAL_EMERGENCY">
                    Medical Emergency
                  </option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* SEVERITY */}
              <div className="form-group">
                <label htmlFor="severity">
                  Severity Level
                  <span>*</span>
                </label>

                <div className="severity-options">

                  <label
                    className={`severity-option low ${
                      formData.severity === 'LOW'
                        ? 'selected'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value="LOW"
                      checked={formData.severity === 'LOW'}
                      onChange={handleChange}
                      required
                    />

                    <div>
                      <strong>Low</strong>
                      <small>Limited impact</small>
                    </div>
                  </label>

                  <label
                    className={`severity-option medium ${
                      formData.severity === 'MEDIUM'
                        ? 'selected'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value="MEDIUM"
                      checked={formData.severity === 'MEDIUM'}
                      onChange={handleChange}
                    />

                    <div>
                      <strong>Medium</strong>
                      <small>Needs attention</small>
                    </div>
                  </label>

                  <label
                    className={`severity-option high ${
                      formData.severity === 'HIGH'
                        ? 'selected'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value="HIGH"
                      checked={formData.severity === 'HIGH'}
                      onChange={handleChange}
                    />

                    <div>
                      <strong>High</strong>
                      <small>Major emergency</small>
                    </div>
                  </label>

                  <label
                    className={`severity-option critical ${
                      formData.severity === 'CRITICAL'
                        ? 'selected'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value="CRITICAL"
                      checked={formData.severity === 'CRITICAL'}
                      onChange={handleChange}
                    />

                    <div>
                      <strong>Critical</strong>
                      <small>Immediate danger</small>
                    </div>
                  </label>

                </div>
              </div>

              {/* LOCATION */}
              <div className="form-group">
                <label htmlFor="location">
                  <MapPin size={15} />
                  Emergency Location
                  <span>*</span>
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Example: Andheri East, Mumbai"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* COORDINATES */}
              <div className="coordinates-row">

                <div className="form-group">
                  <label htmlFor="latitude">
                    Latitude
                  </label>

                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="19.0760"
                    value={formData.latitude}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">
                    Longitude
                  </label>

                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="72.8777"
                    value={formData.longitude}
                    onChange={handleChange}
                  />
                </div>

              </div>

              {/* DESCRIPTION */}
              <div className="form-group">
                <label htmlFor="description">
                  <FileText size={15} />
                  Incident Description
                  <span>*</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows="6"
                  placeholder="Describe what happened, current situation, people affected, immediate dangers, etc."
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              {/* MESSAGES */}
              {error && (
                <div className="report-message error-message">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="report-message success-message">
                  <CheckCircle2 size={18} />
                  <span>{success}</span>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                className="submit-report"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="submit-spinner"></span>
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Emergency Report
                  </>
                )}
              </button>

              <p className="form-note">
                <ShieldAlert size={14} />
                Your report will be securely submitted to the RESQ
                emergency response network.
              </p>

            </form>
          </div>

          {/* SIDE INFO */}
          <aside className="report-side">

            <div className="side-emergency-card">
              <div className="side-icon">
                <Siren size={25} />
              </div>

              <span>IN CASE OF IMMEDIATE DANGER</span>

              <h3>Stay Safe First</h3>

              <p>
                Move to a safe location if possible and follow
                instructions from local emergency authorities.
              </p>
            </div>

            <div className="side-info-card">

              <span className="side-kicker">
                REPORTING TIPS
              </span>

              <h3>What makes a good report?</h3>

              <div className="tip">
                <div>01</div>
                <p>
                  Give the exact or nearest known location.
                </p>
              </div>

              <div className="tip">
                <div>02</div>
                <p>
                  Clearly describe what is happening.
                </p>
              </div>

              <div className="tip">
                <div>03</div>
                <p>
                  Select the severity based on immediate danger.
                </p>
              </div>

              <div className="tip">
                <div>04</div>
                <p>
                  Mention people, buildings or areas at risk.
                </p>
              </div>

            </div>

          </aside>

        </section>

      </main>
    </div>
  )
}

export default ReportDisaster