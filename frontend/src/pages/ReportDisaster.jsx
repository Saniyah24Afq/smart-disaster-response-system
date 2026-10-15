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
  LocateFixed,
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
  const [locating, setLocating] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setError('')
    setSuccess('')
  }

  const useCurrentLocation = () => {
    setError('')
    setSuccess('')

    if (!navigator.geolocation) {
      setError('Your browser does not support GPS location.')
      return
    }

    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude.toFixed(6)
        const longitude = position.coords.longitude.toFixed(6)

        setFormData((previous) => ({
          ...previous,
          latitude,
          longitude,
          location:
            previous.location ||
            `GPS Location (${latitude}, ${longitude})`,
        }))

        setLocating(false)
      },
      (gpsError) => {
        const message =
          gpsError.code === 1
            ? 'Location permission denied. Allow location access in your browser settings and try again.'
            : gpsError.code === 2
              ? 'Your current location could not be detected. Turn on device location/GPS and retry.'
              : 'GPS request timed out. Please try again.'

        setError(message)
        setLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token =
        localStorage.getItem('resq_token') ||
        sessionStorage.getItem('resq_token')

      if (!token) {
        throw new Error('Please log in before reporting an emergency.')
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
        throw new Error(data.message || 'Failed to submit emergency report.')
      }

      setSuccess('Emergency report submitted successfully!')
      setFormData({
        disaster_type: '',
        description: '',
        severity: '',
        location: '',
        latitude: '',
        longitude: '',
      })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const hasCoordinates =
    formData.latitude !== '' && formData.longitude !== ''

  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(formData.longitude) - 0.01}%2C${Number(formData.latitude) - 0.01}%2C${Number(formData.longitude) + 0.01}%2C${Number(formData.latitude) + 0.01}&layer=mapnik&marker=${formData.latitude}%2C${formData.longitude}`
    : 'https://www.openstreetmap.org/export/embed.html?bbox=72.80%2C18.90%2C72.98%2C19.20&layer=mapnik'

  return (
    <div className="report-page">
      <header className="report-navbar">
        <button
          type="button"
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
          <span />
          Emergency Network Online
        </div>
      </header>

      <main className="report-content">
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
              Share accurate incident details and your location so response
              teams can coordinate assistance.
            </p>
          </div>
        </section>

        <section className="report-layout">
          <div className="report-form-card">
            <div className="form-card-header">
              <div>
                <span className="form-kicker">INCIDENT DETAILS</span>
                <h2>Emergency Information</h2>
                <p>Fields marked * are required.</p>
              </div>
              <div className="form-header-icon">
                <AlertTriangle size={24} />
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="disaster_type">
                  Disaster Type <span>*</span>
                </label>
                <select
                  id="disaster_type"
                  name="disaster_type"
                  value={formData.disaster_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select disaster type</option>
                  <option value="FLOOD">Flood</option>
                  <option value="FIRE">Fire</option>
                  <option value="EARTHQUAKE">Earthquake</option>
                  <option value="CYCLONE">Cyclone</option>
                  <option value="LANDSLIDE">Landslide</option>
                  <option value="BUILDING_COLLAPSE">Building Collapse</option>
                  <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Severity Level <span>*</span></label>
                <div className="severity-options">
                  {[
                    ['LOW', 'Low', 'Limited impact'],
                    ['MEDIUM', 'Medium', 'Needs attention'],
                    ['HIGH', 'High', 'Major emergency'],
                    ['CRITICAL', 'Critical', 'Immediate danger'],
                  ].map(([value, label, detail]) => (
                    <label
                      key={value}
                      className={`severity-option ${value.toLowerCase()} ${
                        formData.severity === value ? 'selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={value}
                        checked={formData.severity === value}
                        onChange={handleChange}
                        required={value === 'LOW'}
                      />
                      <div>
                        <strong>{label}</strong>
                        <small>{detail}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  <MapPin size={15} /> Emergency Location <span>*</span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Address, area, landmark or GPS location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="button"
                className="submit-report"
                onClick={useCurrentLocation}
                disabled={locating}
                style={{ marginBottom: 18, background: '#1769aa' }}
              >
                <LocateFixed size={18} />
                {locating ? 'Detecting GPS location...' : 'Use My Current Location'}
              </button>

              <div className="coordinates-row">
                <div className="form-group">
                  <label htmlFor="latitude">Latitude</label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="GPS latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="longitude">Longitude</label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="GPS longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={15} /> Incident Map
                </label>
                <div
                  style={{
                    overflow: 'hidden',
                    borderRadius: 14,
                    border: '1px solid #dbe5ef',
                    background: '#f3f6fa',
                  }}
                >
                  <iframe
                    title="Emergency location map"
                    src={mapUrl}
                    width="100%"
                    height="300"
                    style={{ display: 'block', border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <small style={{ display: 'block', marginTop: 8, color: '#64748b' }}>
                  {hasCoordinates
                    ? 'Map centered on the selected GPS coordinates.'
                    : 'Map shows Mumbai by default. Use GPS to center it on your current location.'}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <FileText size={15} /> Incident Description <span>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="6"
                  placeholder="What happened? Are people injured or trapped? Describe any immediate danger."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && (
                <div className="report-message error-message" role="alert">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="report-message success-message" role="status">
                  <CheckCircle2 size={18} />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                className="submit-report"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="submit-spinner" />
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
                Your report will be submitted to the RESQ response network.
              </p>
            </form>
          </div>

          <aside className="report-side">
            <div className="side-emergency-card">
              <div className="side-icon">
                <Siren size={25} />
              </div>
              <span>IN CASE OF IMMEDIATE DANGER</span>
              <h3>Stay Safe First</h3>
              <p>
                Move to a safe location if possible and contact local emergency
                services for urgent help.
              </p>
            </div>

            <div className="side-info-card">
              <span className="side-kicker">REPORTING TIPS</span>
              <h3>What makes a good report?</h3>
              {[
                'Give the exact location or nearest landmark.',
                'Clearly describe what is happening.',
                'Choose the severity based on immediate danger.',
                'Mention people or buildings at risk.',
              ].map((tip, index) => (
                <div className="tip" key={tip}>
                  <div>{String(index + 1).padStart(2, '0')}</div>
                  <p>{tip}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default ReportDisaster