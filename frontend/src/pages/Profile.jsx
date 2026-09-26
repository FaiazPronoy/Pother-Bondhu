import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { HandHeart, Heart, Wallet, UserRound } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { AREAS, Avatar, Loading, Points, SignInPrompt } from "../components/bits";
import { useLang } from "../context/LangContext";

const TOPUPS = [500, 1000, 2000];

function AccountForm({ user, onSaved }) {
  const { backendUrl } = useContext(AppContext);
  const { t, area, apiError } = useLang();
  const [form, setForm] = useState({ name: user.name, location: user.location || "", bio: user.bio || "", role: user.role });
  const [saving, setSaving] = useState(false);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name: form.name, location: form.location, bio: form.bio };
      if (user.role !== "admin") body.role = form.role;
      const { data } = await axios.put(`${backendUrl}/api/user/profile`, body);
      onSaved(data);
      toast.success(data.role !== user.role && data.role === "volunteer" ? t("profile.nowVolunteer") : t("common.saved"));
    } catch (err) {
      toast.error(apiError(err, "profile.saveFail"));
    } finally {
      setSaving(false);
    }
  };

  // keep an area that was typed before the list existed
  const areas = form.location && !AREAS.includes(form.location) ? [form.location, ...AREAS] : AREAS;

  return (
    <form onSubmit={save} className="card p-5 sm:p-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">{t("profile.name")}</label>
          <input id="name" name="name" required maxLength={60} value={form.name} onChange={change} className="field" />
        </div>
        <div>
          <label htmlFor="location" className="label">{t("profile.area")}</label>
          <select id="location" name="location" value={form.location} onChange={change} className="field">
            <option value="">{t("profile.notSet")}</option>
            {areas.map((a) => <option key={a} value={a}>{area(a)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="email" className="label">{t("profile.email")}</label>
        <input id="email" value={user.email} readOnly className="field bg-sunken text-ink-2" aria-describedby="email-note" />
        <p id="email-note" className="mt-1 text-sm text-ink-2">{t("profile.emailNote")}</p>
      </div>
      <div>
        <label htmlFor="bio" className="label">{t("profile.about")}</label>
        <textarea id="bio" name="bio" maxLength={500} value={form.bio} onChange={change} className="field"
          placeholder={t("profile.aboutHint")} />
      </div>

      {user.role !== "admin" && (
        <fieldset>
          <legend className="label">{t("profile.how")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["donor", Heart, t("role.donor"), t("profile.donorNote")],
              ["volunteer", HandHeart, t("role.volunteer"), t("profile.volunteerNote")],
            ].map(([value, Icon, label, note]) => (
              <label key={value} className={`flex items-start gap-3 rounded-xl border-[1.5px] p-4 cursor-pointer ${form.role === value ? "border-clay bg-clay-lo/40" : "border-line-2"}`}>
                <input type="radio" name="role" value={value} checked={form.role === value} onChange={change} className="mt-1 w-4 h-4 accent-[var(--sb-clay)]" />
                <span>
                  <span className="font-semibold inline-flex items-center gap-1.5"><Icon size={16} aria-hidden="true" /> {label}</span>
                  <span className="block text-sm text-ink-2 mt-0.5">{note}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button type="submit" disabled={saving} className="btn btn-clay">{saving ? t("common.saving") : t("common.save")}</button>
    </form>
  );
}

function WalletPanel({ user, onToppedUp }) {
  const { backendUrl } = useContext(AppContext);
  const { t, num, apiError } = useLang();
  const [bkashNumber, setBkashNumber] = useState("");
  const [amount, setAmount] = useState(1000);
  const [busy, setBusy] = useState(false);

  const topUp = async (e) => {
    e.preventDefault();
    if (!/^01[3-9]\d{8}$/.test(bkashNumber.trim())) return toast.error(t("profile.badBkash"));
    const points = Number(amount);
    if (!Number.isInteger(points) || points < 1 || points > 10000) return toast.error(t("profile.range"));
    setBusy(true);
    try {
      const { data } = await axios.put(`${backendUrl}/api/user/add-points`, { bkashNumber: bkashNumber.trim(), amount: points });
      onToppedUp(data.user.points);
      setBkashNumber("");
      toast.success(t("profile.added", { n: points }));
    } catch (err) {
      toast.error(apiError(err, "profile.topFail"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
      <div className="rounded-3xl bg-moss text-on-clay p-6 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10" aria-hidden="true" />
        <p className="inline-flex items-center gap-2 opacity-90"><Wallet size={18} aria-hidden="true" /> {t("profile.balance")}</p>
        <p className="mt-2 text-4xl font-display"><Points value={user.points} /></p>
        <p className="mt-4 text-sm opacity-90 max-w-xs">{t("profile.balanceNote")}</p>
        <Link to="/volunteers" className="mt-5 inline-flex font-semibold underline underline-offset-4">{t("profile.support")}</Link>
      </div>

      <form onSubmit={topUp} className="card p-5 sm:p-6 space-y-4">
        <h2 className="text-xl font-semibold">{t("profile.topUp")}</h2>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("profile.amount")}>
          {TOPUPS.map((preset) => (
            <button key={preset} type="button" className="chip justify-center" aria-pressed={Number(amount) === preset} onClick={() => setAmount(preset)}>
              {num(preset)}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="amount" className="label">{t("profile.amountLabel")}</label>
          <input id="amount" type="number" min="1" max="10000" step="1" inputMode="numeric" value={amount}
            onChange={(e) => setAmount(e.target.value)} className="field" />
        </div>
        <div>
          <label htmlFor="bkash" className="label">{t("profile.bkash")}</label>
          <input id="bkash" type="tel" inputMode="numeric" placeholder="017XXXXXXXX" value={bkashNumber}
            onChange={(e) => setBkashNumber(e.target.value)} className="field" />
        </div>
        <button type="submit" disabled={busy} className="btn btn-moss w-full">{busy ? t("profile.adding") : t("profile.add")}</button>
      </form>
    </div>
  );
}

const ProfilePage = () => {
  const { backendUrl, isLoggedIn, checkAuthStatus } = useContext(AppContext);
  const { t, area } = useLang();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "wallet" ? "wallet" : "account";
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    axios.get(`${backendUrl}/api/user/profile`).then((r) => setUser(r.data.user)).catch(() => {});
  }, [backendUrl, isLoggedIn]);

  if (!isLoggedIn) return <SignInPrompt>{t("profile.signIn")}</SignInPrompt>;
  if (!user) return <Loading />;

  const tabs = [["account", t("profile.tabProfile"), UserRound], ["wallet", t("profile.tabWallet"), Wallet]];

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
        <Avatar name={user.name} size="w-20 h-20 text-2xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-semibold truncate">{user.name}</h1>
          <p className="text-ink-2 mt-1">
            <span className={`tag ${user.role === "volunteer" ? "tag-moss" : user.role === "admin" ? "tag-sun" : "tag-clay"} mr-2`}>
              {t(`role.${user.role}`)}
            </span>
            {user.location ? area(user.location) : t("common.areaNotSet")}
          </p>
        </div>
        {user.role === "volunteer" && <Link to={`/volunteers/${user._id}`} className="btn btn-line">{t("profile.publicProfile")}</Link>}
      </header>

      <div className="flex gap-2 mb-6 border-b border-line" role="tablist" aria-label={t("profile.sections")}>
        {tabs.map(([key, label, Icon]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setParams(key === "wallet" ? { tab: "wallet" } : {})}
            className={`inline-flex items-center gap-2 px-4 min-h-11 -mb-px border-b-[3px] font-semibold ${tab === key ? "border-clay text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}>
            <Icon size={17} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      {tab === "account" ? (
        <AccountForm user={user} onSaved={async (u) => { setUser(u); await checkAuthStatus(); }} />
      ) : (
        <WalletPanel user={user} onToppedUp={async (points) => { setUser({ ...user, points }); await checkAuthStatus(); }} />
      )}
    </>
  );
};

export default ProfilePage;
