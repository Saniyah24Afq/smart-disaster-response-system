import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  AlertTriangle,
  Users,
  Package,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Check,
  BellRing,
} from "lucide-react";
import "./Notifications.css";

const API_URL = "http://localhost:5000";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("resq_token");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setNotifications(
          Array.isArray(data)
            ? data
            : data.notifications || []
        );
      } else {
        console.error(
          data.message || "Failed to load notifications"
        );
      }
    } catch (error) {
      console.error(
        "Notification fetch error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (notification) => {
    const type = String(
      notification.type ||
        notification.notification_type ||
        ""
    ).toUpperCase();

    if (
      type.includes("DISASTER") ||
      type.includes("ALERT") ||
      type.includes("EMERGENCY")
    ) {
      return <AlertTriangle size={21} />;
    }

    if (
      type.includes("TEAM") ||
      type.includes("ASSIGN")
    ) {
      return <Users size={21} />;
    }

    if (
      type.includes("RESOURCE") ||
      type.includes("ALLOC")
    ) {
      return <Package size={21} />;
    }

    if (
      type.includes("RESOLVED") ||
      type.includes("SUCCESS")
    ) {
      return <CheckCircle2 size={21} />;
    }

    return <Bell size={21} />;
  };

  const getNotificationClass = (notification) => {
    const type = String(
      notification.type ||
        notification.notification_type ||
        ""
    ).toUpperCase();

    if (
      type.includes("DISASTER") ||
      type.includes("ALERT") ||
      type.includes("EMERGENCY")
    ) {
      return "danger";
    }

    if (
      type.includes("TEAM") ||
      type.includes("ASSIGN")
    ) {
      return "blue";
    }

    if (
      type.includes("RESOURCE") ||
      type.includes("ALLOC")
    ) {
      return "orange";
    }

    if (
      type.includes("RESOLVED") ||
      type.includes("SUCCESS")
    ) {
      return "green";
    }

    return "default";
  };

  const getNotificationTitle = (notification) => {
    return (
      notification.title ||
      notification.subject ||
      notification.type ||
      "RESQ Notification"
    );
  };

  const getNotificationMessage = (notification) => {
    return (
      notification.message ||
      notification.description ||
      "You have a new RESQ system notification."
    );
  };

  const getNotificationTime = (notification) => {
    const date =
      notification.created_at ||
      notification.timestamp ||
      notification.date;

    if (!date) {
      return "Recently";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Recently";
    }

    return parsedDate.toLocaleString();
  };

  const unreadCount = notifications.filter(
    (notification) =>
      notification.is_read === false ||
      notification.read === false ||
      notification.status === "UNREAD"
  ).length;

  return (
    <div className="notifications-page">
      <div className="notifications-background"></div>

      <div className="notifications-container">

        {/* HEADER */}

        <div className="notifications-header">

          <div className="notifications-title-row">

            <div className="notifications-title-icon">
              <BellRing size={27} />
            </div>

            <div>
              <span className="notifications-eyebrow">
                RESQ COMMUNICATION CENTER
              </span>

              <h1>Notifications</h1>

              <p>
                Stay updated with emergency response
                activities and system alerts.
              </p>
            </div>

          </div>

          <button
            className="notifications-refresh-btn"
            onClick={fetchNotifications}
            type="button"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

        </div>

        {/* SUMMARY */}

        <div className="notifications-summary">

          <div className="notification-summary-card">

            <div className="summary-icon blue">
              <Bell size={21} />
            </div>

            <div>
              <span>Total Notifications</span>
              <strong>{notifications.length}</strong>
            </div>

          </div>

          <div className="notification-summary-card">

            <div className="summary-icon red">
              <BellRing size={21} />
            </div>

            <div>
              <span>Unread Alerts</span>
              <strong>{unreadCount}</strong>
            </div>

          </div>

          <div className="notification-summary-card">

            <div className="summary-icon green">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>System Status</span>
              <strong>Active</strong>
            </div>

          </div>

        </div>

        {/* NOTIFICATION PANEL */}

        <section className="notifications-card">

          <div className="notifications-card-header">

            <div>
              <span>LIVE ACTIVITY</span>

              <h2>Recent Notifications</h2>

              <p>
                Important updates from the RESQ
                response system.
              </p>
            </div>

            <div className="live-status">
              <span></span>
              Live
            </div>

          </div>

          {loading ? (
            <div className="notifications-loading">

              <RefreshCw
                className="spin"
                size={28}
              />

              <span>
                Loading notifications...
              </span>

            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">

              <div className="empty-icon">
                <Bell size={38} />
              </div>

              <h3>No notifications yet</h3>

              <p>
                Emergency alerts and response
                updates will appear here.
              </p>

            </div>
          ) : (
            <div className="notifications-list">

              {notifications.map(
                (notification, index) => {

                  const typeClass =
                    getNotificationClass(
                      notification
                    );

                  return (
                    <div
                      className={`notification-item ${typeClass}`}
                      key={
                        notification.id ||
                        `notification-${index}`
                      }
                    >

                      <div
                        className={`notification-icon ${typeClass}`}
                      >
                        {getNotificationIcon(
                          notification
                        )}
                      </div>

                      <div className="notification-content">

                        <div className="notification-top">

                          <h3>
                            {getNotificationTitle(
                              notification
                            )}
                          </h3>

                          <span className="notification-time">
                            <Clock3 size={13} />

                            {getNotificationTime(
                              notification
                            )}
                          </span>

                        </div>

                        <p>
                          {getNotificationMessage(
                            notification
                          )}
                        </p>

                        <div className="notification-footer">

                          <span
                            className={`notification-type ${typeClass}`}
                          >
                            {String(
                              notification.type ||
                                notification.notification_type ||
                                "SYSTEM"
                            ).replace(
                              /_/g,
                              " "
                            )}
                          </span>

                          <span className="notification-read">
                            <Check size={13} />
                            Recorded
                          </span>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>

    </div>
  );
}

export default Notifications;