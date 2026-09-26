import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { Wordmark, PasswordField } from "../components/bits";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { backendUrl, checkAuthStatus, isLoggedIn } = useContext(AppContext);

  const redirectPath = location.state?.from || "/";

  const [state, setState] = useState(params.get("mode") === "signup" ? "Sign Up" : "Login");
  const [busy, setBusy] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "", email: "", password: "", confirmPassword: "", volunteer: false,
  });

  if (isLoggedIn && !busy) {
    return (
      <main className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <p className="text-lg">You're already signed in.</p>
          <Link to="/" className="btn btn-clay mt-4">Go to your rescue desk</Link>
        </div>
      </main>
    );
  }

  const handleLoginInputChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterData({ ...registerData, [name]: type === "checkbox" ? checked : value });
  };

  const handleAuthSubmit = async (e, type) => {
    e.preventDefault();
    let payload;
    let endpoint;

    if (type === "Login") {
      payload = { email: loginData.email.trim(), password: loginData.password };
      endpoint = "/api/auth/login";
    } else {
      const { name, email, password, confirmPassword } = registerData;
      if (password.length < 8) return toast.error("Use at least 8 characters for the password.");
      if (password !== confirmPassword) return toast.error("The two passwords don't match.");
      payload = { name: name.trim(), email: email.trim(), password };
      endpoint = "/api/auth/register";
    }

    setBusy(true);
    try {
      const response = await axios.post(backendUrl + endpoint, payload);
      if (!response.data.success) {
        toast.error(response.data.message);
        return;
      }

      // new accounts start as donors; ticking the box switches to volunteer straight away
      if (type === "Sign Up" && registerData.volunteer) {
        await axios.put(`${backendUrl}/api/user/profile`, { role: "volunteer" });
      }

      await checkAuthStatus();
      toast.success(type === "Login" ? "Welcome back" : "You're in. Welcome to StrayBachao");
      const admin = response.data.user?.role === "admin";
      navigate(admin ? "/admindashboard" : redirectPath, { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const switchTo = (next) => {
    setState(next);
    setLoginData({ email: "", password: "" });
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* photo side */}
      <aside className="relative hidden lg:block overflow-hidden bg-[#1A1411]">
        <img src="/img/waiting.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1411]/90 via-[#1A1411]/30 to-transparent" />
        <div className="absolute bottom-0 p-12 text-[#FFF8F0] max-w-xl">
          <p className="bn text-3xl leading-snug">ওরা কথা বলতে পারে না,<br />আমরা পারি।</p>
          <p className="mt-4 text-lg text-[#EADBC8]">
            They can't ask for help. So the rest of us keep an eye out, and share what we see.
          </p>
        </div>
      </aside>

      {/* form side */}
      <main id="main" className="min-h-screen flex flex-col px-5 sm:px-10 py-8 paw-trail">
        <Link to="/" className="self-center lg:self-start" aria-label="StrayBachao home"><Wordmark /></Link>

        <div className="flex-1 grid place-items-center py-10">
          <div className="w-full max-w-md">
            <h1 className="text-3xl sm:text-4xl font-semibold text-center">
              {state === "Login" ? "Welcome back" : "Join the neighbourhood"}
            </h1>
            <p className="mt-2 text-center text-ink-2">
              {state === "Login"
                ? "Sign in to post rescues, join teams and support volunteers."
                : "It takes a minute. You can post your first rescue right after."}
            </p>

            <div className="mt-8 grid grid-cols-2 p-1 rounded-full bg-sunken border border-line" role="tablist" aria-label="Sign in or create an account">
              {[["Login", "Sign in"], ["Sign Up", "Create account"]].map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={state === key} onClick={() => switchTo(key)}
                  className={`min-h-11 rounded-full font-semibold transition-colors ${state === key ? "bg-card text-ink shadow" : "text-ink-2 hover:text-ink"}`}>
                  {label}
                </button>
              ))}
            </div>

            {state === "Login" ? (
              <form onSubmit={(e) => handleAuthSubmit(e, "Login")} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="loginEmail" className="label">Email</label>
                  <input type="email" id="loginEmail" name="email" autoComplete="email" required
                    value={loginData.email} onChange={handleLoginInputChange} className="field" />
                </div>
                <PasswordField id="loginPassword" label="Password" value={loginData.password} onChange={handleLoginInputChange} />
                <button type="submit" disabled={busy} className="btn btn-clay w-full text-base">
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => handleAuthSubmit(e, "Sign Up")} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="registerName" className="label">Your name</label>
                  <input type="text" id="registerName" name="name" autoComplete="name" required maxLength={60}
                    value={registerData.name} onChange={handleRegisterInputChange} className="field" />
                </div>
                <div>
                  <label htmlFor="registerEmail" className="label">Email</label>
                  <input type="email" id="registerEmail" name="email" autoComplete="email" required
                    value={registerData.email} onChange={handleRegisterInputChange} className="field" />
                </div>
                <PasswordField id="registerPassword" label="Password" autoComplete="new-password"
                  value={registerData.password} onChange={handleRegisterInputChange} hint="At least 8 characters." />
                <PasswordField id="confirmPassword" name="confirmPassword" label="Password again" autoComplete="new-password"
                  value={registerData.confirmPassword} onChange={handleRegisterInputChange} />
                <label className="flex items-start gap-3 rounded-xl border border-line bg-card p-4 cursor-pointer">
                  <input type="checkbox" name="volunteer" checked={registerData.volunteer} onChange={handleRegisterInputChange}
                    className="mt-1 w-5 h-5 accent-[var(--sb-moss)]" />
                  <span>
                    <span className="font-semibold block">I want to volunteer</span>
                    <span className="text-sm text-ink-2">Volunteers can start and join teams. You can change this later.</span>
                  </span>
                </label>
                <button type="submit" disabled={busy} className="btn btn-clay w-full text-base">
                  {busy ? "Creating your account…" : "Create account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
