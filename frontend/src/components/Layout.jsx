import { useContext, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  HeartHandshake, Camera, Users, HandHeart, Flag, Mail, ShoppingBasket, ShoppingCart,
  LogOut, Moon, Sun, Menu, X, Wallet, LayoutDashboard,
} from "lucide-react";
import { AppContext } from "../context/AppContext";
import { DarkmodeContext } from "../context/DarkmodeContext";
import { Wordmark, Avatar, Points, LangButton } from "./bits";
import { useLang } from "../context/LangContext";

function ThemeButton({ className = "" }) {
  const { isDarkMode, toggleDarkMode } = useContext(DarkmodeContext);
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className={`w-11 h-11 grid place-items-center rounded-full text-ink-2 hover:text-ink hover:bg-sunken ${className}`}
      aria-label={isDarkMode ? t("common.toLight") : t("common.toDark")}
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

function CartLink({ className = "" }) {
  const { cart } = useContext(AppContext);
  const { t, num } = useLang();
  const count = cart.reduce((n, i) => n + i.quantity, 0);
  return (
    <Link to="/cart" className={`relative w-11 h-11 grid place-items-center rounded-full hover:bg-sunken ${className}`}
      aria-label={t("common.cartItems", { n: count })}>
      <ShoppingCart size={21} />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-5 h-5 px-1 rounded-full bg-clay text-on-clay text-[11px] font-bold grid place-items-center">
          {num(count)}
        </span>
      )}
    </Link>
  );
}

/* ---------------- signed in: the sidebar ---------------- */

