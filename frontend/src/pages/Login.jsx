import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { loginUser, registerUser } from "../services/authApi";
import { readWorkspaceSettings, saveWorkspaceSettings } from "../services/localData";

function Login() {
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const action = registering ? registerUser : loginUser;
      const body = registering ? { name, businessName, username: username.trim(), password } : { username: username.trim(), password };
      const response = await action(body);
      // The API keeps its JWT in an HttpOnly cookie; JavaScript stores only a UI marker and CSRF token.
      if (response.data?.csrfToken) sessionStorage.setItem("mybillbuddy:csrf", response.data.csrfToken);
      localStorage.setItem("mybillbuddy:session", "active");
      try {
        const [profile, account] = await Promise.all([api.get("/account/settings"), api.get("/auth/me")]);
        saveWorkspaceSettings({ ...readWorkspaceSettings(), ...profile.data, business: profile.data.businessName, email: account.data.username });
      } catch { /* Sign-in still succeeds if optional profile loading needs a retry. */ }
      navigate("/dashboard");
    } catch (requestError) {
      const status = requestError.response?.status;
      if ([502, 503, 504].includes(status) || !requestError.response) {
        setError("The API could not be reached. Start the backend and confirm its address in the Vite API settings.");
      } else {
        setError(requestError.response?.data?.message || (registering ? "Could not create your account." : "Sign-in failed. Check your email and password."));
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setRegistering((value) => !value); setError(""); };

  return <main className="login-page"><header className="login-page-header"><Link to="/" className="brand"><span className="brand-icon">₹</span><span className="brand-text"><strong>MyBill<span>Buddy</span></strong><small>SMART BUSINESS BILLING</small></span></Link><Link to="/dashboard">Explore the demo →</Link></header><section className="login-panel"><div className="login-mark">₹</div><span className="dialog-eyebrow">SERVER WORKSPACE</span><h1>{registering ? "Create your account" : "Sign in to MyBillBuddy"}</h1><p>{registering ? "Create a secure account to keep your business records in the API." : "Sign in to access your business workspace and synced records."}</p><form onSubmit={submit}>
    {registering && <><label htmlFor="name">Your name</label><input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /><label htmlFor="business-name">Business name</label><input id="business-name" autoComplete="organization" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required /></>}
    <label htmlFor="username">Email</label><input id="username" type="email" autoComplete="email" value={username} onChange={(event) => setUsername(event.target.value)} required />
    <label htmlFor="password">Password</label><input id="password" type="password" autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 12 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required />
    {registering && <small className="login-footnote">Use at least 12 characters.</small>}{error && <div className="login-error" role="alert">{error}</div>}
    <button className="login-submit" type="submit" disabled={loading}>{loading ? "Connecting…" : registering ? "Create account →" : "Sign in securely →"}</button>
  </form><button className="login-mode-toggle" type="button" onClick={switchMode}>{registering ? "Already have an account? Sign in" : "New to MyBillBuddy? Create an account"}</button><div className="login-divider"><span>DEMO ACCESS</span></div><Link className="demo-login-link" to="/dashboard">Continue with sample data</Link><div className="login-footnote">Server account data is saved in the connected database. Demo records remain in this browser.</div></section><Link to="/" className="login-back-link">← Back to MyBillBuddy</Link></main>;
}

export default Login;
