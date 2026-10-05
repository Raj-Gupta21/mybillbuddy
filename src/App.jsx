import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/invoices" element={<Invoices />} />

        <Route path="/customers" element={<Customers />} />

        <Route path="/inventory" element={<Inventory />} />

        <Route path="/payments" element={<Payments />} />

        <Route path="/reports" element={<Reports />} />

        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />

        <Route path="*" element={<main className="not-found"><span>404</span><h1>That page isn’t here</h1><p>Try the home page or open the demo workspace.</p><div><Link to="/">Go home</Link><Link to="/dashboard">Open demo →</Link></div></main>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
