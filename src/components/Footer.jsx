import { Link } from "react-router-dom";

function Footer() {
  return <footer><div className="container footer-inner"><div className="footer-brand"><Link to="/" className="brand"><div className="brand-icon">₹</div><div className="brand-text"><strong>MyBill<span>Buddy</span></strong><small>SMART BUSINESS BILLING</small></div></Link><p>Simple billing for ambitious businesses.</p></div><div className="footer-links"><a href="#pricing">Pricing</a><Link to="/dashboard">Explore demo</Link><span>© 2026 MyBillBuddy</span></div></div><div className="footer-demo-note">This preview stores demo information in your browser only. Do not enter real customer or payment data.</div></footer>;
}

export default Footer;
