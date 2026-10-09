
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8001";

type CulturalRecord = {
  id: number;
  name: string;
  category: string;
  region: string;
};

const services = [
  { name: "FastAPI Backend", detail: "Application API", mark: "API", tone: "blue" },
  { name: "DuckDB", detail: "Analytics database", mark: "D", tone: "amber" },
  { name: "LanceDB", detail: "Vector database", mark: "L", tone: "violet" },
  { name: "SQLite", detail: "Local metadata", mark: "S", tone: "green" },
  { name: "Ollama", detail: "Local AI runtime", mark: "O", tone: "coral" },
];

const activity = [
  { time: "Now", title: "Backend connection check", detail: "Live status is checked from FastAPI", type: "System" },
  { time: "Local", title: "Cultural records loaded", detail: "Records retrieved from the backend API", type: "Database" },
];

function App() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [records, setRecords] = useState<CulturalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboardData() {
    setLoading(true);
    setError("");

    try {
      const healthResponse = await fetch(`${API_URL}/health`);

      if (!healthResponse.ok) {
        throw new Error("Backend health check failed.");
      }

      const healthData = await healthResponse.json();

      if (healthData.status !== "ok") {
        throw new Error("Backend is not healthy.");
      }

      setBackendConnected(true);

      const recordsResponse = await fetch(`${API_URL}/api/cultural-records`);

      if (!recordsResponse.ok) {
        throw new Error("Could not load cultural records.");
      }

      const recordsData: CulturalRecord[] = await recordsResponse.json();
      setRecords(recordsData);
    } catch {
      setBackendConnected(false);
      setError(
        "Unable to connect to the backend. Check that FastAPI is running on port 8001."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const connectedCount = Number(backendConnected) + Number(backendConnected);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Cultural Analytics home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="brand-copy">
            <strong>CultureScope</strong>
            <small>LOCAL ANALYTICS</small>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          <a className="nav-link active" href="#overview">
            <span className="nav-icon" aria-hidden="true">⌂</span>
            Overview
          </a>
          <a className="nav-link" href="#services">
            <span className="nav-icon" aria-hidden="true">◈</span>
            Services
          </a>
          <a className="nav-link" href="#records">
            <span className="nav-icon" aria-hidden="true">▤</span>
            Cultural records
          </a>
          <a className="nav-link" href="#activity">
            <span className="nav-icon" aria-hidden="true">◷</span>
            Activity
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="phase-card">
            <span className="phase-indicator" />
            <div>
              <strong>Phase 2 PoC</strong>
              <span>Local environment</span>
            </div>
          </div>
          <span className="sidebar-version">CULTURESCOPE · 0.2.0</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> Overview</div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span />
              {backendConnected ? "LOCAL BACKEND CONNECTED" : "LOCAL ENVIRONMENT"}
            </span>
            <div className="avatar" aria-label="Local workspace">L</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading" id="overview">
            <div>
              <p className="eyebrow">LOCAL-FIRST CULTURAL INSIGHTS</p>
              <h1>
                Local AI Cultural Analytics Dashboard{" "}
                <span className="title-suffix">- Phase 2 PoC</span>
              </h1>
              <p className="page-description">
                Monitor your local services and explore records stored in your analytics database.
              </p>
            </div>
            <button type="button" onClick={() => void loadDashboardData()}>
              ↻ Refresh data
            </button>
          </section>

          <section className="section-block" aria-labelledby="services-title" id="services">
            <div className="section-heading">
              <div>
                <h2 id="services-title">Service status</h2>
                <p>Local components configured for this proof of concept</p>
              </div>
              <span className="status-summary">
                <span /> {connectedCount} of 5 connected
              </span>
            </div>

            <div className="service-grid">
              {services.map((service) => {
                const isConnected =
                  backendConnected &&
                  (service.name === "FastAPI Backend" || service.name === "DuckDB");

                return (
                  <article className="service-card" key={service.name}>
                    <div className={`service-mark ${service.tone}`} aria-hidden="true">
                      {service.mark}
                    </div>
                    <div className="service-details">
                      <h3>{service.name}</h3>
                      <p>{service.detail}</p>
                    </div>
                    <div className="connection-status">
                      <span className="status-dot" />
                      <span>
                        {loading && service.name === "FastAPI Backend"
                          ? "Checking..."
                          : isConnected
                            ? "Connected"
                            : "Not connected"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="section-block" aria-labelledby="overview-title">
            <div className="section-heading">
              <div>
                <h2 id="overview-title">Dashboard overview</h2>
                <p>Live figures retrieved from your local backend</p>
              </div>
              <span className="demo-label">
                {loading ? "LOADING" : error ? "CONNECTION ERROR" : "LIVE API DATA"}
              </span>
            </div>

            <div className="overview-grid">
              <article className="metric-card">
                <div className="metric-topline">
                  <span>Cultural records</span>
                  <span className="metric-icon blue-icon">↗</span>
                </div>
                <strong>{loading ? "..." : records.length}</strong>
                <p>Records returned by the API</p>
                <div className="metric-foot">
                  <span>DuckDB</span>
                  <span>{backendConnected ? "LIVE" : "OFFLINE"}</span>
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-topline">
                  <span>Regions represented</span>
                  <span className="metric-icon violet-icon">◎</span>
                </div>
                <strong>
                  {loading ? "..." : new Set(records.map((record) => record.region)).size}
                </strong>
                <p>Unique regions in loaded records</p>
                <div className="metric-foot">
                  <span>Region count</span>
                  <span>API</span>
                </div>
              </article>

              <article className="metric-card snapshot-card">
                <div className="metric-topline">
                  <span>Backend status</span>
                  <span className="metric-icon green-icon">◷</span>
                </div>
                <strong>{loading ? "Checking..." : backendConnected ? "Online" : "Offline"}</strong>
                <p>FastAPI health endpoint</p>
                <div className="snapshot-note">
                  <span className="status-dot" />
                  {backendConnected ? "Connection successful" : "Awaiting connection"}
                </div>
              </article>
            </div>
          </section>

          <section className="section-block" aria-labelledby="records-title" id="records">
            <div className="section-heading">
              <div>
                <h2 id="records-title">Cultural records</h2>
                <p>Actual records returned by the DuckDB-backed API</p>
              </div>
              <span className="demo-label">{records.length} RECORDS</span>
            </div>

            {error && (
              <div role="alert">
                <p>{error}</p>
                <button type="button" onClick={() => void loadDashboardData()}>
                  Try again
                </button>
              </div>
            )}

            {loading ? (
              <p>Loading cultural records...</p>
            ) : !error && records.length === 0 ? (
              <p>No cultural records found.</p>
            ) : !error ? (
              <div className="activity-list">
                {records.map((record) => (
                  <article className="activity-row" key={record.id}>
                    <div className="activity-symbol" aria-hidden="true">▤</div>
                    <div className="activity-copy">
                      <h3>{record.name}</h3>
                      <p>
                        ID: {record.id} · {record.category}
                      </p>
                    </div>
                    <span className="activity-type">{record.region}</span>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="section-block activity-section" aria-labelledby="activity-title" id="activity">
            <div className="section-heading">
              <div>
                <h2 id="activity-title">Recent activity</h2>
                <p>Basic integration status</p>
              </div>
              <span className="demo-label">LOCAL STATUS</span>
            </div>
            <div className="activity-list">
              {activity.map((item) => (
                <article className="activity-row" key={item.title}>
                  <div className="activity-symbol" aria-hidden="true">↗</div>
                  <div className="activity-copy">
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <span className="activity-type">{item.type}</span>
                  <time>{item.time}</time>
                </article>
              ))}
            </div>
          </section>

          <footer className="page-footer">
            <span>Phase 2 proof of concept</span>
            <span><i /> Local-first · Live API data</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;