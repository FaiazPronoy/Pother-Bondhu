import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { useLang } from "../context/LangContext";
import { HandHeart, Heart, LayoutDashboard } from "lucide-react";
import { Wordmark, PasswordField, LangButton } from "../components/bits";

// the accounts `npm run seed` creates, so anyone looking at the project can
// get in with one click; they are listed in the README too
const DEMO = [
  { key: "volunteer", email: "nabila@potherbondhu.com", password: "Volunteer@123", icon: HandHeart },
  { key: "donor", email: "mehedi@potherbondhu.com", password: "Donor@1234", icon: Heart },
  { key: "admin", email: "admin@potherbondhu.com", password: "Admin@1234", icon: LayoutDashboard },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { backendUrl, checkAuthStatus, isLoggedIn } = useContext(AppContext);
  const { t, lang, apiError } = useLang();

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
          <p className="text-lg">{t("login.already")}</p>
          <Link to="/" className="btn btn-clay mt-4">{t("login.goDesk")}</Link>
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

  const handleAuthSubmit = async (e, type, demo) => {
    e?.preventDefault();
    let payload;
    let endpoint;

    if (demo) {
      setLoginData({ email: demo.email, password: demo.password });
      payload = { email: demo.email, password: demo.password };
      endpoint = "/api/auth/login";
    } else if (type === "Login") {
      payload = { email: loginData.email.trim(), password: loginData.password };
      endpoint = "/api/auth/login";
    } else {
      const { name, email, password, confirmPassword } = registerData;
      if (password.length < 8) return toast.error(t("login.shortPw"));
      if (password !== confirmPassword) return toast.error(t("login.mismatch"));
      payload = { name: name.trim(), email: email.trim(), password };
      endpoint = "/api/auth/register";
    }

    setBusy(true);
    try {
      const response = await axios.post(backendUrl + endpoint, payload);
      if (!response.data.success) {
        // these routes answer 200 with success:false, so shape it like an axios error
        toast.error(apiError({ response }, "common.wentWrong"));
        return;
      }

      // new accounts start as donors; ticking the box switches to volunteer straight away
      if (type === "Sign Up" && registerData.volunteer) {
        await axios.put(`${backendUrl}/api/user/profile`, { role: "volunteer" });
      }

      await checkAuthStatus();
      toast.success(type === "Login" ? t("login.hello") : t("login.helloNew"));
      const admin = response.data.user?.role === "admin";
      navigate(admin ? "/admindashboard" : redirectPath, { replace: true });
    } catch (error) {
      toast.error(apiError(error, "common.wentWrong"));
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
        <div className="absolute inset-x-0 bottom-0 p-12 text-[#FFF8F0]">
          <div className="max-w-md">
            <p lang="bn" className="bn text-4xl leading-snug">ওরা কথা বলতে পারে না,<br /><span className="text-[#F2B659]">আমরা পারি।</span></p>
            {lang === "en" && <p className="mt-2 font-display italic text-xl text-[#F2B659]">{t("landing.mottoGloss")}</p>}
            <span className="mt-6 block h-0.5 w-14 rounded-full bg-[#F2B659]" aria-hidden="true" />
            <p className="mt-5 text-lg text-[#EADBC8] text-balance">{t("login.quote")}</p>
          </div>
        </div>
      </aside>

      {/* form side */}
      <main id="main" className="min-h-screen flex flex-col px-5 sm:px-10 py-8 paw-trail">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" aria-label={t("login.home")}><Wordmark /></Link>
          <LangButton />
        </div>

        <div className="flex-1 grid place-items-center py-10">
          <div className="w-full max-w-md">
            <h1 className="text-3xl sm:text-4xl font-semibold text-center">
              {state === "Login" ? t("login.welcome") : t("login.joinTitle")}
            </h1>
            <p className="mt-2 text-center text-ink-2 text-pretty">
              {state === "Login" ? t("login.welcomeSub") : t("login.joinSub")}
            </p>

            <div className="mt-8 grid grid-cols-2 p-1 rounded-full bg-sunken border border-line" role="tablist" aria-label={t("login.tabs")}>
              {[["Login", "login.tabIn"], ["Sign Up", "login.tabUp"]].map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={state === key} onClick={() => switchTo(key)}
                  className={`min-h-11 rounded-full font-semibold transition-colors ${state === key ? "bg-card text-ink shadow" : "text-ink-2 hover:text-ink"}`}>
                  {t(label)}
                </button>
              ))}
            </div>

            {state === "Login" ? (
              <form onSubmit={(e) => handleAuthSubmit(e, "Login")} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="loginEmail" className="label">{t("login.email")}</label>
                  <input type="email" id="loginEmail" name="email" autoComplete="email" required
                    value={loginData.email} onChange={handleLoginInputChange} className="field" />
                </div>
                <PasswordField id="loginPassword" label={t("login.password")} value={loginData.password} onChange={handleLoginInputChange} />
                <button type="submit" disabled={busy} className="btn btn-clay w-full text-base">
                  {busy ? t("login.signingIn") : t("login.tabIn")}
                </button>
              </form>
            ) : null}

            {state === "Login" && (
              <section className="mt-8 text-center" aria-labelledby="demo-title">
                <h2 id="demo-title" className="font-display text-lg">{t("login.demoTitle")}</h2>
                <p className="text-sm text-ink-2">{t("login.demoText")}</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {DEMO.map((d) => (
                    <button key={d.key} type="button" disabled={busy} onClick={() => handleAuthSubmit(null, "Login", d)} className="name-tag">
                      <span className="name-tag-top">{t("login.helloTag")}</span>
                      <span className="name-tag-body">
                        <d.icon size={18} aria-hidden="true" />
                        {t(`role.${d.key}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {state === "Sign Up" && (
              <form onSubmit={(e) => handleAuthSubmit(e, "Sign Up")} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="registerName" className="label">{t("login.name")}</label>
                  <input type="text" id="registerName" name="name" autoComplete="name" required maxLength={60}
                    value={registerData.name} onChange={handleRegisterInputChange} className="field" />
                </div>
                <div>
                  <label htmlFor="registerEmail" className="label">{t("login.email")}</label>
                  <input type="email" id="registerEmail" name="email" autoComplete="email" required
                    value={registerData.email} onChange={handleRegisterInputChange} className="field" />
                </div>
                <PasswordField id="registerPassword" label={t("login.password")} autoComplete="new-password"
                  value={registerData.password} onChange={handleRegisterInputChange} hint={t("login.passwordHint")} />
                <PasswordField id="confirmPassword" name="confirmPassword" label={t("login.passwordAgain")} autoComplete="new-password"
                  value={registerData.confirmPassword} onChange={handleRegisterInputChange} />
                <label className="flex items-start gap-3 rounded-xl border border-line bg-card p-4 cursor-pointer">
                  <input type="checkbox" name="volunteer" checked={registerData.volunteer} onChange={handleRegisterInputChange}
                    className="mt-1 w-5 h-5 accent-[var(--sb-moss)]" />
                  <span>
                    <span className="font-semibold block">{t("login.wantVolunteer")}</span>
                    <span className="text-sm text-ink-2">{t("login.wantVolunteerNote")}</span>
                  </span>
                </label>
                <button type="submit" disabled={busy} className="btn btn-clay w-full text-base">
                  {busy ? t("login.creating") : t("login.create")}
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
