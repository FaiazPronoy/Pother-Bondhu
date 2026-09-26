import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, PawPrint, Languages } from "lucide-react";
import { useLang } from "../context/LangContext";

// areas the teams and volunteers are spread across; used by every picker.
// Stored in English, shown in the reader's language through area().
export const AREAS = [
  "Badda", "Banani", "Bashundhara", "Dhanmondi", "Gulshan", "Mirpur",
  "Moghbazar", "Mohammadpur", "Puran Dhaka", "Uttara",
];

export function Wordmark({ className = "", size = "text-2xl" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} lang="en">
      <img src="/paw-heart.svg" alt="" className="w-9 h-9 shrink-0" />
      <span className={`font-display font-semibold tracking-tight leading-none ${size}`}>
        <span className="italic font-normal">Cholo</span>
        <span className="text-clay">Bachai</span>
      </span>
    </span>
  );
}

// switches the whole interface between English and Bangla
export function LangButton({ className = "" }) {
  const { t, toggle } = useLang();
  return (
    <button type="button" onClick={toggle} aria-label={t("common.toOtherLang")}
      className={`inline-flex items-center gap-1.5 min-h-11 px-3 rounded-full font-semibold text-ink-2 hover:text-ink hover:bg-sunken ${className}`}>
      <Languages size={18} aria-hidden="true" />
      <span>{t("common.otherLang")}</span>
    </button>
  );
}

// a round badge with someone's initials; there are no profile photos
export function Avatar({ name = "", size = "w-10 h-10 text-sm", tone = "clay" }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const tones = {
    clay: "bg-clay-lo text-clay-hi",
    moss: "bg-moss-lo text-moss-hi",
    sun: "bg-sun-lo text-ink",
  };
  return (
    <span aria-hidden="true" className={`${size} ${tones[tone]} rounded-full grid place-items-center font-bold shrink-0`}>
      {initials}
    </span>
  );
}

// every page opens the same way: a small label, the heading, one line under
// it, all centred and balanced so the lines come out even
export function PageHeader({ eyebrow, title, children, action }) {
  return (
    <header className="mb-10 text-center">
      {eyebrow && (
        <p className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-clay-lo/70 px-3 py-1">
          <PawPrint size={13} aria-hidden="true" /> {eyebrow}
        </p>
      )}
      <h1 className="mt-3 mx-auto max-w-3xl text-3xl sm:text-[2.6rem] font-semibold text-balance">{title}</h1>
      {children && <p className="mt-3 mx-auto max-w-2xl text-ink-2 text-lg text-balance">{children}</p>}
      <span className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
        <span className="w-1.5 h-1.5 rounded-full bg-clay" />
        <span className="w-1.5 h-1.5 rounded-full bg-sun" />
        <span className="w-1.5 h-1.5 rounded-full bg-moss" />
      </span>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </header>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="card p-10 text-center">
      <PawPrint className="mx-auto mb-3 text-line-2" size={40} aria-hidden="true" />
      <h3 className="text-xl font-semibold">{title}</h3>
      {children && <p className="mt-2 text-ink-2 max-w-md mx-auto text-pretty">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Loading({ rows = 3 }) {
  const { t } = useLang();
  return (
    <div className="space-y-4" role="status" aria-label={t("common.loading")}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-24" />
      ))}
    </div>
  );
}

export function PasswordField({ id, label, value, onChange, autoComplete = "current-password", name = "password", hint }) {
  const { t } = useLang();
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className="field pr-12"
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full text-ink-2 hover:text-ink hover:bg-sunken"
          aria-label={shown ? t("login.hidePw") : t("login.showPw")}
          aria-pressed={shown}
        >
          {shown ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
      {hint && <p className="mt-1 text-sm text-ink-2">{hint}</p>}
    </div>
  );
}

export function Points({ value, className = "" }) {
  const { t, num } = useLang();
  return (
    <span className={`inline-flex items-baseline gap-1 font-semibold tabular-nums ${className}`}>
      {num(value)}
      <span className="text-[.8em] font-medium opacity-80">{t("common.points")}</span>
    </span>
  );
}

export function SignInPrompt({ children }) {
  const location = useLocation();
  const { t } = useLang();
  return (
    <div className="card p-6 text-center">
      <p className="text-ink-2 mb-4">{children || t("common.signInTo")}</p>
      <Link to="/login" state={{ from: location.pathname }} className="btn btn-clay">{t("common.signIn")}</Link>
    </div>
  );
}
