import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, PawPrint } from "lucide-react";

// areas the teams and volunteers are spread across; used by every picker
export const AREAS = [
  "Badda", "Banani", "Bashundhara", "Dhanmondi", "Gulshan", "Mirpur",
  "Moghbazar", "Mohammadpur", "Puran Dhaka", "Uttara",
];

export function Wordmark({ className = "", size = "text-2xl" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/paw-heart.svg" alt="" className="w-9 h-9 shrink-0" />
      <span className={`font-display font-semibold tracking-tight leading-none ${size}`}>
        <span className="italic font-normal">Stray</span>
        <span className="text-clay">Bachao</span>
      </span>
    </span>
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

export function PageHeader({ eyebrow, title, children, action }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl sm:text-4xl font-semibold">{title}</h1>
        {children && <p className="mt-3 text-ink-2 text-lg">{children}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="card p-10 text-center">
      <PawPrint className="mx-auto mb-3 text-line-2" size={40} aria-hidden="true" />
      <h3 className="text-xl font-semibold">{title}</h3>
      {children && <p className="mt-2 text-ink-2 max-w-md mx-auto">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Loading({ rows = 3 }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-24" />
      ))}
    </div>
  );
}

export function PasswordField({ id, label, value, onChange, autoComplete = "current-password", name = "password", hint }) {
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
          aria-label={shown ? "Hide password" : "Show password"}
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
  return (
    <span className={`inline-flex items-baseline gap-1 font-semibold tabular-nums ${className}`}>
      {Number(value || 0).toLocaleString("en-IN")}
      <span className="text-[.8em] font-medium opacity-80">PetPoints</span>
    </span>
  );
}

export function timeAgo(date) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(date)) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function SignInPrompt({ children = "Sign in to do this." }) {
  const location = useLocation();
  return (
    <div className="card p-6 text-center">
      <p className="text-ink-2 mb-4">{children}</p>
      <Link to="/login" state={{ from: location.pathname }} className="btn btn-clay">Sign in</Link>
    </div>
  );
}
