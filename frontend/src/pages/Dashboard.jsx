import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  LocateFixed,
  MapPin,
  MapPinned,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Siren,
  Users,
  XCircle,
  Package,
  Activity,
  Phone,
  UserRound,
  MapPinned as LocationIcon,
  ClipboardCheck,
  Truck,
} from 'lucide-react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Dashboard.css'

const API_URL = 'http://localhost:5000'
const DEFAULT_CENTER = [19.076, 72.8777]

const COLORS = {
  navy: '#10243e',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#15803d',
  muted: '#64748b',
  text: '#334155',
  border: '#e2e8f0',
  background: '#f5f8fc',
}

const statusColors = {
  REPORTED: { bg: '#fff7ed', color: '#c2410c' },
  VERIFIED: { bg: '#eff6ff', color: '#1d4ed8' },
  ASSIGNED: { bg: '#f5f3ff', color: '#6d28d9' },
  IN_PROGRESS: { bg: '#ecfeff', color: '#0e7490' },
  RESOLVED: { bg: '#dcfce7', color: '#166534' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
}

const teamStatusColors = {
  AVAILABLE: { bg: '#dcfce7', color: '#166534' },
  BUSY: { bg: '#ffedd5', color: '#c2410c' },
  OFFLINE: { bg: '#f1f5f9', color: '#475569' },
}

const markerIcon = L.icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function getToken() {
  return (
    localStorage.getItem('resq_token') ||
    sessionStorage.getItem('resq_token') ||
    ''
  )
}

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem('resq_user') ||
        sessionStorage.getItem('resq_user') ||
        'null',
    )
  } catch {
    return null
  }
}

function getArray(data, key) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.rows)) return data.rows
  return []
}

function formatStatus(value) {
  return String(value || 'REPORTED')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getSeverityColor(severity) {
  const value = String(severity || 'MEDIUM').toUpperCase()

  if (value === 'CRITICAL') return '#b91c1c'
  if (value === 'HIGH') return '#ea580c'
  if (value === 'MEDIUM') return '#ca8a04'
  return '#15803d'
}

function getCoordinates(item) {
  const latitude = Number(item?.latitude)
  const longitude = Number(item?.longitude)

  if (
    item?.latitude === null ||
    item?.latitude === undefined ||
    item?.longitude === null ||
    item?.longitude === undefined ||
    item?.latitude === '' ||
    item?.longitude === '' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null
  }

  return [latitude, longitude]
}

function MapRecenter({ center }) {
  const map = useMap()

  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, Math.max(map.getZoom(), 12), {
        animate: true,
      })
    }
  }, [center, map])

  return null
}

function MapSizeFix() {
  const map = useMap()

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 150)
    return () => window.clearTimeout(timer)
  }, [map])

  return null
}

function StatCard({ icon: Icon, label, value, color, note }) {
  return (
    <section style={styles.card}>
      <div style={styles.statHeader}>
        <span style={{ color: COLORS.muted, fontSize: 12, fontWeight: 650 }}>
          {label}
        </span>
        <span
          style={{
            width: 39,
            height: 39,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            color,
            background: `${color}14`,
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </span>
      </div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statNote}>{note}</div>
    </section>
  )
}

function ActionButton({
  children,
  onClick,
  disabled = false,
  color = COLORS.blue,
  background = '#fff',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.actionButton,
        borderColor: `${color}35`,
        background,
        color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}

const styles = {
  card: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 17,
    padding: 20,
    minWidth: 0,
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.035)',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statValue: {
    color: COLORS.navy,
    fontSize: 29,
    fontWeight: 850,
    marginTop: 12,
  },
  statNote: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },
  actionButton: {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    border: '1px solid',
    borderRadius: 10,
    padding: '9px 12px',
    fontSize: 12,
    fontWeight: 750,
    whiteSpace: 'nowrap',
  },
  input: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    color: COLORS.navy,
    background: '#fff',
    fontSize: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 19,
    color: COLORS.navy,
    display: 'flex',
    alignItems: 'center',
    gap: 9,
  },
  muted: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.6,
  },
}

