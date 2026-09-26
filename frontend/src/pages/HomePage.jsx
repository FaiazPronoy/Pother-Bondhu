import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Camera, Stethoscope, Coins, ArrowRight, ShoppingBasket, HandHeart, Flag, MapPin, Check, X,
  Dog, Cat, Bird,
} from "lucide-react";
import { AppContext } from "../context/AppContext";
import { useLang } from "../context/LangContext";
import RescueCard from "../components/RescueCard";
import { Avatar, Points } from "../components/bits";

function useRescues(limit) {
  const { backendUrl } = useContext(AppContext);
  const [posts, setPosts] = useState(null);
  useEffect(() => {
    axios.get(`${backendUrl}/api/upload/rescue?limit=${limit}`)
      .then((r) => setPosts(r.data))
      .catch(() => setPosts([]));
  }, [backendUrl, limit]);
  return posts;
}

function RescueGrid({ posts, cols = "sm:grid-cols-2 lg:grid-cols-3" }) {
  const { t } = useLang();
  if (posts === null) {
    return (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton aspect-[4/5]" />)}
      </div>
    );
  }
  if (posts.length === 0) {
    return <p className="text-ink-2">{t("landing.boardEmpty")}</p>;
  }
  return (
    <div className={`grid gap-x-8 gap-y-10 ${cols}`}>
      {posts.map((p) => <RescueCard key={p._id} post={p} />)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* visitors                                                             */
/* ------------------------------------------------------------------ */

function Hero({ stats, latest, faces }) {
  const { t, lang, area, ago } = useLang();
  // Bangla words run wider and taller, so the headline steps down a size
  // Bangla's last line is short, so it can sit flush right; in English the
  // last line is the longest, so the steps are pushed in by a fixed indent
  const step = lang === "bn" ? "sm:text-right" : "sm:pl-[1.9em]";
  const size = lang === "bn"
    ? "text-[2.3rem] leading-[1.35] sm:text-5xl lg:text-[3.5rem]"
    : "text-[2.35rem] leading-[1.1] sm:text-5xl lg:text-[3.6rem]";
  return (
    <section className="paw-trail relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 lg:pt-16 lg:pb-24 grid gap-14 lg:grid-cols-[1.08fr_.92fr] items-center">
        <div className="rise flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* the motto stays in Bangla in both languages; it is the name's own voice */}
          <figure className="grid sm:grid-cols-[auto_auto] items-center justify-items-center sm:justify-items-start gap-x-3 gap-y-1.5 text-center sm:text-left">
            <span className="flex -space-x-2 sm:row-span-2" aria-hidden="true">
              <span className="w-9 h-9 rounded-full bg-clay text-on-clay grid place-items-center ring-[3px] ring-paper"><Dog size={18} /></span>
              <span className="w-9 h-9 rounded-full bg-moss text-on-clay grid place-items-center ring-[3px] ring-paper"><Cat size={18} /></span>
              <span className="w-9 h-9 rounded-full bg-sun text-[#2B2019] grid place-items-center ring-[3px] ring-paper"><Bird size={18} /></span>
            </span>
            <blockquote lang="bn" className="bn text-[1.3rem] sm:text-2xl leading-tight text-clay whitespace-nowrap">
              ওরা কথা বলতে পারে না, আমরা পারি।
            </blockquote>
            {lang === "en" && (
              <figcaption className="font-display italic text-ink-2 leading-snug">{t("landing.mottoGloss")}</figcaption>
            )}
          </figure>

          <h1 className={`mt-7 font-semibold sm:w-fit ${size}`}>
            {/* four lines that zigzag left, right, left, right, like steps */}
            {[...t("landing.title1").split("|"), t("landing.title2a"), t("landing.title2b")].map((line, i) => (
              <span key={line} className={`block ${i > 0 ? "mt-1" : ""} ${i % 2 ? step : ""} ${i > 1 ? "italic text-clay" : ""}`}>
                {i > 1 ? <span className="squiggle">{line}</span> : line}
              </span>
            ))}
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-ink-2 max-w-[34rem] text-pretty">{t("landing.lead")}</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link to="/login?mode=signup" className="btn btn-clay text-base px-6">
              {t("landing.join")} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/rescues" className="btn btn-line text-base px-6">{t("landing.board")}</Link>
          </div>

          {stats && faces.length > 0 && (
            <div className="mt-8 flex items-center gap-3">
              <span className="flex -space-x-2" aria-hidden="true">
                {faces.map((f, i) => (
                  <span key={f._id} className="ring-2 ring-paper rounded-full">
                    <Avatar name={f.name} size="w-9 h-9 text-xs" tone={["clay", "moss", "sun"][i % 3]} />
                  </span>
                ))}
              </span>
              <p className="text-sm font-semibold text-ink-2 text-left">{t("landing.already", { n: stats.volunteers })}</p>
            </div>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-md h-[27rem] sm:h-[32rem] rise-2">
          <div className="absolute inset-6 rounded-full bg-clay-lo/70 blur-2xl" aria-hidden="true" />
          <figure className="polaroid tape absolute left-0 bottom-6 w-[74%]" style={{ transform: "rotate(-4deg)" }} aria-hidden="true">
            <img src="/img/hero-hand.jpg" alt="" className="w-full aspect-[4/5] object-cover" />
            <figcaption className="font-display italic text-center py-3 text-lg">{t("landing.cap1")}</figcaption>
          </figure>
          <figure className="polaroid absolute right-0 top-0 w-[48%] z-10" style={{ transform: "rotate(5deg)" }} aria-hidden="true">
            <img src="/img/feeding.jpg" alt="" className="w-full aspect-square object-cover" />
            <figcaption className="font-display italic text-center py-2">{t("landing.cap2")}</figcaption>
          </figure>
          {latest && (
            <Link to="/rescues"
              className="absolute left-0 top-2 z-20 max-w-[15rem] card !rounded-2xl p-3 flex items-center gap-3 hover:border-line-2">
              <span className="relative flex w-3 h-3 shrink-0" aria-hidden="true">
                <span className="absolute inset-0 rounded-full bg-clay animate-ping opacity-60" />
                <span className="relative w-3 h-3 rounded-full bg-clay" />
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-xs font-bold uppercase tracking-wide text-clay">{t("landing.boardTitle")}</span>
                <span className="block text-sm font-semibold truncate">
                  <MapPin size={13} className="inline -mt-0.5" aria-hidden="true" /> {area(latest.area || latest.volunteer?.location || "Dhaka")} · {ago(latest.createdAt)}
                </span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Landing() {
  const { backendUrl } = useContext(AppContext);
  const { t, num, area } = useLang();
  const posts = useRescues(6);
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [faces, setFaces] = useState([]);

  useEffect(() => {
    axios.get(`${backendUrl}/api/stats`).then((r) => setStats(r.data)).catch(() => {});
    axios.get(`${backendUrl}/api/teams/all`).then((r) => setTeams(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${backendUrl}/api/volunteers/top?limit=4`).then((r) => setFaces(r.data)).catch(() => {});
  }, [backendUrl]);

  const steps = [
    { icon: Camera, img: "/img/waiting.jpg", title: "landing.s1Title", text: "landing.s1Text" },
    { icon: Stethoscope, img: "/img/vet.jpg", title: "landing.s2Title", text: "landing.s2Text" },
    { icon: Coins, img: "/img/feeding.jpg", title: "landing.s3Title", text: "landing.s3Text" },
  ];

  return (
    <>
      <Hero stats={stats} latest={posts?.[0]} faces={faces} />

      {/* numbers, counted from the database */}
      {stats && (
        <section aria-label={t("landing.statsLabel")} className="border-y border-line bg-card">
          <dl className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              [stats.rescues, "landing.statRescues"],
              [stats.volunteers, "landing.statVolunteers"],
              [stats.teams, "landing.statTeams"],
              [stats.donated, "landing.statDonated"],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="sr-only">{t(label)}</dt>
                <dd className="font-display text-4xl font-semibold text-clay tabular-nums">{num(n)}</dd>
                <dd className="text-ink-2 mt-1">{t(label)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* how it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="eyebrow">{t("landing.howEyebrow")}</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold text-balance">{t("landing.howTitle")}</h2>
        </div>
        <ol className="grid gap-10 md:grid-cols-3">
          {steps.map(({ icon: Icon, img, title, text }, i) => (
            <li key={title} className="text-center">
              <div className="relative mx-auto w-56">
                <img src={img} alt="" className="w-56 h-56 object-cover rounded-[42%_58%_55%_45%/48%_42%_58%_52%] shadow-lg" />
                <span className="absolute -bottom-2 -right-1 w-14 h-14 rounded-full bg-sun text-[#2B2019] grid place-items-center shadow">
                  <Icon size={24} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-6 text-sm font-bold text-clay">{t("landing.step", { n: i + 1 })}</p>
              <h3 className="mt-1 text-2xl font-semibold text-balance">{t(title)}</h3>
              <p className="mt-2 text-ink-2 max-w-xs mx-auto text-pretty">{t(text)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* the board */}
      <section className="bg-sunken/60 border-y border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 text-center sm:text-left">
            <div>
              <p className="eyebrow">{t("landing.boardEyebrow")}</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">{t("landing.boardTitle")}</h2>
            </div>
            <Link to="/rescues" className="btn btn-line self-center sm:self-auto">{t("landing.boardAll")} <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <RescueGrid posts={posts} />
        </div>
      </section>

      {/* teams */}
      {teams.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="eyebrow">{t("landing.teamsEyebrow")}</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">{t("landing.teamsTitle")}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {teams.map((team) => (
              <Link key={team._id} to={`/teams/${team._id}`} className="card p-6 hover:border-line-2 transition-colors">
                <span className={`tag ${team.category === "Medical" ? "tag-moss" : "tag-clay"}`}>{t(`teamType.${team.category}`)}</span>
                <h3 className="mt-3 text-xl font-semibold">{team.name}</h3>
                <p className="mt-1 text-ink-2 inline-flex items-center gap-1"><MapPin size={15} aria-hidden="true" /> {area(team.area || "Dhaka")}</p>
                {team.description && <p className="mt-3 text-ink-2 line-clamp-2">{team.description}</p>}
                <p className="mt-4 text-sm font-semibold">{t("common.members", { n: team.members?.length || 0 })}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* last word */}
      <section className="relative isolate overflow-hidden bg-[#1A1411]">
        <img src="/img/mother.jpg" alt="" className="absolute inset-0 -z-10 w-full h-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1A1411]/90 via-[#1A1411]/75 to-[#1A1411]/40" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center sm:text-left">
          <p className="font-display italic text-2xl text-[#FBE9C8]">{t("landing.endKicker")}</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-semibold text-[#FFF8F0] max-w-2xl text-balance">{t("landing.endTitle")}</h2>
          <p className="mt-4 text-lg text-[#EADBC8] max-w-xl text-pretty">{t("landing.endText")}</p>
          <Link to="/login?mode=signup" className="btn mt-8 bg-[#E9A23B] text-[#2B2019] hover:bg-[#F2B659] text-base px-6">
            {t("landing.endCta")} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* signed in                                                            */
/* ------------------------------------------------------------------ */

function greetingKey() {
  const h = new Date().getHours();
  if (h < 5) return "desk.late";
  if (h < 12) return "desk.morning";
  if (h < 17) return "desk.afternoon";
  return "desk.evening";
}

function Desk() {
  const { userData, backendUrl } = useContext(AppContext);
  const { t, apiError } = useLang();
  const posts = useRescues(6);
  const [myTeams, setMyTeams] = useState(null);
  const [invites, setInvites] = useState([]);
  const [top, setTop] = useState([]);
  const volunteer = userData.role === "volunteer";

  useEffect(() => {
    axios.get(`${backendUrl}/api/volunteers/top?limit=5`).then((r) => setTop(r.data)).catch(() => {});
    if (volunteer) {
      axios.get(`${backendUrl}/api/teams/my-teams`).then((r) => setMyTeams(r.data)).catch(() => setMyTeams([]));
      axios.get(`${backendUrl}/api/invites/me`).then((r) => setInvites(r.data)).catch(() => {});
    }
  }, [backendUrl, volunteer]);

  const answer = async (invite, status) => {
    try {
      await axios.patch(`${backendUrl}/api/invites/${invite._id}/respond`, { status });
      setInvites((list) => list.filter((i) => i._id !== invite._id));
      window.dispatchEvent(new Event("invites-changed"));
      if (status === "accepted") {
        toast.success(t("desk.joined", { team: invite.team?.name || "" }));
        const r = await axios.get(`${backendUrl}/api/teams/my-teams`);
        setMyTeams(r.data);
      }
    } catch (err) {
      toast.error(apiError(err, "desk.answerFail"));
    }
  };

  const actions = [
    { to: "/rescues#post", icon: Camera, title: "desk.postTitle", text: "desk.postText", tone: "bg-clay text-on-clay" },
    volunteer
      ? { to: "/createteam", icon: Flag, title: "desk.startTitle", text: "desk.startText", tone: "bg-moss text-on-clay" }
      : { to: "/profile", icon: HandHeart, title: "desk.becomeTitle", text: "desk.becomeText", tone: "bg-moss text-on-clay" },
    { to: "/volunteers", icon: Coins, title: "desk.supportTitle", text: "desk.supportText", tone: "bg-sun text-[#2B2019]" },
    { to: "/products", icon: ShoppingBasket, title: "desk.buyTitle", text: "desk.buyText", tone: "bg-ink text-paper" },
  ];

  return (
    <div className="space-y-10">
      <header className="rise relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-clay-lo/80 via-card to-sun-lo/70 px-6 py-8 sm:px-10 text-center sm:text-left paw-trail">
        <p className="font-display italic text-lg text-clay-hi">{t("desk.ask")}</p>
        <h1 className="mt-1 text-3xl sm:text-[2.6rem] font-semibold text-balance">{t(greetingKey(), { name: userData.name.split(" ")[0] })}</h1>
        <p className="mt-2 text-ink-2 text-lg text-balance">{t("desk.sub")}</p>
        <p lang="bn" className="bn mt-4 text-clay-hi hidden sm:block" aria-hidden="true">ওরা কথা বলতে পারে না, আমরা পারি।</p>
      </header>

      <nav aria-label={t("desk.quick")} className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 rise-2">
        {actions.map(({ to, icon: Icon, title, text, tone }) => (
          <Link key={title} to={to} className={`${tone} rounded-2xl p-4 sm:p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform`}>
            <Icon size={26} aria-hidden="true" />
            <span>
              <span className="block font-semibold text-lg leading-tight">{t(title)}</span>
              <span className="block text-sm opacity-90 mt-0.5">{t(text)}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-10 xl:grid-cols-[1fr_320px]">
        <section aria-labelledby="board-title">
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 id="board-title" className="text-2xl font-semibold">{t("desk.board")}</h2>
            <Link to="/rescues" className="text-clay font-semibold inline-flex items-center gap-1 hover:underline">
              {t("desk.allRescues")} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <RescueGrid posts={posts} cols="sm:grid-cols-2 2xl:grid-cols-3" />
        </section>

        <aside className="space-y-6">
          {volunteer && invites.length > 0 && (
            <section className="card p-5 border-clay/40" aria-labelledby="inv-title">
              <h2 id="inv-title" className="text-lg font-semibold">{t("desk.invited")}</h2>
              <ul className="mt-3 space-y-3">
                {invites.map((inv) => (
                  <li key={inv._id} className="rounded-xl bg-sunken p-3">
                    <p className="font-semibold">{inv.team?.name}</p>
                    <p className="text-sm text-ink-2">{t("desk.from", { name: inv.from?.name || "" })}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => answer(inv, "accepted")} className="btn btn-moss !min-h-9 !py-1 text-sm flex-1"><Check size={16} aria-hidden="true" /> {t("desk.join")}</button>
                      <button onClick={() => answer(inv, "rejected")} className="btn btn-line !min-h-9 !py-1 text-sm flex-1"><X size={16} aria-hidden="true" /> {t("desk.decline")}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {volunteer && (
            <section className="card p-5" aria-labelledby="teams-title">
              <div className="flex items-center justify-between">
                <h2 id="teams-title" className="text-lg font-semibold">{t("desk.yourTeams")}</h2>
                <Link to="/my-team" className="text-sm font-semibold text-clay hover:underline">{t("desk.manage")}</Link>
              </div>
              {myTeams === null ? (
                <div className="skeleton h-16 mt-3" />
              ) : myTeams.length === 0 ? (
                <p className="mt-2 text-ink-2">{t("desk.noTeam")} <Link to="/teams" className="text-clay font-semibold underline">{t("desk.findOne")}</Link> {t("desk.orStart")}</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {myTeams.map((team) => (
                    <li key={team._id}>
                      <Link to={`/teams/${team._id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-clay">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-sm text-ink-2 shrink-0">{t("common.members", { n: team.members.length })}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="card p-5" aria-labelledby="top-title">
            <h2 id="top-title" className="text-lg font-semibold">{t("desk.thank")}</h2>
            <p className="text-sm text-ink-2">{t("desk.thankSub")}</p>
            <ul className="mt-3 space-y-2">
              {top.map((v, i) => (
                <li key={v._id}>
                  <Link to={`/volunteers/${v._id}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-sunken">
                    <Avatar name={v.name} size="w-9 h-9 text-xs" tone={["clay", "moss", "sun"][i % 3]} />
                    <span className="flex-1 font-medium truncate">{v.name}</span>
                    <Points value={v.points} className="text-sm text-ink-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isLoggedIn, userData } = useContext(AppContext);
  return isLoggedIn && userData ? <Desk /> : <Landing />;
}
