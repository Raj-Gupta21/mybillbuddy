import Navbar from "../components/Navbar";
import DashboardPreview from "../components/DashboardPreview";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

function Home() {

  const features = [
    {
      icon: "▤",
      title: "Fast Invoicing",
      description:
        "Create professional GST and non-GST invoices in seconds and keep your billing flowing.",
      className: "featured-feature",
    },
    {
      icon: "□",
      title: "Smart Inventory",
      description:
        "Keep track of products, quantities and stock levels without spreadsheets.",
      className: "",
    },
    {
      icon: "₹",
      title: "Payment Tracking",
      description:
        "Know exactly what's received, pending and overdue at a glance.",
      className: "",
    },
    {
      icon: "◒",
      title: "Business Reports",
      description:
        "Turn everyday transactions into clear insights that help you make better decisions.",
      className: "",
    },
  ];

  return (
    <>
      <Navbar />

      <main>

        <section className="hero">

          <div className="hero-decoration decoration-one" />

          <div className="hero-decoration decoration-two" />

          <div className="container hero-grid">

            <div className="hero-content">

              <div className="eyebrow">

                <span className="eyebrow-dot" />

                Built for modern Indian businesses

              </div>

              <h1>

                Billing made

                <span>
                  beautifully simple.
                </span>

              </h1>

              <p className="hero-description">

                Create invoices, manage inventory,
                track payments and understand your
                business — all from one simple workspace.

              </p>

              <div className="hero-buttons">

                <Link to="/dashboard" className="primary-button">
                  Explore the free demo
                  <span>→</span>
                </Link>

                <a
                  href="#features"
                  className="secondary-button"
                >

                  <span className="play-icon">
                    ▶
                  </span>

                  See how it works

                </a>

              </div>

              <div className="trust-row">
                <span className="trust-check">✓</span>
                <div className="trust-text"><strong>Try every feature with sample data</strong><small>Nothing is sent to a server in this demo.</small></div>
              </div>

            </div>

            <DashboardPreview />

          </div>

        </section>

        <section
          className="features-section"
          id="features"
          aria-labelledby="solutions-heading"
        >

          <div className="container">

            <div className="section-heading">

              <div className="eyebrow">

                <span className="eyebrow-dot" />

                Everything in one place

              </div>

              <h2 id="solutions-heading">

                Your business.

                <span>
                  One smart buddy.
                </span>

              </h2>

              <p>
                Powerful tools without the complicated
                accounting-software feel.
              </p>

            </div>

            <div className="features-grid" id="solutions">

              {features.map(
                (feature, index) => (

                  <article
                    key={index}
                    className={`feature-card ${feature.className}`}
                  >

                    <div
                      className={`feature-icon ${
                        index === 1
                          ? "green-icon"
                          : index === 2
                          ? "orange-icon"
                          : index === 3
                          ? "purple-icon"
                          : ""
                      }`}
                    >
                      {feature.icon}
                    </div>

                    <h3>
                      {feature.title}
                    </h3>

                    <p>
                      {feature.description}
                    </p>

                    {index === 0 && (
                      <Link to="/invoices">Create an invoice →</Link>
                    )}

                  </article>

                )
              )}

            </div>

          </div>

        </section>

        <section className="reports-promo" id="reports">
          <div className="container reports-promo-inner">
            <div><span className="eyebrow">CLEARER NUMBERS</span><h2>Know what’s coming in<br /><span>and what’s still due.</span></h2><p>See open invoices, payments received and low stock from one simple business overview.</p></div>
            <div className="report-preview-card"><span>DEMO OVERVIEW</span><strong>₹ 66,250</strong><small>Example outstanding balance</small><div className="report-preview-bars"><i /><i /><i /><i /><i /><i /><i /></div><Link to="/reports">Explore reports →</Link></div>
          </div>
        </section>

        <section className="pricing-section" id="pricing">
          <div className="container pricing-content"><span className="eyebrow">START WITH THE DEMO</span><h2>Explore the workspace.<br /><span>No setup needed.</span></h2><p>Try invoices, customers, stock and reports with sample data saved only in your browser.</p><Link to="/dashboard" className="primary-button">Open the free demo <span>→</span></Link><small>Demo data is local to this browser. Do not enter real customer or payment information.</small></div>
        </section>

        <section
          className="cta-section"
          id="get-started"
        >

          <div className="container">

            <div className="cta-box">

              <div className="cta-decoration" />

              <div className="cta-content">

                <span className="cta-label">
                  READY TO GET STARTED?
                </span>

                <h2>

                  Let MyBillBuddy

                  <span>
                    handle the busy work.
                  </span>

                </h2>

                <p>

                  Start creating smarter bills and
                  spend more time growing your business.

                </p>

                <Link to="/dashboard" className="white-button">
                  Explore the demo workspace
                  <span>→</span>
                </Link>

              </div>

              <div className="cta-art">

                <div className="floating-card card-one">

                  <span>✓</span>

                  Payment received

                  <strong>
                    ₹24,500
                  </strong>

                </div>

                <div className="floating-card card-two">

                  <span>▤</span>

                  New Invoice

                  <strong>
                    #INV-1058
                  </strong>

                </div>

                <div className="circle-art">
                  ₹
                </div>

              </div>

            </div>

          </div>

        </section>

      </main>

      <Footer />

    </>
  );
}

export default Home;
