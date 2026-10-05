import { Link } from "react-router-dom";

function Navbar() {
  return <header className="navbar"><div className="container nav-inner">
    <Link to="/" className="brand"><div className="brand-icon">₹</div><div className="brand-text"><strong>MyBill<span>Buddy</span></strong><small>SMART BUSINESS BILLING</small></div></Link>
    <nav className="nav-links" aria-label="Main navigation"><a href="#solutions">Solutions</a><a href="#reports">Reports</a><a href="#pricing">Pricing</a></nav>
    <div className="nav-actions"><Link to="/login" className="login-link">Sign in</Link><Link to="/dashboard" className="nav-button">Explore demo <span>→</span></Link></div>
  </div></header>;
}

export default Navbar;
