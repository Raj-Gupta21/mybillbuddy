import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authApi";

const links = [
  ["▦", "Overview", "/dashboard"],
  ["▤", "Invoices", "/invoices"],
  ["◉", "Customers", "/customers"],
  ["□", "Inventory", "/inventory"],
  ["↗", "Payments", "/payments"],
  ["◒", "Reports", "/reports"],
  ["⚙", "Settings", "/settings"],
];

function Sidebar() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(() => Boolean(localStorage.getItem("mybillbuddy:session")));

  const signOut = async () => {
    try { if (connected) await logoutUser(); } catch { /* Expired sessions are cleared locally as well. */ }
    localStorage.removeItem("mybillbuddy:session");
    sessionStorage.removeItem("mybillbuddy:csrf");
    setConnected(false);
    navigate("/login");
  };

  return <aside className="app-sidebar">
    <Link to="/" className="app-sidebar-logo"><span className="mini-logo">₹</span><strong>MyBillBuddy</strong></Link>
    <span className="sidebar-label">WORKSPACE</span>
    <nav className="app-sidebar-nav" aria-label="Workspace navigation">{links.map(([icon, name, path]) => <NavLink key={path} to={path} title={name} className={({ isActive }) => `app-side-item ${isActive ? "active" : ""}`}><span aria-hidden="true">{icon}</span><span className="side-label">{name}</span></NavLink>)}{connected && <button className="app-side-item app-signout-mobile" title="Sign out" onClick={signOut}><span aria-hidden="true">↪</span><span className="side-label">Sign out</span></button>}</nav>
    <div className="app-sidebar-bottom"><span className="demo-indicator"><i /> {connected ? "Server account" : "Demo data"}</span>{connected && <button className="sidebar-signout" onClick={signOut}>↪ Sign out</button>}<Link to="/" className="back-home-link">← Back to site</Link></div>
  </aside>;
}

export default Sidebar;