function SideNav({ invites, onNavigate }) {
  const { userData, cart, logout } = useContext(AppContext);
  const { t, num } = useLang();
  const navigate = useNavigate();
  const volunteer = userData.role === "volunteer";
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0);

  const items = [
    { to: "/", label: t("nav.desk"), icon: HeartHandshake, end: true },
    { to: "/rescues", label: t("nav.rescues"), icon: Camera },
    { to: "/teams", label: t("nav.teams"), icon: Users },
    { to: "/volunteers", label: t("nav.volunteers"), icon: HandHeart },
    volunteer && { to: "/my-team", label: t("nav.myTeams"), icon: Flag },
    volunteer && { to: "/team-invitations", label: t("nav.invitations"), icon: Mail, count: invites },
    { to: "/products", label: t("nav.shop"), icon: ShoppingBasket },
    { to: "/cart", label: t("common.cart"), icon: ShoppingCart, count: cartCount },
    userData.role === "admin" && { to: "/admindashboard", label: t("nav.admin"), icon: LayoutDashboard },
  ].filter(Boolean);

  const signOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full">
      <nav aria-label={t("nav.main")} className="flex-1 space-y-1">
        {items.map(({ to, label, icon: Icon, end, count }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 min-h-11 px-3 rounded-xl font-medium transition-colors ${
                isActive ? "bg-ink text-paper" : "text-ink-2 hover:text-ink hover:bg-sunken"
              }`
            }
          >
            <Icon size={19} aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {count > 0 && (
              <span className="min-w-6 h-6 px-1.5 rounded-full bg-clay text-on-clay text-xs font-bold grid place-items-center">
                {num(count)}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl bg-moss text-on-clay p-4">
        <p className="text-sm opacity-90 flex items-center gap-2"><Wallet size={16} aria-hidden="true" /> {t("nav.wallet")}</p>
        <p className="text-2xl font-display mt-1"><Points value={userData.points} /></p>
        <Link to="/profile?tab=wallet" onClick={onNavigate}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
          {t("nav.topUp")}
        </Link>
      </div>

      <LangButton className="mt-3 self-start" />

      <div className="mt-3 flex items-center gap-2 border-t border-line pt-4">
        <Link to="/profile" onClick={onNavigate} className="flex items-center gap-3 flex-1 min-w-0 rounded-xl p-1 hover:bg-sunken">
          <Avatar name={userData.name} />
          <span className="min-w-0">
            <span className="block font-semibold truncate">{userData.name}</span>
            <span className="block text-sm text-ink-2">{t(`role.${userData.role}`)}</span>
          </span>
        </Link>
        <ThemeButton />
        <button type="button" onClick={signOut} aria-label={t("common.signOut")}
          className="w-11 h-11 grid place-items-center rounded-full text-ink-2 hover:text-danger hover:bg-sunken">
          <LogOut size={19} />
        </button>
      </div>
    </div>
  );
}

function MemberShell({ children }) {
  const { userData, backendUrl } = useContext(AppContext);
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState(0);
  const location = useLocation();

  // count waiting invitations for the badge; refreshed on each page change
  // pages that answer an invitation fire "invites-changed" so the badge drops at once
  useEffect(() => {
    if (userData.role !== "volunteer") return;
    const count = () => axios.get(`${backendUrl}/api/invites/me`)
      .then((r) => setInvites(Array.isArray(r.data) ? r.data.length : 0))
      .catch(() => {});
    count();
    window.addEventListener("invites-changed", count);
    return () => window.removeEventListener("invites-changed", count);
  }, [location.pathname, userData.role, backendUrl]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="hidden lg:flex flex-col sticky top-0 h-screen border-r border-line bg-card px-4 py-6 overflow-y-auto">
        <Link to="/" className="px-2 mb-8"><Wordmark /></Link>
        <SideNav invites={invites} />
      </aside>

      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 px-4 h-16 bg-card/95 backdrop-blur border-b border-line">
        <button type="button" onClick={() => setOpen(true)} aria-label={t("common.openMenu")} aria-expanded={open}
          className="w-11 h-11 -ml-2 grid place-items-center rounded-full hover:bg-sunken">
          <Menu size={22} />
        </button>
        <Link to="/" className="flex-1"><Wordmark size="text-xl" /></Link>
        <LangButton className="!px-2" />
        <CartLink />
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("common.menu")}>
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-80 bg-card px-4 py-5 overflow-y-auto rise">
            <div className="flex items-center justify-between mb-6">
              <Wordmark size="text-xl" />
              <button type="button" onClick={() => setOpen(false)} aria-label={t("common.closeMenu")}
                className="w-11 h-11 grid place-items-center rounded-full hover:bg-sunken">
                <X size={22} />
              </button>
            </div>
            <SideNav invites={invites} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex flex-col">
        <main id="main" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
          {children}
        </main>
        <Footer compact />
      </div>
    </div>
  );
}

/* ---------------- visitors: a plain header ---------------- */

const publicLinks = [
  { to: "/rescues", key: "nav.rescues" },
  { to: "/teams", key: "nav.teams" },
  { to: "/volunteers", key: "nav.volunteers" },
  { to: "/products", key: "nav.shop" },
];

function VisitorShell({ children, wide }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-full font-medium ${isActive ? "text-clay" : "text-ink-2 hover:text-ink"}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-2">
          <Link to="/" className="mr-auto"><Wordmark size="text-xl sm:text-2xl" /></Link>
          <nav aria-label={t("nav.main")} className="hidden lg:flex items-center gap-1">
            {publicLinks.map((l) => <NavLink key={l.to} to={l.to} className={linkClass}>{t(l.key)}</NavLink>)}
          </nav>
          <LangButton className="!px-2 sm:!px-3" />
          <ThemeButton className="hidden sm:grid" />
          <CartLink />
          <Link to="/login" className="btn btn-clay hidden sm:inline-flex">{t("common.signIn")}</Link>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? t("common.closeMenu") : t("common.openMenu")} aria-expanded={open}
            className="lg:hidden w-11 h-11 grid place-items-center rounded-full hover:bg-sunken -mr-2">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {open && (
          <nav aria-label={t("nav.main")} className="lg:hidden border-t border-line px-4 py-3 flex flex-col gap-1 bg-paper">
            {publicLinks.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={linkClass}>{t(l.key)}</NavLink>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)} className="btn btn-clay flex-1">{t("common.signIn")}</Link>
              <ThemeButton />
            </div>
          </nav>
        )}
      </header>
      <main id="main" className={`flex-1 w-full ${wide ? "" : "max-w-6xl mx-auto px-4 sm:px-6 py-10"}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Footer({ compact }) {
  const { t } = useLang();
  return (
    <footer className={`border-t border-line ${compact ? "" : "bg-card"}`}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 ${compact ? "py-6" : "py-10"} flex flex-col gap-6 md:flex-row md:items-start md:justify-between`}>
        {!compact && (
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-3 text-ink-2">{t("footer.blurb")}</p>
            <p lang="bn" className="mt-2 bn text-lg text-clay">ওরা কথা বলতে পারে না, আমরা পারি।</p>
          </div>
        )}
        <nav aria-label={t("nav.footer")} className="flex flex-wrap gap-x-6 gap-y-2 text-ink-2">
          {publicLinks.map((l) => <Link key={l.to} to={l.to} className="hover:text-ink">{t(l.key)}</Link>)}
        </nav>
        <p className="text-sm text-ink-2">
          © {new Date().getFullYear()} CholoBachai · {t("footer.photos")}{" "}
          <a href="https://unsplash.com" className="underline underline-offset-2 hover:text-ink" rel="noreferrer" target="_blank">Unsplash</a>
        </p>
      </div>
    </footer>
  );
}

// the landing page runs edge to edge; every other page sits in the column
export default function Layout() {
  const { isLoggedIn, userData } = useContext(AppContext);
  const location = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  if (isLoggedIn && userData) {
    return <MemberShell><Outlet /></MemberShell>;
  }
  return (
    <VisitorShell wide={location.pathname === "/"}>
      <Outlet />
    </VisitorShell>
  );
}
