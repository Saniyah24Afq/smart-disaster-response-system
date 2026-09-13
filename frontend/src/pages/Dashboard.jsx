import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Droplets,
  HeartPulse,
  Package,
  ShieldCheck,
  Truck,
  Users,
  Waves,
  XCircle,
  RefreshCw,
  UserCheck,
  MapPin,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import './Dashboard.css'
import MapView from './MapView'

const API_URL = 'http://localhost:5000'

function Dashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    total_disasters: 0,
    active_emergencies: 0,
    resolved_disasters: 0,
    critical_incidents: 0,
    total_resources: 0,
    available_resource_quantity: 0,
    available_teams: 0,
    busy_teams: 0,
    offline_teams: 0,
  })

  const [disasters, setDisasters] = useState([])
  const [teams, setTeams] = useState([])

  const [loading, setLoading] = useState(true)
  const [incidentsLoading, setIncidentsLoading] = useState(true)
  const [teamsLoading, setTeamsLoading] = useState(false)

  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  // Team assignment modal
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [selectedDisaster, setSelectedDisaster] = useState(null)
  const [selectedTeamId, setSelectedTeamId] = useState('')

  const storedUser = localStorage.getItem('resq_user')

  let currentUser = null

  try {
    currentUser = storedUser ? JSON.parse(storedUser) : null
  } catch {
    currentUser = null
  }

  const userName = currentUser?.name || 'Admin User'
  const isAdmin = currentUser?.role === 'ADMIN'

  // ==============================
  // FETCH DASHBOARD STATS
  // ==============================

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('resq_token')

      if (!token) {
        setError('Login session not found.')
        return
      }

      const response = await fetch(
        `${API_URL}/api/dashboard/stats`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to fetch dashboard data'
        )
      }

      setStats(data.stats)
      setError('')
    } catch (err) {
      console.error('Dashboard API error:', err)
      setError('Unable to load live dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // FETCH DISASTERS
  // ==============================

  const fetchDisasters = async () => {
    try {
      setIncidentsLoading(true)

      const token = localStorage.getItem('resq_token')

      if (!token) return

      const response = await fetch(
        `${API_URL}/api/disasters`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to fetch disasters'
        )
      }

      setDisasters(data.disasters || [])
    } catch (err) {
      console.error('Disaster API error:', err)
    } finally {
      setIncidentsLoading(false)
    }
  }

  // ==============================
  // FETCH RESPONSE TEAMS
  // ==============================

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true)

      const token = localStorage.getItem('resq_token')

      if (!token) return

      const response = await fetch(
        `${API_URL}/api/teams`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to fetch response teams'
        )
      }

      setTeams(data.teams || [])
    } catch (err) {
      console.error('Teams API error:', err)
      alert(err.message || 'Unable to load response teams.')
    } finally {
      setTeamsLoading(false)
    }
  }

  // ==============================
  // INITIAL LOAD
  // ==============================

  useEffect(() => {
    fetchDashboardStats()
    fetchDisasters()
    fetchTeams()
  }, [])

  // ==============================
  // UPDATE DISASTER STATUS
  // ==============================

  const updateIncidentStatus = async (id, status) => {
    try {
      setActionLoading(`${id}-${status}`)

      const token = localStorage.getItem('resq_token')

      const response = await fetch(
        `${API_URL}/api/disasters/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to update incident'
        )
      }

      await fetchDisasters()
      await fetchDashboardStats()
    } catch (err) {
      console.error('Status update error:', err)
      alert(err.message || 'Unable to update incident.')
    } finally {
      setActionLoading(null)
    }
  }

  // ==============================
  // OPEN TEAM ASSIGNMENT MODAL
  // ==============================

  const openAssignTeamModal = async (disaster) => {
    setSelectedDisaster(disaster)
    setSelectedTeamId('')
    setShowTeamModal(true)

    // Refresh teams before showing them
    await fetchTeams()
  }

  // ==============================
  // ACTUAL TEAM ASSIGNMENT
  // ==============================

  const assignTeam = async () => {
    if (!selectedDisaster) {
      alert('No disaster selected.')
      return
    }

    if (!selectedTeamId) {
      alert('Please select a response team.')
      return
    }

    try {
      setActionLoading(
        `${selectedDisaster.id}-ASSIGN_TEAM`
      )

      const token = localStorage.getItem('resq_token')

      const response = await fetch(
        `${API_URL}/api/assignments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            disaster_id: selectedDisaster.id,
            team_id: Number(selectedTeamId),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to assign response team'
        )
      }

      alert(
        `✅ ${data.message || 'Response team assigned successfully!'}`
      )

      setShowTeamModal(false)
      setSelectedDisaster(null)
      setSelectedTeamId('')

      // Refresh everything
      await fetchDisasters()
      await fetchDashboardStats()
      await fetchTeams()
    } catch (err) {
      console.error('Team assignment error:', err)

      alert(
        err.message ||
          'Unable to assign response team.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const formatNumber = (number) => {
    return Number(number || 0).toLocaleString('en-IN')
  }

  const activeEmergencies = stats.active_emergencies

  const pendingReports = disasters.filter(
    (item) =>
      String(item.status || '').toUpperCase() === 'REPORTED'
  ).length

  const resolvedToday = stats.resolved_disasters

  const resourcesAvailable =
    stats.available_resource_quantity

  const totalTeams =
    stats.available_teams +
    stats.busy_teams +
    stats.offline_teams

  const teamAvailability =
    totalTeams > 0
      ? Math.round(
          (stats.available_teams / totalTeams) * 100
        )
      : 0

  const availableTeams = teams.filter(
    (team) =>
      String(team.status || '').toUpperCase() ===
      'AVAILABLE'
  )

  const getSeverityClass = (severity) => {
    return String(severity || 'MEDIUM').toLowerCase()
  }

  const getIncidentIcon = (type) => {
    const disasterType = String(type || '').toUpperCase()

    if (disasterType.includes('FLOOD')) {
      return <Waves size={20} />
    }

    if (
      disasterType.includes('FIRE') ||
      disasterType.includes('EARTHQUAKE')
    ) {
      return <AlertTriangle size={20} />
    }

    return <HeartPulse size={20} />
  }

  return (
    <div className="dashboard-page">

      {/* =========================
          TOP NAVBAR
      ========================= */}

      <header className="dashboard-navbar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <strong>RESQ</strong>
            <span>SMART RESPONSE</span>
          </div>
        </div>

        <div className="dashboard-nav-right">
          <div className="system-status">
            <span></span>
            All Systems Operational
          </div>

          <button
            type="button"
            className="dashboard-notification"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => navigate('/notifications')}
          >
            <Bell size={19} />
            <i></i>
          </button>

          <div className="user-profile">
            <div className="profile-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="profile-info">
              <strong>{userName}</strong>

              <span>
                {isAdmin
                  ? 'Administrator'
                  : 'Response User'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="dashboard-content">

        {/* WELCOME */}

        <section className="dashboard-heading">
          <div>
            <span className="dashboard-eyebrow">
              <span className="live-dot"></span>
              LIVE RESPONSE CENTER
            </span>

            <h1>
              Good morning, {userName.split(' ')[0]} 👋
            </h1>

            <p>
              Monitor emergencies, coordinate response teams
              and manage critical resources from one place.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!isAdmin && (
              <button
                type="button"
                className="emergency-action"
                onClick={() => navigate('/report-disaster')}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                }}
              >
                <AlertTriangle size={18} />
                Report Disaster
              </button>
            )}

            <button
              type="button"
              className="emergency-action"
              onClick={() => {
                fetchDisasters()
                fetchDashboardStats()
                fetchTeams()
              }}
            >
              <RefreshCw size={18} />
              Refresh Center
            </button>
          </div>
        </section>

        {/* API ERROR */}

        {error && (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px 18px',
              borderRadius: '14px',
              background: '#fff4f2',
              border: '1px solid #ffd2cc',
              color: '#c0392b',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* =========================
            STAT CARDS
        ========================= */}

        <section className="dashboard-stats">

          <div className="dash-stat-card danger-card">
            <div className="stat-card-top">
              <div className="dash-stat-icon danger">
                <AlertTriangle size={22} />
              </div>

              <span className="trend negative">
                LIVE
              </span>
            </div>

            <span className="stat-title">
              Active Emergencies
            </span>

            <strong className="stat-number">
              {loading
                ? '—'
                : formatNumber(activeEmergencies)}
            </strong>

            <small>
              Requires immediate attention
            </small>
          </div>

          <div className="dash-stat-card blue-card">
            <div className="stat-card-top">
              <div className="dash-stat-icon blue">
                <Clock3 size={22} />
              </div>

              <span className="trend positive">
                LIVE
              </span>
            </div>

            <span className="stat-title">
              Pending Reports
            </span>

            <strong className="stat-number">
              {incidentsLoading
                ? '—'
                : formatNumber(pendingReports)}
            </strong>

            <small>
              Waiting for verification
            </small>
          </div>

          <div className="dash-stat-card green-card">
            <div className="stat-card-top">
              <div className="dash-stat-icon green">
                <CheckCircle2 size={22} />
              </div>

              <span className="trend positive">
                LIVE
              </span>
            </div>

            <span className="stat-title">
              Resolved Today
            </span>

            <strong className="stat-number">
              {loading
                ? '—'
                : formatNumber(resolvedToday)}
            </strong>

            <small>
              Successfully completed
            </small>
          </div>

          <div className="dash-stat-card orange-card">
            <div className="stat-card-top">
              <div className="dash-stat-icon orange">
                <Package size={22} />
              </div>

              <span className="trend positive">
                LIVE
              </span>
            </div>

            <span className="stat-title">
              Resources Available
            </span>

            <strong className="stat-number">
              {loading
                ? '—'
                : formatNumber(resourcesAvailable)}
            </strong>

            <small>
              Units currently available
            </small>
          </div>

        </section>

        {/* =========================
            ADMIN VERIFICATION CENTER
        ========================= */}

        {isAdmin && (
          <section
            className="dashboard-panel"
            style={{
              marginBottom: '28px',
              overflow: 'hidden',
            }}
          >
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  ADMIN CONTROL CENTER
                </span>

                <h2>
                  Disaster Verification
                </h2>
              </div>

              <button
                type="button"
                className="view-all"
                onClick={() => {
                  fetchDisasters()
                  fetchDashboardStats()
                  fetchTeams()
                }}
              >
                Refresh
                <RefreshCw size={16} />
              </button>
            </div>

            {incidentsLoading ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                Loading reported incidents...
              </div>
            ) : disasters.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                <CheckCircle2
                  size={38}
                  style={{ marginBottom: '10px' }}
                />

                <h3 style={{ margin: '0 0 6px' }}>
                  No disaster reports
                </h3>

                <p style={{ margin: 0 }}>
                  New citizen reports will appear here.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  padding: '0 4px 20px',
                }}
              >
                {disasters.map((disaster) => {
                  const severity =
                    String(
                      disaster.severity || 'MEDIUM'
                    ).toUpperCase()

                  const status =
                    String(
                      disaster.status || 'REPORTED'
                    ).toUpperCase()

                  return (
                    <div
                      key={disaster.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '52px minmax(0, 1fr) auto',
                        gap: '16px',
                        alignItems: 'center',
                        padding: '18px',
                        borderRadius: '18px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >

                      {/* ICON */}

                      <div
                        className={`incident-type ${getSeverityClass(
                          severity
                        )}`}
                        style={{
                          width: '52px',
                          height: '52px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '15px',
                        }}
                      >
                        {getIncidentIcon(
                          disaster.disaster_type
                        )}
                      </div>

                      {/* DETAILS */}

                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            flexWrap: 'wrap',
                            marginBottom: '6px',
                          }}
                        >
                          <strong
                            style={{
                              fontSize: '16px',
                              color: '#172033',
                            }}
                          >
                            {disaster.disaster_type}
                          </strong>

                          <span
                            className={`priority ${getSeverityClass(
                              severity
                            )}`}
                          >
                            {severity}
                          </span>

                          <span
                            style={{
                              padding: '4px 9px',
                              borderRadius: '999px',
                              background:
                                status === 'RESOLVED'
                                  ? '#dcfce7'
                                  : status === 'ASSIGNED'
                                  ? '#dcfce7'
                                  : status === 'REJECTED'
                                  ? '#fee2e2'
                                  : '#e0f2fe',
                              color:
                                status === 'RESOLVED'
                                  ? '#15803d'
                                  : status === 'ASSIGNED'
                                  ? '#15803d'
                                  : status === 'REJECTED'
                                  ? '#dc2626'
                                  : '#0369a1',
                              fontSize: '11px',
                              fontWeight: 800,
                            }}
                          >
                            {status}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: '0 0 5px',
                            color: '#475569',
                            fontSize: '14px',
                          }}
                        >
                          📍 {disaster.location}
                        </p>

                        <small
                          style={{
                            color: '#64748b',
                            display: 'block',
                          }}
                        >
                          {disaster.description ||
                            'No description provided.'}
                        </small>

                        {disaster.name && (
                          <small
                            style={{
                              display: 'block',
                              marginTop: '6px',
                              color: '#94a3b8',
                            }}
                          >
                            Reported by: {disaster.name}
                          </small>
                        )}
                      </div>

                      {/* ACTIONS */}

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          justifyContent: 'flex-end',
                        }}
                      >

                        {/* VERIFY / REJECT */}

                        {status === 'REPORTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateIncidentStatus(
                                  disaster.id,
                                  'VERIFIED'
                                )
                              }
                              disabled={
                                actionLoading !== null
                              }
                              style={{
                                border: 'none',
                                borderRadius: '11px',
                                padding: '10px 14px',
                                background: '#16a34a',
                                color: 'white',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <CheckCircle2
                                size={15}
                                style={{
                                  verticalAlign: 'middle',
                                  marginRight: '5px',
                                }}
                              />

                              {actionLoading ===
                              `${disaster.id}-VERIFIED`
                                ? 'Verifying...'
                                : 'Verify'}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateIncidentStatus(
                                  disaster.id,
                                  'REJECTED'
                                )
                              }
                              disabled={
                                actionLoading !== null
                              }
                              style={{
                                border: '1px solid #fecaca',
                                borderRadius: '11px',
                                padding: '10px 14px',
                                background: '#fff1f2',
                                color: '#dc2626',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <XCircle
                                size={15}
                                style={{
                                  verticalAlign: 'middle',
                                  marginRight: '5px',
                                }}
                              />

                              Reject
                            </button>
                          </>
                        )}

                        {/* REAL ASSIGN TEAM */}

                        {status === 'VERIFIED' && (
                          <button
                            type="button"
                            onClick={() =>
                              openAssignTeamModal(disaster)
                            }
                            disabled={
                              actionLoading !== null
                            }
                            style={{
                              border: 'none',
                              borderRadius: '11px',
                              padding: '10px 14px',
                              background: '#2563eb',
                              color: 'white',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <UserCheck size={16} />

                            Assign Team

                            <ChevronRight size={15} />
                          </button>
                        )}

                        {/* ALREADY ASSIGNED */}

                        {status === 'ASSIGNED' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              padding: '10px 14px',
                              borderRadius: '11px',
                              background: '#dcfce7',
                              color: '#15803d',
                              fontWeight: 800,
                              fontSize: '13px',
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Team Assigned
                          </div>
                        )}

                        {/* RESOLVED */}

                        {status === 'RESOLVED' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              padding: '10px 14px',
                              borderRadius: '11px',
                              background: '#dcfce7',
                              color: '#15803d',
                              fontWeight: 800,
                              fontSize: '13px',
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Resolved
                          </div>
                        )}

                        {/* REJECTED */}

                        {status === 'REJECTED' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              padding: '10px 14px',
                              borderRadius: '11px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              fontWeight: 800,
                              fontSize: '13px',
                            }}
                          >
                            <XCircle size={16} />
                            Rejected
                          </div>
                        )}

                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* =========================
            MAIN GRID
        ========================= */}

        <section className="dashboard-main-grid">

          {/* INCIDENTS */}

          <div className="dashboard-panel incidents-panel">

            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  PRIORITY INCIDENTS
                </span>

                <h2>Active Emergencies</h2>
              </div>

              <button
                type="button"
                className="view-all"
                onClick={fetchDisasters}
              >
                Refresh
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="incident-list">

              {disasters
                .filter(
                  (item) =>
                    String(item.status || '').toUpperCase() !==
                      'RESOLVED' &&
                    String(item.status || '').toUpperCase() !==
                      'REJECTED'
                )
                .slice(0, 5)
                .map((disaster) => (
                  <div
                    className="incident-row"
                    key={disaster.id}
                  >
                    <div
                      className={`incident-type ${getSeverityClass(
                        disaster.severity
                      )}`}
                    >
                      {getIncidentIcon(
                        disaster.disaster_type
                      )}
                    </div>

                    <div className="incident-details">
                      <div className="incident-title">
                        <strong>
                          {disaster.disaster_type}
                        </strong>

                        <span
                          className={`priority ${getSeverityClass(
                            disaster.severity
                          )}`}
                        >
                          {disaster.severity}
                        </span>
                      </div>

                      <p>
                        📍 {disaster.location}
                      </p>

                      <small>
                        {disaster.description ||
                          'Response monitoring active'}
                      </small>
                    </div>

                    <div className="incident-status">
                      <span>
                        {disaster.status}
                      </span>

                      <strong>
                        {disaster.name ||
                          'Reported citizen'}
                      </strong>
                    </div>
                  </div>
                ))}

              {!incidentsLoading &&
                disasters.filter(
                  (item) =>
                    String(item.status || '').toUpperCase() !==
                      'RESOLVED' &&
                    String(item.status || '').toUpperCase() !==
                      'REJECTED'
                ).length === 0 && (
                  <div
                    style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#64748b',
                    }}
                  >
                    No active incidents right now.
                  </div>
                )}
            </div>
          </div>

          {/* =========================
              RESPONSE TEAMS
          ========================= */}

          <div className="dashboard-panel teams-panel">

            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  FIELD OPERATIONS
                </span>

                <h2>Response Teams</h2>
              </div>

              <button
                type="button"
                className="view-all"
                onClick={fetchTeams}
              >
                Refresh
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="team-summary">
              <div className="team-summary-icon">
                <Users size={24} />
              </div>

              <div>
                <strong>
                  {loading
                    ? '—'
                    : formatNumber(totalTeams)}
                </strong>

                <span>
                  Teams deployed & available
                </span>
              </div>
            </div>

            <div className="team-progress">
              <div className="progress-label">
                <span>Team availability</span>

                <strong>
                  {loading
                    ? '—'
                    : `${teamAvailability}%`}
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${teamAvailability}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="team-list">

              <div className="team-row">
                <div className="team-avatar">
                  A
                </div>

                <div>
                  <strong>
                    Available Teams
                  </strong>

                  <span>
                    Ready for deployment
                  </span>
                </div>

                <b className="available">
                  {loading
                    ? '—'
                    : stats.available_teams}
                </b>
              </div>

              <div className="team-row">
                <div className="team-avatar">
                  B
                </div>

                <div>
                  <strong>
                    Teams on Mission
                  </strong>

                  <span>
                    Currently deployed
                  </span>
                </div>

                <b className="busy">
                  {loading
                    ? '—'
                    : stats.busy_teams}
                </b>
              </div>

              <div className="team-row">
                <div className="team-avatar">
                  C
                </div>

                <div>
                  <strong>
                    Offline Teams
                  </strong>

                  <span>
                    Currently unavailable
                  </span>
                </div>

                <b className="busy">
                  {loading
                    ? '—'
                    : stats.offline_teams}
                </b>
              </div>

            </div>

            {/* TEAM LIST FROM DATABASE */}

            {teams.length > 0 && (
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '18px',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#64748b',
                    marginBottom: '12px',
                    letterSpacing: '0.08em',
                  }}
                >
                  REGISTERED TEAMS
                </div>

                {teams.slice(0, 3).map((team) => (
                  <div
                    key={team.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 0',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background:
                          String(team.status).toUpperCase() ===
                          'AVAILABLE'
                            ? '#dcfce7'
                            : '#fee2e2',
                        color:
                          String(team.status).toUpperCase() ===
                          'AVAILABLE'
                            ? '#15803d'
                            : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Users size={17} />
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          color: '#172033',
                        }}
                      >
                        {team.team_name}
                      </strong>

                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                        }}
                      >
                        {team.type}
                      </span>
                    </div>

                    <b
                      style={{
                        fontSize: '10px',
                        color:
                          String(team.status).toUpperCase() ===
                          'AVAILABLE'
                            ? '#15803d'
                            : '#dc2626',
                      }}
                    >
                      {team.status}
                    </b>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* =========================
            RESOURCE OVERVIEW
        ========================= */}

        <section className="dashboard-bottom-grid">

          <div className="dashboard-panel resource-panel">

            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  RESOURCE MANAGEMENT
                </span>

                <h2>Critical Resources</h2>
              </div>

              <button
                type="button"
                className="view-all"
              >
                View inventory
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="resource-grid">

              <div className="resource-card">
                <div className="resource-icon water">
                  <Droplets size={20} />
                </div>

                <div>
                  <strong>
                    {loading
                      ? '—'
                      : formatNumber(
                          resourcesAvailable
                        )}
                  </strong>

                  <span>
                    Total Available Units
                  </span>
                </div>

                <small className="resource-good">
                  Live
                </small>
              </div>

              <div className="resource-card">
                <div className="resource-icon medical-resource">
                  <HeartPulse size={20} />
                </div>

                <div>
                  <strong>
                    {loading
                      ? '—'
                      : formatNumber(
                          stats.total_resources
                        )}
                  </strong>

                  <span>
                    Resource Types
                  </span>
                </div>

                <small className="resource-warning">
                  Tracked
                </small>
              </div>

              <div className="resource-card">
                <div className="resource-icon vehicle">
                  <Truck size={20} />
                </div>

                <div>
                  <strong>
                    {loading
                      ? '—'
                      : formatNumber(
                          stats.available_teams
                        )}
                  </strong>

                  <span>
                    Teams Available
                  </span>
                </div>

                <small className="resource-good">
                  Ready
                </small>
              </div>

              <div className="resource-card">
                <div className="resource-icon shelter">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <strong>
                    {loading
                      ? '—'
                      : formatNumber(
                          stats.critical_incidents
                        )}
                  </strong>

                  <span>
                    Critical Incidents
                  </span>
                </div>

                <small className="resource-warning">
                  Monitor
                </small>
              </div>

            </div>
          </div>

        </section>

        {/* =========================
            REAL MAP
        ========================= */}

        <section className="dashboard-real-map-section">
          <MapView />
        </section>

        {/* =========================
            FOOTER STATUS
        ========================= */}

        <div className="dashboard-footer-status">
          <div>
            <span className="footer-live-dot"></span>
            RESQ Network Online
          </div>

          <span>
            {loading
              ? 'Updating dashboard...'
              : 'Last updated: Just now'}
          </span>

          <span>
            Response monitoring active 24/7
          </span>
        </div>

      </main>

      {/* ==================================================
          TEAM ASSIGNMENT MODAL
      ================================================== */}

      {showTeamModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.58)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowTeamModal(false)
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'white',
              borderRadius: '24px',
              padding: '28px',
              boxShadow:
                '0 25px 70px rgba(15, 23, 42, 0.28)',
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '15px',
                marginBottom: '24px',
              }}
            >
              <div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <UserCheck size={24} />
                </div>

                <h2
                  style={{
                    margin: 0,
                    color: '#172033',
                    fontSize: '22px',
                  }}
                >
                  Assign Response Team
                </h2>

                <p
                  style={{
                    margin: '7px 0 0',
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  Select an available team for this emergency.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowTeamModal(false)
                }
                style={{
                  width: '36px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {/* DISASTER INFO */}

            {selectedDisaster && (
              <div
                style={{
                  padding: '15px',
                  borderRadius: '15px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '7px',
                  }}
                >
                  <AlertTriangle
                    size={18}
                    color="#ea580c"
                  />

                  <strong
                    style={{
                      color: '#172033',
                    }}
                  >
                    {selectedDisaster.disaster_type}
                  </strong>

                  <span
                    className={`priority ${getSeverityClass(
                      selectedDisaster.severity
                    )}`}
                  >
                    {selectedDisaster.severity}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  <MapPin size={14} />

                  {selectedDisaster.location}
                </div>
              </div>
            )}

            {/* TEAM SELECT */}

            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#334155',
              }}
            >
              Available Response Team
            </label>

            {teamsLoading ? (
              <div
                style={{
                  padding: '18px',
                  borderRadius: '13px',
                  background: '#f8fafc',
                  color: '#64748b',
                  textAlign: 'center',
                }}
              >
                Loading available teams...
              </div>
            ) : availableTeams.length === 0 ? (
              <div
                style={{
                  padding: '18px',
                  borderRadius: '13px',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  color: '#c2410c',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                ⚠️ No response team is currently available.
              </div>
            ) : (
              <select
                value={selectedTeamId}
                onChange={(event) =>
                  setSelectedTeamId(event.target.value)
                }
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: '13px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#172033',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">
                  Select a response team...
                </option>

                {availableTeams.map((team) => (
                  <option
                    key={team.id}
                    value={team.id}
                  >
                    {team.team_name} — {team.type} —{' '}
                    {team.member_count} members
                  </option>
                ))}
              </select>
            )}

            {/* SELECTED TEAM PREVIEW */}

            {selectedTeamId && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '14px',
                  borderRadius: '13px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '13px',
                }}
              >
                <strong>
                  ✓ Team ready for assignment
                </strong>

                <div style={{ marginTop: '4px' }}>
                  {
                    availableTeams.find(
                      (team) =>
                        String(team.id) ===
                        String(selectedTeamId)
                    )?.team_name
                  }
                </div>
              </div>
            )}

            {/* MODAL BUTTONS */}

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '24px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowTeamModal(false)
                  setSelectedDisaster(null)
                  setSelectedTeamId('')
                }}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '13px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={assignTeam}
                disabled={
                  !selectedTeamId ||
                  actionLoading !== null ||
                  availableTeams.length === 0
                }
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '13px',
                  border: 'none',
                  background:
                    !selectedTeamId ||
                    actionLoading !== null
                      ? '#94a3b8'
                      : '#2563eb',
                  color: 'white',
                  fontWeight: 800,
                  cursor:
                    !selectedTeamId ||
                    actionLoading !== null
                      ? 'not-allowed'
                      : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                }}
              >
                <UserCheck size={17} />

                {actionLoading ===
                `${selectedDisaster?.id}-ASSIGN_TEAM`
                  ? 'Assigning...'
                  : 'Confirm Assignment'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard