import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Camera, Users, Stethoscope, Coins, ArrowRight, ShoppingBasket, HandHeart, Flag, MapPin, Check, X } from "lucide-react";
import { AppContext } from "../context/AppContext";
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
  if (posts === null) {
    return (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton aspect-[4/5]" />)}
      </div>
    );
  }
  if (posts.length === 0) {
    return <p className="text-ink-2">Nothing on the board yet. The first photo could be yours.</p>;
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

function Landing() {
  const { backendUrl } = useContext(AppContext);
  const posts = useRescues(6);
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    axios.get(`${backendUrl}/api/stats`).then((r) => setStats(r.data)).catch(() => {});
    axios.get(`${backendUrl}/api/teams/all`).then((r) => setTeams(r.data.slice(0, 3))).catch(() => {});
  }, [backendUrl]);

  const steps = [
    {
      icon: Camera, img: "/img/waiting.jpg", title: "See one. Snap one.",
      text: "A photo and a line about where you saw them is enough. It goes straight onto the rescue board for everyone nearby.",
    },
    {
      icon: Stethoscope, img: "/img/vet.jpg", title: "A team nearby picks it up.",
      text: "Teams are people from the same area: feeders, night drivers, vet students. They go, they help, and they post how it went.",
    },
    {
      icon: Coins, img: "/img/feeding.jpg", title: "Chip in when you can.",
      text: "Top up PetPoints, send some to a volunteer who has been out every night this week, or add a little for rescues when you buy supplies.",
    },
  ];

  return (
    <>
      {/* hero */}
      <section className="paw-trail">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-20 lg:pb-24 grid gap-12 lg:grid-cols-[1.1fr_.9fr] items-center">
          <div className="rise text-center lg:text-left">
            <p className="bn text-xl sm:text-2xl text-clay">ওরা কথা বলতে পারে না, আমরা পারি।</p>
            <h1 className="mt-4 text-[2.5rem] leading-[1.08] sm:text-6xl font-semibold">
              The dog by your gate doesn't need a miracle. Just a <span className="squiggle italic">neighbour</span>.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-ink-2 max-w-xl mx-auto lg:mx-0">
              Spot an animal that's hurt, hungry or scared? Post a photo. Volunteers in your area see it,
              and a team close by goes to help.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/login?mode=signup" className="btn btn-clay text-base px-6">Join StrayBachao <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link to="/rescues" className="btn btn-line text-base px-6">See the rescue board</Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md h-[27rem] sm:h-[32rem] rise-2" aria-hidden="true">
            <figure className="polaroid tape absolute left-0 bottom-0 w-[74%]" style={{ transform: "rotate(-4deg)" }}>
              <img src="/img/hero-hand.jpg" alt="" className="w-full aspect-[4/5] object-cover" />
              <figcaption className="font-display italic text-center py-3 text-lg">a little trust, finally</figcaption>
            </figure>
            <figure className="polaroid absolute right-0 top-0 w-[48%] z-10" style={{ transform: "rotate(5deg)" }}>
              <img src="/img/feeding.jpg" alt="" className="w-full aspect-square object-cover" />
              <figcaption className="font-display italic text-center py-2">dinner, 9 pm</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* numbers, counted from the database */}
      {stats && (
        <section aria-label="StrayBachao so far" className="border-y border-line bg-card">
          <dl className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              [stats.rescues, "rescues posted"],
              [stats.volunteers, "volunteers"],
              [stats.teams, "teams across Dhaka"],
              [stats.donated, "PetPoints given to rescues"],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-4xl font-semibold text-clay tabular-nums">{Number(n).toLocaleString("en-IN")}</dd>
                <dd className="text-ink-2 mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* how it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">Three small things, done by a lot of people</h2>
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
              <p className="mt-6 text-sm font-bold text-clay">Step {i + 1}</p>
              <h3 className="mt-1 text-2xl font-semibold">{title}</h3>
              <p className="mt-2 text-ink-2 max-w-xs mx-auto">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* the board */}
      <section className="bg-sunken/60 border-y border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 text-center sm:text-left">
            <div>
              <p className="eyebrow">On the board</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">Posted lately</h2>
            </div>
            <Link to="/rescues" className="btn btn-line self-center sm:self-auto">See every rescue <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <RescueGrid posts={posts} />
        </div>
      </section>

      {/* teams */}
      {teams.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="eyebrow">Teams</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">There's probably one near you</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {teams.map((t) => (
              <Link key={t._id} to={`/teams/${t._id}`} className="card p-6 hover:border-line-2 transition-colors">
                <span className={`tag ${t.category === "Medical" ? "tag-moss" : "tag-clay"}`}>{t.category}</span>
                <h3 className="mt-3 text-xl font-semibold">{t.name}</h3>
                <p className="mt-1 text-ink-2 inline-flex items-center gap-1"><MapPin size={15} aria-hidden="true" /> {t.area || "Dhaka"}</p>
                {t.description && <p className="mt-3 text-ink-2 line-clamp-2">{t.description}</p>}
                <p className="mt-4 text-sm font-semibold">{t.members?.length || 0} member{t.members?.length === 1 ? "" : "s"}</p>
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
          <p className="bn text-2xl text-[#FBE9C8]">একটু মায়া, অনেকখানি পথ।</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-semibold text-[#FFF8F0] max-w-2xl">
            Be the reason one of them gets through the monsoon.
          </h2>
          <p className="mt-4 text-lg text-[#EADBC8] max-w-xl">
            You don't need a car or a clinic. Most of what volunteers do is show up with food, water and a bit of patience.
          </p>
          <Link to="/login?mode=signup" className="btn mt-8 bg-[#E9A23B] text-[#2B2019] hover:bg-[#F2B659] text-base px-6">
            Become a volunteer <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* signed in                                                            */
/* ------------------------------------------------------------------ */

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Desk() {
  const { userData, backendUrl } = useContext(AppContext);
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
        toast.success(`You're in ${invite.team?.name || "the team"} now`);
        const r = await axios.get(`${backendUrl}/api/teams/my-teams`);
        setMyTeams(r.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not answer that invitation");
    }
  };

  const actions = [
    { to: "/rescues#post", icon: Camera, title: "Post a rescue", text: "Add a photo to the board", tone: "bg-clay text-on-clay" },
    volunteer
      ? { to: "/createteam", icon: Flag, title: "Start a team", text: "Gather people in your area", tone: "bg-moss text-on-clay" }
      : { to: "/profile", icon: HandHeart, title: "Become a volunteer", text: "Switch in your profile", tone: "bg-moss text-on-clay" },
    { to: "/volunteers", icon: Coins, title: "Support a volunteer", text: "Send them PetPoints", tone: "bg-sun text-[#2B2019]" },
    { to: "/products", icon: ShoppingBasket, title: "Buy supplies", text: "Food, bowls, bedding", tone: "bg-ink text-paper" },
  ];

  return (
    <div className="space-y-10">
      <header className="rise">
        <p className="bn text-lg text-clay">আজ কার খোঁজ নেবেন?</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold">{greeting()}, {userData.name.split(" ")[0]}</h1>
        <p className="mt-2 text-ink-2 text-lg">Here's what's happening on the street today.</p>
      </header>

      <nav aria-label="Quick actions" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 rise-2">
        {actions.map(({ to, icon: Icon, title, text, tone }) => (
          <Link key={title} to={to} className={`${tone} rounded-2xl p-4 sm:p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform`}>
            <Icon size={26} aria-hidden="true" />
            <span>
              <span className="block font-semibold text-lg leading-tight">{title}</span>
              <span className="block text-sm opacity-90 mt-0.5">{text}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-10 xl:grid-cols-[1fr_320px]">
        <section aria-labelledby="board-title">
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 id="board-title" className="text-2xl font-semibold">On the board</h2>
            <Link to="/rescues" className="text-clay font-semibold inline-flex items-center gap-1 hover:underline">
              All rescues <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <RescueGrid posts={posts} cols="sm:grid-cols-2 2xl:grid-cols-3" />
        </section>

        <aside className="space-y-6">
          {volunteer && invites.length > 0 && (
            <section className="card p-5 border-clay/40" aria-labelledby="inv-title">
              <h2 id="inv-title" className="text-lg font-semibold">You've been invited</h2>
              <ul className="mt-3 space-y-3">
                {invites.map((inv) => (
                  <li key={inv._id} className="rounded-xl bg-sunken p-3">
                    <p className="font-semibold">{inv.team?.name}</p>
                    <p className="text-sm text-ink-2">from {inv.from?.name}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => answer(inv, "accepted")} className="btn btn-moss !min-h-9 !py-1 text-sm flex-1"><Check size={16} aria-hidden="true" /> Join</button>
                      <button onClick={() => answer(inv, "rejected")} className="btn btn-line !min-h-9 !py-1 text-sm flex-1"><X size={16} aria-hidden="true" /> Decline</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {volunteer && (
            <section className="card p-5" aria-labelledby="teams-title">
              <div className="flex items-center justify-between">
                <h2 id="teams-title" className="text-lg font-semibold">Your teams</h2>
                <Link to="/my-team" className="text-sm font-semibold text-clay hover:underline">Manage</Link>
              </div>
              {myTeams === null ? (
                <div className="skeleton h-16 mt-3" />
              ) : myTeams.length === 0 ? (
                <p className="mt-2 text-ink-2">You're not in a team yet. <Link to="/teams" className="text-clay font-semibold underline">Find one</Link> or start your own.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {myTeams.map((t) => (
                    <li key={t._id}>
                      <Link to={`/teams/${t._id}`} className="flex items-center justify-between py-2.5 hover:text-clay">
                        <span className="font-medium">{t.name}</span>
                        <span className="text-sm text-ink-2">{t.members.length} <Users size={14} className="inline" aria-label="members" /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="card p-5" aria-labelledby="top-title">
            <h2 id="top-title" className="text-lg font-semibold">Volunteers to thank</h2>
            <p className="text-sm text-ink-2">The ones with the most PetPoints right now.</p>
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