function TeamDetail({ team, index, assignedReports = [] }) {
  const status = String(team.status || 'AVAILABLE').toUpperCase()
  const statusStyle = teamStatusColors[status] || teamStatusColors.OFFLINE

  const teamAssignments = assignedReports.filter(
    (report) =>
      String(
        report.team_id ??
          report.response_team_id ??
          report.assigned_team_id ??
          '',
      ) === String(team.id),
  )

  return (
    <article
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 15,
        background: '#fff',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 11, minWidth: 0 }}>
          <div
            style={{
              width: 43,
              height: 43,
              borderRadius: 13,
              display: 'grid',
              placeItems: 'center',
              background: '#eff6ff',
              color: COLORS.blue,
              flexShrink: 0,
            }}
          >
            <Truck size={21} />
          </div>

          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: '2px 0 5px',
                color: COLORS.navy,
                fontSize: 14,
                overflowWrap: 'anywhere',
              }}
            >
              {team.team_name || team.name || `Response Team ${index + 1}`}
            </h3>
            <div style={{ color: COLORS.muted, fontSize: 11 }}>
              Team ID: {team.id ?? 'Not provided'}
            </div>
          </div>
        </div>

        <span
          style={{
            background: statusStyle.bg,
            color: statusStyle.color,
            padding: '6px 8px',
            borderRadius: 20,
            fontSize: 9,
            fontWeight: 850,
            whiteSpace: 'nowrap',
          }}
        >
          {status}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
          gap: 10,
          marginTop: 15,
        }}
      >
        <div style={teamInfoStyle}>
          <UserRound size={15} color={COLORS.blue} />
          <div>
            <div style={teamLabelStyle}>Team leader</div>
            <div style={teamValueStyle}>{team.leader || 'Not provided'}</div>
          </div>
        </div>

        <div style={teamInfoStyle}>
          <Users size={15} color={COLORS.blue} />
          <div>
            <div style={teamLabelStyle}>Team members</div>
            <div style={teamValueStyle}>
              {team.member_count ?? 'Not provided'}
            </div>
          </div>
        </div>

        <div style={teamInfoStyle}>
          <Phone size={15} color={COLORS.blue} />
          <div>
            <div style={teamLabelStyle}>Contact</div>
            <div style={teamValueStyle}>
              {team.phone || 'Not provided'}
            </div>
          </div>
        </div>

        <div style={teamInfoStyle}>
          <LocationIcon size={15} color={COLORS.blue} />
          <div>
            <div style={teamLabelStyle}>Team location</div>
            <div style={teamValueStyle}>
              {team.location || 'Not provided'}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${COLORS.border}`,
          marginTop: 13,
          paddingTop: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: COLORS.muted }}>
          Unit type: <strong>{team.type || team.team_type || 'Not provided'}</strong>
        </span>
        <span style={{ fontSize: 11, color: COLORS.muted }}>
          Linked reports: <strong>{teamAssignments.length}</strong>
        </span>
      </div>
    </article>
  )
}

const teamInfoStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 7,
  padding: 9,
  borderRadius: 10,
  background: '#f8fafc',
  minWidth: 0,
}

const teamLabelStyle = {
  color: COLORS.muted,
  fontSize: 10,
  marginBottom: 4,
}

const teamValueStyle = {
  color: COLORS.navy,
  fontSize: 11,
  fontWeight: 750,
  overflowWrap: 'anywhere',
}

function Dashboard() {
  const user = useMemo(() => getStoredUser(), [])
  const role = String(
    user?.role || user?.userType || user?.user_type || 'CITIZEN',
  ).toUpperCase()

  const isAdmin = role === 'ADMIN'
  const isResponseTeam = role === 'RESPONSE_TEAM'
  const isCitizen = role === 'CITIZEN'

  const [reports, setReports] = useState([])
  const [teams, setTeams] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [teamStatusFilter, setTeamStatusFilter] = useState('ALL')
  const [teamSearch, setTeamSearch] = useState('')
  const [locating, setLocating] = useState(false)
  const [gps, setGps] = useState(null)
  const [gpsMessage, setGpsMessage] = useState('')
  const [selectedTeam, setSelectedTeam] = useState({})
  const [selectedResource, setSelectedResource] = useState({})
  const [resourceQuantity, setResourceQuantity] = useState({})
  const [busyId, setBusyId] = useState(null)

  const token = getToken()

  const apiFetch = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      })

      const text = await response.text()
      let data = {}

      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = { message: text }
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Request failed (${response.status})`,
        )
      }

      return data
    },
    [token],
  )

  const loadDashboard = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true)
      setError('')

      const results = await Promise.allSettled([
        apiFetch('/api/disasters'),
        apiFetch('/api/teams'),
        apiFetch('/api/resources'),
      ])

      if (results[0].status === 'fulfilled') {
        setReports(getArray(results[0].value, 'disasters'))
      }

      if (results[1].status === 'fulfilled') {
        setTeams(getArray(results[1].value, 'teams'))
      }

      if (results[2].status === 'fulfilled') {
        setResources(getArray(results[2].value, 'resources'))
      }

      if (results[0].status === 'rejected') {
        setError(
          `Could not load emergency reports: ${results[0].reason?.message || 'Check the backend and your login.'}`,
        )
      } else {
        const failed = results
          .slice(1)
          .filter((result) => result.status === 'rejected')

        if (failed.length) {
          setError(
            `Reports loaded, but some dashboard data could not load: ${failed
              .map((result) => result.reason?.message)
              .filter(Boolean)
              .join('; ')}`,
          )
        }
      }

      setLoading(false)
      setRefreshing(false)
    },
    [apiFetch],
  )

  useEffect(() => {
    loadDashboard(true)
  }, [loadDashboard])

  const myReports = useMemo(() => {
    if (!isCitizen || !user) return reports

    const userId = user.id ?? user.user_id
    const email = String(user.email || '').toLowerCase()

    return reports.filter((report) => {
      const reporterId =
        report.reported_by ??
        report.reporter_id ??
        report.user_id ??
        report.created_by

      const reporterEmail = String(
        report.reporter_email || report.email || '',
      ).toLowerCase()

      if (userId != null && reporterId != null) {
        return String(reporterId) === String(userId)
      }

      if (email && reporterEmail) return reporterEmail === email
      return false
    })
  }, [reports, isCitizen, user])

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase()

    return myReports.filter((item) => {
      const status = String(item.status || 'REPORTED').toUpperCase()
      const severity = String(item.severity || 'MEDIUM').toUpperCase()

      const matchesSearch =
        !query ||
        String(item.disaster_type || '').toLowerCase().includes(query) ||
        String(item.location || '').toLowerCase().includes(query) ||
        String(item.description || '').toLowerCase().includes(query) ||
        String(item.reporter_name || '').toLowerCase().includes(query)

      return (
        matchesSearch &&
        (statusFilter === 'ALL' || status === statusFilter) &&
        (severityFilter === 'ALL' || severity === severityFilter)
      )
    })
  }, [myReports, search, statusFilter, severityFilter])

  const reportsWithCoordinates = useMemo(
    () =>
      reports
        .map((report) => ({
          ...report,
          coordinates: getCoordinates(report),
        }))
        .filter((report) => report.coordinates),
    [reports],
  )

  const mapCenter = useMemo(() => {
    if (gps) return [gps.latitude, gps.longitude]
    return reportsWithCoordinates[0]?.coordinates || DEFAULT_CENTER
  }, [gps, reportsWithCoordinates])

  const computedStats = useMemo(() => {
    const source = isCitizen ? myReports : reports

    return {
      total: source.length,
      active: source.filter((item) =>
        ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS'].includes(
          String(item.status || 'REPORTED').toUpperCase(),
        ),
      ).length,
      critical: source.filter(
        (item) =>
          String(item.severity || '').toUpperCase() === 'CRITICAL' &&
          !['RESOLVED', 'REJECTED'].includes(
            String(item.status || '').toUpperCase(),
          ),
      ).length,
      resolved: source.filter(
        (item) => String(item.status || '').toUpperCase() === 'RESOLVED',
      ).length,
    }
  }, [reports, myReports, isCitizen])

  const availableTeams = useMemo(
    () =>
      teams.filter(
        (team) =>
          String(team.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE',
      ),
    [teams],
  )

  const filteredTeams = useMemo(() => {
    const query = teamSearch.trim().toLowerCase()

    return teams.filter((team) => {
      const status = String(team.status || 'AVAILABLE').toUpperCase()
      const searchableText = [
        team.team_name,
        team.name,
        team.type,
        team.leader,
        team.phone,
        team.location,
        team.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        (teamStatusFilter === 'ALL' || status === teamStatusFilter) &&
        (!query || searchableText.includes(query))
      )
    })
  }, [teams, teamSearch, teamStatusFilter])

  const teamStats = useMemo(
    () => ({
      total: teams.length,
      available: teams.filter(
        (team) =>
          String(team.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE',
      ).length,
      busy: teams.filter(
        (team) => String(team.status || '').toUpperCase() === 'BUSY',
      ).length,
      offline: teams.filter(
        (team) => String(team.status || '').toUpperCase() === 'OFFLINE',
      ).length,
    }),
    [teams],
  )

  const notifyAction = (message, isError = false) => {
    setActionMessage(isError ? '' : message)
    setActionError(isError ? message : '')
  }

  const updateReportStatus = async (reportId, newStatus) => {
    if (!reportId) {
      notifyAction('This report does not have a valid ID.', true)
      return
    }

    if (!isAdmin && !isResponseTeam) {
      notifyAction('You are not authorized to update this report.', true)
      return
    }

    setBusyId(reportId)
    setActionMessage('')
    setActionError('')

    try {
      await apiFetch(`/api/disasters/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })

      notifyAction(`Report status updated to ${formatStatus(newStatus)}.`)
      await loadDashboard(false)
    } catch (requestError) {
      notifyAction(
        requestError.message || 'Could not update report status.',
        true,
      )
    } finally {
      setBusyId(null)
    }
  }

  const assignTeam = async (reportId) => {
    if (!isAdmin) {
      notifyAction('Only an Admin can assign a response team.', true)
      return
    }

    const teamId = selectedTeam[reportId]

    if (!teamId) {
      notifyAction('Select a response team before assigning this report.', true)
      return
    }

    const report = reports.find(
      (item) => String(item.id) === String(reportId),
    )

    if (!report) {
      notifyAction('Report not found. Refresh the dashboard and try again.', true)
      return
    }

    const selectedTeamRecord = availableTeams.find(
      (team) => String(team.id) === String(teamId),
    )

    if (!selectedTeamRecord) {
      notifyAction(
        'This team is no longer available. Refresh the dashboard and select another team.',
        true,
      )
      await loadDashboard(false)
      return
    }

    setBusyId(reportId)
    setActionMessage('')
    setActionError('')

    try {
      // The backend expects snake_case fields.
      await apiFetch('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          disaster_id: reportId,
          team_id: teamId,
        }),
      })

      notifyAction(
        `${selectedTeamRecord.team_name || `Team ${teamId}`} assigned successfully to report #${reportId}.`,
      )

      setSelectedTeam((current) => ({ ...current, [reportId]: '' }))
      await loadDashboard(false)
    } catch (requestError) {
      notifyAction(
        requestError.message ||
          'Could not assign the team. Check team availability and the backend.',
        true,
      )
    } finally {
      setBusyId(null)
    }
  }

  const allocateResource = async (reportId) => {
    if (!isAdmin) {
      notifyAction('Only an Admin can allocate resources.', true)
      return
    }

    const resourceId = selectedResource[reportId]
    const quantity = Number(resourceQuantity[reportId])

    if (!resourceId) {
      notifyAction('Select a resource to allocate.', true)
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      notifyAction('Enter a quantity greater than zero.', true)
      return
    }

    const resource = resources.find(
      (item) => String(item.id) === String(resourceId),
    )

    if (!resource) {
      notifyAction('Selected resource was not found. Refresh and try again.', true)
      return
    }

    const available = Number(
      resource.quantity ?? resource.available_quantity ?? resource.stock,
    )

    if (Number.isFinite(available) && quantity > available) {
      notifyAction(`Only ${available} unit(s) of this resource are listed.`, true)
      return
    }

    setBusyId(reportId)
    setActionMessage('')
    setActionError('')

    try {
      await apiFetch('/api/allocations', {
        method: 'POST',
        body: JSON.stringify({
          resource_id: resourceId,
          disaster_id: reportId,
          quantity,
        }),
      })

      notifyAction('Resource allocation submitted successfully.')
      setSelectedResource((current) => ({ ...current, [reportId]: '' }))
      setResourceQuantity((current) => ({ ...current, [reportId]: '' }))
      await loadDashboard(false)
    } catch (requestError) {
      notifyAction(
        requestError.message ||
          'Could not allocate resource. Check the allocation API and stock.',
        true,
      )
    } finally {
      setBusyId(null)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    await loadDashboard(false)
  }

  const getCurrentLocation = () => {
    setGpsMessage('')
    setActionMessage('')
    setActionError('')

    if (!navigator.geolocation) {
      setGpsMessage('Geolocation is not supported by this browser.')
      return
    }

    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setGpsMessage('Current location detected successfully.')
        setLocating(false)
      },
      (locationError) => {
        const messages = {
          1: 'Location permission was denied. Allow location access in browser settings.',
          2: 'Your location could not be determined. Try again outdoors.',
          3: 'Location request timed out. Please try again.',
        }

        setGpsMessage(
          messages[locationError.code] ||
            'Could not access your location. Please try again.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }

  const cardStyle = styles.card
  const inputStyle = styles.input

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.background,
        color: COLORS.text,
      }}
    >
      <main
        style={{
          maxWidth: 1500,
          margin: '0 auto',
          padding: '26px clamp(14px, 3vw, 34px) 18px',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
            marginBottom: 25,
          }}
        >
          <div>
            <div
              style={{
                color: COLORS.blue,
                fontSize: 11,
                fontWeight: 850,
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              RESQ · SMART RESPONSE NETWORK
            </div>

            <h1
              style={{
                margin: 0,
                color: COLORS.navy,
                fontSize: 'clamp(25px, 3vw, 34px)',
                letterSpacing: -1,
              }}
            >
              {isAdmin
                ? 'Admin Dashboard'
                : isResponseTeam
                  ? 'Response Team Dashboard'
                  : 'Emergency Dashboard'}
            </h1>

            <p
              style={{
                margin: '8px 0 0',
                color: COLORS.muted,
                fontSize: 13,
              }}
            >
              Welcome{user?.name ? `, ${user.name}` : ''}. Monitor emergencies
              and response activity.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 9,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                background: '#fff',
                color: COLORS.navy,
                padding: '10px 13px',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <ShieldCheck
                size={14}
                style={{ verticalAlign: 'middle', marginRight: 6 }}
              />
              {formatStatus(role)}
            </span>

            <ActionButton onClick={refresh} disabled={refreshing}>
              <RefreshCw size={15} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </ActionButton>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 18,
              border: '1px solid #fecaca',
              background: '#fff1f2',
              color: '#b91c1c',
              borderRadius: 12,
              padding: 14,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <strong>Dashboard warning:</strong> {error}
            <div style={{ marginTop: 9 }}>
              <ActionButton onClick={refresh} color={COLORS.red}>
                <RefreshCw size={14} /> Try again
              </ActionButton>
            </div>
          </div>
        )}

        {actionMessage && (
          <div
            role="status"
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              background: '#f0fdf4',
              color: '#166534',
              fontSize: 12,
            }}
          >
            <CheckCircle2
              size={15}
              style={{ verticalAlign: 'middle', marginRight: 7 }}
            />
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              background: '#fff1f2',
              color: '#b91c1c',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            <XCircle
              size={15}
              style={{ verticalAlign: 'middle', marginRight: 7 }}
            />
            {actionError}
          </div>
        )}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 14,
            marginBottom: 22,
          }}
        >
          <StatCard
            icon={FileText}
            label={isCitizen ? 'My Reports' : 'Total Reports'}
            value={loading ? '…' : computedStats.total}
            color={COLORS.blue}
            note="Reports returned by the backend"
          />
          <StatCard
            icon={Activity}
            label="Active Emergencies"
            value={loading ? '…' : computedStats.active}
            color="#ea580c"
            note="Not yet resolved or rejected"
          />
          <StatCard
            icon={AlertTriangle}
            label="Critical Reports"
            value={loading ? '…' : computedStats.critical}
            color={COLORS.red}
            note="Unresolved critical incidents"
          />
          <StatCard
            icon={CheckCircle2}
            label="Resolved Reports"
            value={loading ? '…' : computedStats.resolved}
            color={COLORS.green}
            note="Marked as resolved"
          />
        </section>

        {/* NEW: Admin team availability summary */}
        {isAdmin && (
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
              marginBottom: 22,
            }}
          >
            {[
              {
                label: 'Total Response Teams',
                value: teamStats.total,
                color: COLORS.blue,
                icon: Users,
              },
              {
                label: 'Available Teams',
                value: teamStats.available,
                color: COLORS.green,
                icon: CheckCircle2,
              },
              {
                label: 'Teams on Mission',
                value: teamStats.busy,
                color: '#ea580c',
                icon: Truck,
              },
              {
                label: 'Offline Teams',
                value: teamStats.offline,
                color: COLORS.muted,
                icon: Clock3,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  ...cardStyle,
                  padding: 16,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    display: 'grid',
                    placeItems: 'center',
                    background: `${item.color}14`,
                    color: item.color,
                    flexShrink: 0,
                  }}
                >
                  <item.icon size={19} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.muted,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 850,
                      color: COLORS.navy,
                      marginTop: 4,
                    }}
                  >
                    {loading ? '…' : item.value}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {isCitizen && (
          <section
            style={{
              ...cardStyle,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 18,
              marginBottom: 22,
              background: 'linear-gradient(120deg, #10243e, #1d4ed8)',
              border: 0,
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 15,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#ffffff20',
                }}
              >
                <Siren size={27} />
              </div>

              <div>
                <h2 style={{ margin: 0, fontSize: 19 }}>
                  Need emergency assistance?
                </h2>
                <p
                  style={{
                    margin: '6px 0 0',
                    color: '#dbeafe',
                    fontSize: 12,
                  }}
                >
                  Submit an emergency report for the response team.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/report-disaster'
              }}
              style={{
                ...styles.actionButton,
                background: '#fff',
                color: COLORS.navy,
                borderColor: '#fff',
              }}
            >
              Report an Emergency <ArrowRight size={17} />
            </button>
          </section>
        )}

        {/* NEW: Full Response Team Management section for Admin */}
        {isAdmin && (
          <section style={{ ...cardStyle, marginBottom: 22 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                marginBottom: 17,
              }}
            >
              <div>
                <h2 style={styles.sectionTitle}>
                  <Users size={22} color={COLORS.blue} />
                  Response Team Management
                </h2>
                <p style={{ ...styles.muted, margin: '7px 0 0' }}>
                  View team leader, contact, unit type, member count, location
                  and current availability before assigning an emergency.
                </p>
              </div>

              <span
                style={{
                  background: '#eff6ff',
                  color: COLORS.blue,
                  borderRadius: 20,
                  padding: '8px 11px',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {filteredTeams.length} teams displayed
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <input
                className="resq-dashboard-input"
                style={inputStyle}
                value={teamSearch}
                onChange={(event) => setTeamSearch(event.target.value)}
                placeholder="Search name, leader, phone, location..."
                aria-label="Search response teams"
              />

              <select
                className="resq-dashboard-input"
                style={inputStyle}
                value={teamStatusFilter}
                onChange={(event) => setTeamStatusFilter(event.target.value)}
                aria-label="Filter teams by availability"
              >
                <option value="ALL">All team statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy / on mission</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>

            {loading && teams.length === 0 && (
              <p style={styles.muted}>Loading response team details...</p>
            )}

            {!loading && teams.length === 0 && (
              <div
                style={{
                  background: '#f8fafc',
                  border: `1px dashed ${COLORS.border}`,
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center',
                  color: COLORS.muted,
                  fontSize: 12,
                }}
              >
                <Users size={28} style={{ marginBottom: 9 }} />
                <div style={{ fontWeight: 750, color: COLORS.navy }}>
                  No response teams found
                </div>
                <p style={{ marginBottom: 0 }}>
                  Add response teams through your team management/API workflow,
                  then refresh this dashboard.
                </p>
              </div>
            )}

            {teams.length > 0 && filteredTeams.length === 0 && (
              <p style={styles.muted}>
                No teams match your search or selected status.
              </p>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
                gap: 13,
              }}
            >
              {filteredTeams.map((team, index) => (
                <TeamDetail
                  key={team.id ?? index}
                  team={team}
                  index={index}
                  assignedReports={reports.filter((report) =>
                    ['ASSIGNED', 'IN_PROGRESS'].includes(
                      String(report.status || '').toUpperCase(),
                    ),
                  )}
                />
              ))}
            </div>

            <div
              style={{
                marginTop: 15,
                padding: 12,
                background: '#fffbeb',
                color: '#92400e',
                borderRadius: 10,
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              <strong>Member details note:</strong> Your current teams API
              returns a member count, not individual member records. Individual
              member names and profiles will appear only after those records
              are stored and returned by the backend.
            </div>
          </section>
        )}

        <section
          className="resq-dashboard-lower"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.45fr) minmax(300px, 0.9fr)',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: 20, minWidth: 0 }}>
            <section style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 15,
                  flexWrap: 'wrap',
                  marginBottom: 20,
                }}
              >
                <div>
                  <h2 style={styles.sectionTitle}>
                    <AlertTriangle size={21} color={COLORS.blue} />
                    {isCitizen ? 'My Emergency Reports' : 'Emergency Report Inbox'}
                  </h2>
                  <p style={{ ...styles.muted, margin: '7px 0 0' }}>
                    {isAdmin
                      ? 'Review citizen reports, verify incidents, assign response teams and allocate resources.'
                      : 'Track incident status, location and priority.'}
                  </p>
                </div>

                {isCitizen && (
                  <ActionButton
                    onClick={() => {
                      window.location.hash = '#/report-disaster'
                    }}
                    color="#fff"
                    background={COLORS.blue}
                  >
                    <Siren size={15} /> Report
                  </ActionButton>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                  gap: 10,
                  marginBottom: 17,
                }}
              >
                <input
                  className="resq-dashboard-input"
                  style={inputStyle}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search incident or location..."
                  aria-label="Search reports"
                />

                <select
                  className="resq-dashboard-input"
                  style={inputStyle}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="ALL">All statuses</option>
                  <option value="REPORTED">Reported</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <select
                  className="resq-dashboard-input"
                  style={inputStyle}
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value)}
                  aria-label="Filter by severity"
                >
                  <option value="ALL">All priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="resq-dashboard-table-wrap">
                <table className="resq-dashboard-table">
                  <thead>
                    <tr>
                      <th>Incident / Analysis</th>
                      <th>Location</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Reported</th>
                      {(isAdmin || isResponseTeam) && <th>Actions</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReports.map((item) => {
                      const status = String(item.status || 'REPORTED').toUpperCase()
                      const badge = statusColors[status] || statusColors.REPORTED
                      const coordinates = getCoordinates(item)
                      const busy = busyId === item.id

                      const availableForReport = teams.filter(
                        (team) =>
                          String(team.status || 'AVAILABLE').toUpperCase() ===
                          'AVAILABLE',
                      )

                      const resourceForReport = resources.find(
                        (resource) =>
                          String(resource.id) ===
                          String(selectedResource[item.id] || ''),
                      )

                      const stock = Number(
                        resourceForReport?.quantity ??
                          resourceForReport?.available_quantity ??
                          resourceForReport?.stock,
                      )

                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ color: COLORS.navy, fontWeight: 750 }}>
                              {formatStatus(item.disaster_type || 'Emergency')}
                            </div>
                            <div
                              style={{
                                color: COLORS.muted,
                                fontSize: 11,
                                marginTop: 5,
                                maxWidth: 260,
                                lineHeight: 1.5,
                              }}
                            >
                              {item.description || 'No description provided'}
                            </div>

                            {isAdmin && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: COLORS.muted,
                                  marginTop: 6,
                                }}
                              >
                                Report ID: {item.id}
                                {item.reporter_name
                                  ? ` · By ${item.reporter_name}`
                                  : ''}
                              </div>
                            )}
                          </td>

                          <td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                color: COLORS.text,
                              }}
                            >
                              <MapPin size={14} color={COLORS.muted} />
                              {item.location || 'Location unavailable'}
                            </div>

                            {coordinates && (
                              <button
                                type="button"
                                onClick={() =>
                                  setGps({
                                    latitude: coordinates[0],
                                    longitude: coordinates[1],
                                  })
                                }
                                style={{
                                  border: 0,
                                  background: 'transparent',
                                  padding: '5px 0 0',
                                  fontSize: 11,
                                  color: COLORS.blue,
                                  cursor: 'pointer',
                                }}
                              >
                                <MapPinned
                                  size={12}
                                  style={{
                                    verticalAlign: 'middle',
                                    marginRight: 4,
                                  }}
                                />
                                Show on map
                              </button>
                            )}
                          </td>

                          <td>
                            <span
                              style={{
                                color: getSeverityColor(item.severity),
                                fontWeight: 800,
                                fontSize: 11,
                              }}
                            >
                              {String(item.severity || 'MEDIUM').toUpperCase()}
                            </span>
                          </td>

                          <td>
                            <span
                              style={{
                                background: badge.bg,
                                color: badge.color,
                                borderRadius: 20,
                                padding: '6px 9px',
                                fontSize: 10,
                                fontWeight: 800,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatStatus(status)}
                            </span>
                          </td>

                          <td
                            style={{
                              color: COLORS.muted,
                              whiteSpace: 'nowrap',
                              fontSize: 11,
                            }}
                          >
                            {formatDate(item.created_at)}
                          </td>

                          {(isAdmin || isResponseTeam) && (
                            <td>
                              <div
                                style={{
                                  display: 'grid',
                                  gap: 8,
                                  minWidth: 180,
                                }}
                              >
                                {isAdmin && status === 'REPORTED' && (
                                  <>
                                    <ActionButton
                                      disabled={busy}
                                      onClick={() =>
                                        updateReportStatus(item.id, 'VERIFIED')
                                      }
                                      color={COLORS.green}
                                    >
                                      <CheckCircle2 size={13} /> Verify report
                                    </ActionButton>

                                    <ActionButton
                                      disabled={busy}
                                      onClick={() =>
                                        updateReportStatus(item.id, 'REJECTED')
                                      }
                                      color={COLORS.red}
                                    >
                                      <XCircle size={13} /> Reject report
                                    </ActionButton>
                                  </>
                                )}

                                {isAdmin &&
                                  ['VERIFIED', 'REPORTED'].includes(status) && (
                                    <>
                                      <label
                                        style={{
                                          fontSize: 10,
                                          fontWeight: 750,
                                          color: COLORS.muted,
                                        }}
                                      >
                                        Assign response team
                                      </label>

                                      <select
                                        className="resq-dashboard-input"
                                        style={inputStyle}
                                        aria-label="Select available response team"
                                        value={selectedTeam[item.id] || ''}
                                        onChange={(event) =>
                                          setSelectedTeam((current) => ({
                                            ...current,
                                            [item.id]: event.target.value,
                                          }))
                                        }
                                      >
                                        <option value="">
                                          Select available team
                                        </option>

                                        {availableForReport.map((team) => (
                                          <option key={team.id} value={team.id}>
                                            {team.team_name ||
                                              team.name ||
                                              `Team ${team.id}`}
                                            {team.type ? ` · ${team.type}` : ''}
                                            {team.leader
                                              ? ` · Leader: ${team.leader}`
                                              : ''}
                                          </option>
                                        ))}
                                      </select>

                                      {selectedTeam[item.id] && (
                                        <div
                                          style={{
                                            background: '#f8fafc',
                                            borderRadius: 9,
                                            padding: 10,
                                            fontSize: 11,
                                            lineHeight: 1.7,
                                            color: COLORS.text,
                                          }}
                                        >
                                          {(() => {
                                            const selected = availableForReport.find(
                                              (team) =>
                                                String(team.id) ===
                                                String(selectedTeam[item.id]),
                                            )

                                            if (!selected) return null

                                            return (
                                              <>
                                                <strong>
                                                  {selected.team_name ||
                                                    selected.name ||
                                                    `Team ${selected.id}`}
                                                </strong>
                                                <div>
                                                  Leader:{' '}
                                                  {selected.leader || 'Not provided'}
                                                </div>
                                                <div>
                                                  Phone:{' '}
                                                  {selected.phone || 'Not provided'}
                                                </div>
                                                <div>
                                                  Members:{' '}
                                                  {selected.member_count ??
                                                    'Not provided'}
                                                </div>
                                                <div>
                                                  Location:{' '}
                                                  {selected.location ||
                                                    'Not provided'}
                                                </div>
                                              </>
                                            )
                                          })()}
                                        </div>
                                      )}

                                      {availableForReport.length === 0 && (
                                        <span
                                          style={{
                                            color: COLORS.red,
                                            fontSize: 10,
                                          }}
                                        >
                                          No available teams returned by the API.
                                        </span>
                                      )}

                                      <ActionButton
                                        disabled={
                                          busy || availableForReport.length === 0
                                        }
                                        onClick={() => assignTeam(item.id)}
                                      >
                                        <Users size={13} />
                                        {busy ? 'Assigning...' : 'Assign team'}
                                      </ActionButton>
                                    </>
                                  )}

                                {isAdmin &&
                                  !['REJECTED', 'RESOLVED'].includes(status) && (
                                    <div
                                      style={{
                                        borderTop: `1px solid ${COLORS.border}`,
                                        paddingTop: 9,
                                        marginTop: 2,
                                      }}
                                    >
                                      <label
                                        style={{
                                          display: 'block',
                                          fontSize: 10,
                                          fontWeight: 750,
                                          color: COLORS.muted,
                                          marginBottom: 6,
                                        }}
                                      >
                                        Allocate resource
                                      </label>

                                      <select
                                        className="resq-dashboard-input"
                                        style={inputStyle}
                                        aria-label="Select resource"
                                        value={selectedResource[item.id] || ''}
                                        onChange={(event) =>
                                          setSelectedResource((current) => ({
                                            ...current,
                                            [item.id]: event.target.value,
                                          }))
                                        }
                                      >
                                        <option value="">Select resource</option>

                                        {resources.map((resource) => {
                                          const quantity =
                                            resource.quantity ??
                                            resource.available_quantity ??
                                            resource.stock ??
                                            'Unknown stock'

                                          return (
                                            <option
                                              key={resource.id}
                                              value={resource.id}
                                            >
                                              {resource.name ||
                                                resource.resource_name ||
                                                resource.type ||
                                                `Resource ${resource.id}`}
                                              {' — stock: '}
                                              {quantity}
                                            </option>
                                          )
                                        })}
                                      </select>

                                      <input
                                        className="resq-dashboard-input"
                                        style={{ ...inputStyle, marginTop: 7 }}
                                        type="number"
                                        min="1"
                                        step="1"
                                        max={
                                          Number.isFinite(stock) ? stock : undefined
                                        }
                                        placeholder="Quantity"
                                        aria-label="Resource quantity"
                                        value={resourceQuantity[item.id] || ''}
                                        onChange={(event) =>
                                          setResourceQuantity((current) => ({
                                            ...current,
                                            [item.id]: event.target.value,
                                          }))
                                        }
                                      />

                                      <ActionButton
                                        disabled={busy || resources.length === 0}
                                        onClick={() => allocateResource(item.id)}
                                        color={COLORS.blue}
                                      >
                                        <Package size={13} />
                                        {busy ? 'Processing...' : 'Allocate resource'}
                                      </ActionButton>
                                    </div>
                                  )}

                                {isResponseTeam && status === 'ASSIGNED' && (
                                  <ActionButton
                                    disabled={busy}
                                    onClick={() =>
                                      updateReportStatus(item.id, 'IN_PROGRESS')
                                    }
                                    color="#0e7490"
                                  >
                                    <Activity size={13} /> Start mission
                                  </ActionButton>
                                )}

                                {isResponseTeam && status === 'IN_PROGRESS' && (
                                  <ActionButton
                                    disabled={busy}
                                    onClick={() =>
                                      updateReportStatus(item.id, 'RESOLVED')
                                    }
                                    color={COLORS.green}
                                  >
                                    <CheckCircle2 size={13} /> Resolve mission
                                  </ActionButton>
                                )}

                                {busy && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: COLORS.muted,
                                    }}
                                  >
                                    Processing request...
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}

                    {!loading && filteredReports.length === 0 && (
                      <tr>
                        <td
                          colSpan={isAdmin || isResponseTeam ? 6 : 5}
                          style={{
                            textAlign: 'center',
                            padding: 35,
                            color: COLORS.muted,
                          }}
                        >
                          <FileText
                            size={27}
                            style={{ display: 'block', margin: '0 auto 10px' }}
                          />
                          <strong>
                            {myReports.length === 0
                              ? 'No reports found'
                              : 'No reports match your filters'}
                          </strong>

                          {isCitizen && myReports.length === 0 && (
                            <div style={{ marginTop: 13 }}>
                              <ActionButton
                                onClick={() => {
                                  window.location.hash = '#/report-disaster'
                                }}
                                color="#fff"
                                background={COLORS.blue}
                              >
                                <Siren size={14} /> Submit an emergency report
                              </ActionButton>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}

                    {loading && (
                      <tr>
                        <td
                          colSpan={isAdmin || isResponseTeam ? 6 : 5}
                          style={{
                            textAlign: 'center',
                            padding: 30,
                            color: COLORS.muted,
                          }}
                        >
                          Loading emergency reports...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2 style={styles.sectionTitle}>
                    <MapPinned size={21} color={COLORS.blue} />
                    Live Emergency Map
                  </h2>
                  <p style={{ ...styles.muted, margin: '7px 0 0' }}>
                    Interactive OpenStreetMap with submitted report markers.
                  </p>
                </div>

                <span
                  style={{
                    background: '#eff6ff',
                    color: COLORS.blue,
                    borderRadius: 20,
                    padding: '8px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {reportsWithCoordinates.length} mapped
                </span>
              </div>

              <div
                style={{
                  height: 390,
                  width: '100%',
                  overflow: 'hidden',
                  borderRadius: 13,
                  border: `1px solid ${COLORS.border}`,
                  position: 'relative',
                  zIndex: 0,
                }}
              >
                <MapContainer
                  center={mapCenter}
                  zoom={11}
                  scrollWheelZoom
                  style={{
                    height: '100%',
                    width: '100%',
                    background: '#eaf1f5',
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapRecenter center={mapCenter} />
                  <MapSizeFix />

                  {reportsWithCoordinates.map((report) => (
                    <Marker
                      key={report.id}
                      position={report.coordinates}
                      icon={markerIcon}
                    >
                      <Popup>
                        <div style={{ minWidth: 175 }}>
                          <strong>
                            {formatStatus(report.disaster_type || 'Emergency')}
                          </strong>
                          <p style={{ margin: '6px 0' }}>
                            {report.location || 'Location unavailable'}
                          </p>
                          <p style={{ margin: '6px 0' }}>
                            Priority:{' '}
                            <strong
                              style={{
                                color: getSeverityColor(report.severity),
                              }}
                            >
                              {String(report.severity || 'MEDIUM').toUpperCase()}
                            </strong>
                          </p>
                          <p style={{ margin: '6px 0' }}>
                            Status: {formatStatus(report.status)}
                          </p>
                          <small>
                            {report.coordinates[0].toFixed(5)},{' '}
                            {report.coordinates[1].toFixed(5)}
                          </small>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {gps && (
                    <Marker
                      position={[gps.latitude, gps.longitude]}
                      icon={markerIcon}
                    >
                      <Popup>
                        <strong>Your current / selected location</strong>
                        <br />
                        {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 9,
                  flexWrap: 'wrap',
                  marginTop: 13,
                }}
              >
                <ActionButton onClick={getCurrentLocation} disabled={locating}>
                  <LocateFixed size={16} />
                  {locating ? 'Detecting location...' : 'Use My Current Location'}
                </ActionButton>

                <ActionButton
                  onClick={() => {
                    setGps(null)
                    setGpsMessage('')
                  }}
                >
                  <RefreshCw size={15} /> Show report map
                </ActionButton>
              </div>

              {gps && (
                <div
                  style={{
                    background: '#f0fdf4',
                    color: '#166534',
                    borderRadius: 10,
                    padding: 11,
                    fontSize: 12,
                    marginTop: 11,
                  }}
                >
                  <Navigation
                    size={14}
                    style={{ verticalAlign: 'middle', marginRight: 5 }}
                  />
                  Coordinates: {gps.latitude.toFixed(6)},{' '}
                  {gps.longitude.toFixed(6)}
                </div>
              )}

              {gpsMessage && (
                <p
                  role="status"
                  style={{
                    color: gpsMessage.includes('successfully')
                      ? COLORS.green
                      : COLORS.red,
                    fontSize: 12,
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  {gpsMessage}
                </p>
              )}

              <p
                style={{
                  color: COLORS.muted,
                  fontSize: 11,
                  lineHeight: 1.6,
                  marginBottom: 0,
                  marginTop: 12,
                }}
              >
                {reportsWithCoordinates.length} report(s) have valid GPS
                coordinates. Reports without latitude and longitude cannot
                appear as map markers.
              </p>
            </section>
          </div>

          <aside style={{ display: 'grid', gap: 20, minWidth: 0 }}>
            <section style={cardStyle}>
              <h2 style={{ ...styles.sectionTitle, marginBottom: 16 }}>
                <Users size={21} color={COLORS.blue} />
                Response Teams
              </h2>

              {teams.length === 0 && !loading && (
                <div style={styles.muted}>
                  No response teams were returned by the backend.
                </div>
              )}

              {teams.slice(0, 8).map((team, index) => {
                const teamStatus = String(
                  team.status || 'AVAILABLE',
                ).toUpperCase()

                const statusStyle =
                  teamStatusColors[teamStatus] || teamStatusColors.OFFLINE

                return (
                  <div
                    key={team.id ?? index}
                    style={{
                      padding: '13px 0',
                      borderTop: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 41,
                          height: 41,
                          borderRadius: 12,
                          background: '#eff6ff',
                          color: COLORS.blue,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Users size={19} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 750,
                            color: COLORS.navy,
                          }}
                        >
                          {team.team_name ||
                            team.name ||
                            `Response Team ${index + 1}`}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: COLORS.muted,
                            marginTop: 4,
                          }}
                        >
                          {team.type || team.team_type || 'Response unit'}
                        </div>
                      </div>

                      <span
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: 20,
                          padding: '6px 8px',
                          fontSize: 9,
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {teamStatus}
                      </span>
                    </div>

                    <div
                      style={{
                        margin: '10px 0 0 51px',
                        color: COLORS.muted,
                        fontSize: 10,
                        lineHeight: 1.8,
                      }}
                    >
                      <div>Leader: {team.leader || 'Not provided'}</div>
                      <div>Phone: {team.phone || 'Not provided'}</div>
                      <div>
                        Members: {team.member_count ?? 'Not provided'}
                      </div>
                      <div>Location: {team.location || 'Not provided'}</div>
                    </div>
                  </div>
                )
              })}
            </section>

            <section style={cardStyle}>
              <h2 style={{ ...styles.sectionTitle, marginBottom: 16 }}>
                <Package size={21} color={COLORS.blue} />
                Resource Inventory
              </h2>

              {resources.length === 0 && !loading && (
                <div style={styles.muted}>
                  No resource inventory was returned by the backend.
                </div>
              )}

              {resources.slice(0, 8).map((resource, index) => (
                <div
                  key={resource.id ?? index}
                  style={{
                    padding: '12px 0',
                    borderTop: `1px solid ${COLORS.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: COLORS.navy,
                        fontWeight: 750,
                        fontSize: 12,
                      }}
                    >
                      {resource.name ||
                        resource.resource_name ||
                        resource.type ||
                        `Resource ${index + 1}`}
                    </div>
                    <div
                      style={{
                        color: COLORS.muted,
                        fontSize: 10,
                        marginTop: 4,
                      }}
                    >
                      {resource.location ||
                        resource.category ||
                        'Emergency resource'}
                    </div>
                  </div>

                  <span
                    style={{
                      color: COLORS.blue,
                      background: '#eff6ff',
                      padding: '7px 9px',
                      borderRadius: 9,
                      fontSize: 11,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {resource.quantity ??
                      resource.available_quantity ??
                      resource.stock ??
                      '—'}
                  </span>
                </div>
              ))}
            </section>

            <section
              style={{
                ...cardStyle,
                background: '#eff6ff',
                borderColor: '#dbeafe',
              }}
            >
              <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <div style={{ color: COLORS.blue }}>
                  <Bell size={22} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: '0 0 7px',
                      fontSize: 15,
                      color: COLORS.navy,
                    }}
                  >
                    Stay Informed
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: COLORS.muted,
                      fontSize: 12,
                      lineHeight: 1.7,
                    }}
                  >
                    Check RESQ notifications for emergency report and response
                    updates.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = '#/notifications'
                    }}
                    style={{
                      ...styles.actionButton,
                      marginTop: 13,
                      color: COLORS.blue,
                      borderColor: '#bfdbfe',
                      background: '#fff',
                    }}
                  >
                    View Notifications <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </section>

            <section style={{ ...cardStyle, fontSize: 12 }}>
              <h3
                style={{
                  margin: '0 0 12px',
                  color: COLORS.navy,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Clock3 size={17} color={COLORS.blue} />
                System Overview
              </h3>

              {[
                ['Reports with GPS', reportsWithCoordinates.length],
                ['Response teams', teams.length],
                ['Available teams', teamStats.available],
                ['Resources listed', resources.length],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '9px 0',
                    borderTop: `1px solid ${COLORS.border}`,
                  }}
                >
                  <span style={{ color: COLORS.muted }}>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}

              <ActionButton onClick={refresh} disabled={refreshing}>
                <RefreshCw size={14} /> Refresh dashboard data
              </ActionButton>
            </section>
          </aside>
        </section>

        <footer
          style={{
            textAlign: 'center',
            color: COLORS.muted,
            fontSize: 11,
            padding: '30px 10px 10px',
          }}
        >
          RESQ · Smart Disaster Response System · Stay alert, stay safe.
        </footer>
      </main>
    </div>
  )
}

export default Dashboard