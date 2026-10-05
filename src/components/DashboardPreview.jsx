function DashboardPreview() {

  const transactions = [
    {
      initials: "AR",
      name: "Rahul Enterprises",
      invoice: "Invoice #INV-1042",
      amount: "+₹18,500",
      type: "purple",
    },
    {
      initials: "MS",
      name: "Mehta Stores",
      invoice: "Invoice #INV-1041",
      amount: "+₹8,250",
      type: "blue-bg",
    },
    {
      initials: "PK",
      name: "Priya Kitchen",
      invoice: "Payment received",
      amount: "+₹12,800",
      type: "green-bg",
    },
  ];

  return (
    <div className="dashboard-wrapper">

      <span className="preview-caption">SAMPLE WORKSPACE</span>

      <div className="dashboard-glow" />

      <div className="dashboard">

        <div className="dashboard-topbar">

          <div className="mini-brand">

            <div className="mini-logo">
              ₹
            </div>

            <strong>
              MyBillBuddy
            </strong>

          </div>

          <div className="dashboard-search">
            <span>⌕</span>
            Search anything...
          </div>

          <div className="top-icons">

            <span>◐</span>
            <span>♢</span>

            <div className="profile">
              AK
            </div>

          </div>

        </div>

        <div className="dashboard-body">

          <aside className="sidebar">

            <div className="side-item active">
              <span>▦</span>
              Dashboard
            </div>

            <div className="side-item">
              <span>▤</span>
              Invoices
            </div>

            <div className="side-item">
              <span>◉</span>
              Customers
            </div>

            <div className="side-item">
              <span>□</span>
              Inventory
            </div>

            <div className="side-item">
              <span>↗</span>
              Payments
            </div>

            <div className="side-item">
              <span>◒</span>
              Reports
            </div>

            <div className="sidebar-bottom">

              <div className="side-item">
                <span>⚙</span>
                Settings
              </div>

            </div>

          </aside>

          <div className="dashboard-content">

            <div className="dashboard-heading">

              <div>

                <span className="welcome">
                  Good afternoon,
                </span>

                <h3>
                  Arjun's Store 👋
                </h3>

              </div>

              <span className="create-bill">
                + Create Invoice
              </span>

            </div>

            <div className="stats-grid">

              <div className="stat-card">

                <div className="stat-icon blue">
                  ₹
                </div>

                <div>

                  <small>
                    Total Sales
                  </small>

                  <strong>
                    ₹2,84,650
                  </strong>

                  <em>
                    ↑ 12.8%
                  </em>

                </div>

              </div>

              <div className="stat-card">

                <div className="stat-icon green">
                  ✓
                </div>

                <div>

                  <small>
                    Received
                  </small>

                  <strong>
                    ₹2,18,400
                  </strong>

                  <em>
                    ↑ 8.4%
                  </em>

                </div>

              </div>

              <div className="stat-card">

                <div className="stat-icon orange">
                  !
                </div>

                <div>

                  <small>
                    Outstanding
                  </small>

                  <strong>
                    ₹66,250
                  </strong>

                  <em className="orange-text">
                    12 invoices
                  </em>

                </div>

              </div>

            </div>

            <div className="dashboard-columns">

              <div className="chart-card">

                <div className="card-header">

                  <div>

                    <small>
                      SALES OVERVIEW
                    </small>

                    <h4>
                      ₹2.84L{" "}
                      <span>
                        +12.8%
                      </span>
                    </h4>

                  </div>

                  <span className="preview-range">Last 7 days⌄</span>

                </div>

                <div className="chart">

                  <div className="chart-lines">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>

                  <svg
                    viewBox="0 0 500 170"
                    preserveAspectRatio="none"
                  >

                    <defs>

                      <linearGradient
                        id="areaGradientPreview"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >

                        <stop
                          offset="0%"
                          stopColor="#2563eb"
                          stopOpacity=".25"
                        />

                        <stop
                          offset="100%"
                          stopColor="#2563eb"
                          stopOpacity="0"
                        />

                      </linearGradient>

                    </defs>

                    <path
                      d="
                        M0 135
                        C45 125,55 90,100 105
                        S155 125,200 78
                        S260 105,300 58
                        S350 75,390 42
                        S440 68,500 18
                        L500 170
                        L0 170
                        Z
                      "
                      fill="url(#areaGradientPreview)"
                    />

                    <path
                      d="
                        M0 135
                        C45 125,55 90,100 105
                        S155 125,200 78
                        S260 105,300 58
                        S350 75,390 42
                        S440 68,500 18
                      "
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                  </svg>

                  <div className="chart-days">

                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>

                  </div>

                </div>

              </div>

              <div className="activity-card">

                <div className="card-header">

                  <div>

                    <small>
                      RECENT ACTIVITY
                    </small>

                    <h4>
                      Transactions
                    </h4>

                  </div>

                  <a href="/dashboard">
                    View all
                  </a>

                </div>

                {transactions.map(
                  (transaction, index) => (

                    <div
                      className="transaction"
                      key={index}
                    >

                      <div
                        className={`transaction-icon ${transaction.type}`}
                      >
                        {transaction.initials}
                      </div>

                      <div>

                        <strong>
                          {transaction.name}
                        </strong>

                        <small>
                          {transaction.invoice}
                        </small>

                      </div>

                      <b
                        className={
                          transaction.type ===
                          "green-bg"
                            ? "received"
                            : ""
                        }
                      >
                        {transaction.amount}
                      </b>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default DashboardPreview;
