import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import {
  MapPin,
  Navigation,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock3,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

const API_URL = 'http://localhost:5000'

// Fix default Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Different marker colors according to severity
const createSeverityIcon = (severity) => {
  const colors = {
    LOW: '#22c55e',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  }

  const color = colors[severity] || '#16a34a'

  return L.divIcon({
    className: 'resq-map-marker-wrapper',
    html: `
      <div
        class="resq-map-marker"
        style="
          background: ${color};
          box-shadow: 0 0 0 6px ${color}33, 0 8px 20px ${color}66;
        "
      >
        <span>!</span>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -40],
  })
}

// Automatically fit map around available disaster locations
function MapBounds({ disasters }) {
  const map = useMap()

  useEffect(() => {
    const validDisasters = disasters.filter(
      (item) =>
        item.latitude !== null &&
        item.longitude !== null &&
        !Number.isNaN(Number(item.latitude)) &&
        !Number.isNaN(Number(item.longitude))
    )

    if (validDisasters.length === 0) {
      map.setView([19.076, 72.8777], 11)
      return
    }

    if (validDisasters.length === 1) {
      map.setView(
        [
          Number(validDisasters[0].latitude),
          Number(validDisasters[0].longitude),
        ],
        14
      )
      return
    }

    const bounds = L.latLngBounds(
      validDisasters.map((item) => [
        Number(item.latitude),
        Number(item.longitude),
      ])
    )

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 14,
    })
  }, [disasters, map])

  return null
}

function MapView() {
  const [disasters, setDisasters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchDisasters = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('resq_token')

      if (!token) {
        setError('Please login to view disaster locations.')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/disasters`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load disaster locations')
      }

      setDisasters(data.disasters || [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Map disaster fetch error:', err)
      setError(err.message || 'Unable to load disaster locations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisasters()
  }, [])

  const validDisasters = disasters.filter(
    (item) =>
      item.latitude !== null &&
      item.longitude !== null &&
      !Number.isNaN(Number(item.latitude)) &&
      !Number.isNaN(Number(item.longitude))
  )

  const criticalCount = disasters.filter(
    (item) => item.severity === 'CRITICAL'
  ).length

  const highCount = disasters.filter(
    (item) => item.severity === 'HIGH'
  ).length

  const activeCount = disasters.filter(
    (item) =>
      !['RESOLVED', 'REJECTED'].includes(item.status)
  ).length

  const formatDate = (date) => {
    if (!date) return 'Unknown'

    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSeverityClass = (severity) => {
    return severity?.toLowerCase() || 'low'
  }

  return (
    <section className="map-page">
      {/* Header */}
      <div className="map-page-header">
        <div>
          <div className="map-eyebrow">
            <span className="map-eyebrow-dot"></span>
            LIVE RESPONSE MAP
          </div>

          <h1>
            Emergency
            <span> Response Map</span>
          </h1>

          <p>
            Monitor reported disaster locations and identify high-priority
            emergencies in real time.
          </p>
        </div>

        <button
          className="map-refresh-btn"
          onClick={fetchDisasters}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? 'refresh-spinning' : ''}
          />
          {loading ? 'Refreshing...' : 'Refresh Map'}
        </button>
      </div>

      {/* Stats */}
      <div className="map-stat-grid">
        <div className="map-stat-card">
          <div className="map-stat-icon green">
            <MapPin size={21} />
          </div>

          <div>
            <span>Total Reports</span>
            <strong>{disasters.length}</strong>
          </div>
        </div>

        <div className="map-stat-card">
          <div className="map-stat-icon orange">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Active Incidents</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="map-stat-card">
          <div className="map-stat-icon red">
            <ShieldAlert size={21} />
          </div>

          <div>
            <span>Critical</span>
            <strong>{criticalCount}</strong>
          </div>
        </div>

        <div className="map-stat-card">
          <div className="map-stat-icon blue">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>High Severity</span>
            <strong>{highCount}</strong>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="map-error">
          <AlertTriangle size={19} />
          <span>{error}</span>
        </div>
      )}

      {/* Map */}
      <div className="map-main-card">
        <div className="map-card-top">
          <div>
            <h2>
              <Navigation size={20} />
              Disaster Locations
            </h2>

            <p>
              {validDisasters.length} location
              {validDisasters.length !== 1 ? 's' : ''} available on map
            </p>
          </div>

          <div className="map-live-status">
            <span></span>
            Live Data
          </div>
        </div>

        <div className="map-container-wrapper">
          {loading && disasters.length === 0 ? (
            <div className="map-loading">
              <div className="map-loader"></div>
              <h3>Loading emergency map...</h3>
              <p>Fetching latest disaster locations.</p>
            </div>
          ) : (
            <MapContainer
              center={[19.076, 72.8777]}
              zoom={11}
              scrollWheelZoom={true}
              className="resq-leaflet-map"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapBounds disasters={validDisasters} />

              {validDisasters.map((disaster) => {
                const latitude = Number(disaster.latitude)
                const longitude = Number(disaster.longitude)

                const severity = disaster.severity || 'LOW'

                return (
                  <div key={disaster.id}>
                    <Marker
                      position={[latitude, longitude]}
                      icon={createSeverityIcon(severity)}
                    >
                      <Popup>
                        <div className="resq-popup">
                          <div
                            className={`popup-severity ${getSeverityClass(
                              severity
                            )}`}
                          >
                            {severity}
                          </div>

                          <h3>
                            {disaster.disaster_type || 'Emergency'}
                          </h3>

                          <p className="popup-location">
                            <MapPin size={14} />
                            {disaster.location || 'Location unavailable'}
                          </p>

                          <p className="popup-description">
                            {disaster.description ||
                              'No description available.'}
                          </p>

                          <div className="popup-info">
                            <div>
                              <span>Status</span>
                              <strong>
                                {disaster.status || 'REPORTED'}
                              </strong>
                            </div>

                            <div>
                              <span>Reported By</span>
                              <strong>
                                {disaster.reporter_name || 'Citizen'}
                              </strong>
                            </div>
                          </div>

                          <div className="popup-date">
                            <Clock3 size={13} />
                            {formatDate(disaster.created_at)}
                          </div>
                        </div>
                      </Popup>
                    </Marker>

                    {severity === 'CRITICAL' && (
                      <Circle
                        center={[latitude, longitude]}
                        radius={500}
                        pathOptions={{
                          color: '#ef4444',
                          fillColor: '#ef4444',
                          fillOpacity: 0.08,
                          weight: 2,
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </MapContainer>
          )}

          {!loading && validDisasters.length === 0 && !error && (
            <div className="map-empty-overlay">
              <div className="map-empty-icon">
                <MapPin size={30} />
              </div>

              <h3>No mapped incidents yet</h3>

              <p>
                Disaster reports with latitude and longitude will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-title">Severity</div>

          <div className="legend-item">
            <span className="legend-dot low"></span>
            Low
          </div>

          <div className="legend-item">
            <span className="legend-dot medium"></span>
            Medium
          </div>

          <div className="legend-item">
            <span className="legend-dot high"></span>
            High
          </div>

          <div className="legend-item">
            <span className="legend-dot critical"></span>
            Critical
          </div>
        </div>
      </div>

      {/* Bottom information */}
      <div className="map-info-grid">
        <div className="map-info-card">
          <div className="map-info-icon">
            <MapPin size={21} />
          </div>

          <div>
            <h3>Location Intelligence</h3>
            <p>
              Disaster reports are plotted using the latitude and longitude
              submitted with each emergency report.
            </p>
          </div>
        </div>

        <div className="map-info-card">
          <div className="map-info-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <h3>Real-time Updates</h3>
            <p>
              Refresh the map to fetch the latest disaster reports directly
              from the RESQ backend.
            </p>
          </div>
        </div>
      </div>

      {lastUpdated && (
        <div className="map-last-updated">
          Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
        </div>
      )}
    </section>
  )
}

export default MapView