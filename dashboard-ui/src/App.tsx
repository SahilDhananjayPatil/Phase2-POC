import "./App.css";

const services = [
  { name: "FastAPI Backend", detail: "Application API", mark: "API", tone: "blue" },
  { name: "DuckDB", detail: "Analytics database", mark: "D", tone: "amber" },
  { name: "LanceDB", detail: "Vector database", mark: "L", tone: "violet" },
  { name: "SQLite", detail: "Local metadata", mark: "S", tone: "green" },
  { name: "Ollama", detail: "Local AI runtime", mark: "O", tone: "coral" },
];

const activity = [
  { time: "09:30 AM", title: "Sample cultural snapshot prepared", detail: "Demo dataset · 1,248 sample signals", type: "Snapshot" },
  { time: "Yesterday", title: "Dashboard workspace initialized", detail: "Phase 2 PoC · Local environment", type: "System" },
  { time: "Yesterday", title: "Service checks not yet configured", detail: "Connections will appear here when available", type: "Setup" },
];

function App() {
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
            <span className="demo-pill"><span /> DEMO ENVIRONMENT</span>
            <div className="avatar" aria-label="Local workspace">L</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading" id="overview">
            <div>
              <p className="eyebrow">LOCAL-FIRST CULTURAL INSIGHTS</p>
              <h1>Local AI Cultural Analytics Dashboard <span className="title-suffix">- Phase 2 PoC</span></h1>
              <p className="page-description">
                A clear view of your local analytics workspace and its service connections.
              </p>
            </div>
            <div className="date-chip"><span aria-hidden="true">◷</span> Demo overview</div>
          </section>

          <section className="section-block" aria-labelledby="services-title" id="services">
            <div className="section-heading">
              <div>
                <h2 id="services-title">Service status</h2>
                <p>Local components configured for this proof of concept</p>
              </div>
              <span className="status-summary"><span /> 0 of 5 connected</span>
            </div>

            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.name}>
                  <div className={`service-mark ${service.tone}`} aria-hidden="true">{service.mark}</div>
                  <div className="service-details">
                    <h3>{service.name}</h3>
                    <p>{service.detail}</p>
                  </div>
                  <div className="connection-status">
                    <span className="status-dot" />
                    <span>Not connected</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section-block" aria-labelledby="overview-title">
            <div className="section-heading">
              <div>
                <h2 id="overview-title">Dashboard overview</h2>
                <p>A preview of the cultural analytics workspace</p>
              </div>
              <span className="demo-label">SAMPLE DATA</span>
            </div>

            <div className="overview-grid">
              <article className="metric-card">
                <div className="metric-topline"><span>Cultural signals</span><span className="metric-icon blue-icon">↗</span></div>
                <strong>1,248</strong>
                <p>Sample records in this demo</p>
                <div className="metric-foot"><span className="mini-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span><span>DEMO</span></div>
              </article>
              <article className="metric-card">
                <div className="metric-topline"><span>Regions represented</span><span className="metric-icon violet-icon">◎</span></div>
                <strong>18</strong>
                <p>Illustrative sample locations</p>
                <div className="metric-foot"><span className="region-dots" aria-hidden="true">• • • • • •</span><span>DEMO</span></div>
              </article>
              <article className="metric-card snapshot-card">
                <div className="metric-topline"><span>Latest sample snapshot</span><span className="metric-icon green-icon">◷</span></div>
                <strong>Today, 09:30</strong>
                <p>Example timestamp · not live data</p>
                <div className="snapshot-note"><span className="status-dot" /> Preview only</div>
              </article>
            </div>
          </section>

          <section className="section-block activity-section" aria-labelledby="activity-title" id="activity">
            <div className="section-heading">
              <div>
                <h2 id="activity-title">Recent activity</h2>
                <p>Illustrative entries for the Phase 2 PoC</p>
              </div>
              <span className="demo-label">DEMO ACTIVITY</span>
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
            <span><i /> Local-first · Sample content only</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
