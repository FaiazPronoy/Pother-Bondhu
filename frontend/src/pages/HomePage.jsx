import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Camera, Check, X } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { useLang } from "../context/LangContext";
import RescueCard, { StatusTag, STATUSES } from "../components/RescueCard";
import { AREAS, Avatar, Points } from "../components/bits";

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

const whereOf = (p) => p.area || p.volunteer?.location;
const open = (p) => (p.status || "urgent") !== "resolved";

function CaseGrid({ posts, empty, cols = "sm:grid-cols-2 lg:grid-cols-3" }) {
  if (posts === null) {
    return (
      <div className={`grid gap-5 ${cols}`}>
        {[0, 1, 2].map((i) => <div key={i} className="skeleton aspect-[4/5]" />)}
      </div>
    );
  }
  if (posts.length === 0) return <p className="text-ink-2">{empty}</p>;
  return (
    <div className={`grid gap-5 ${cols}`}>
      {posts.map((p) => <RescueCard key={p._id} post={p} />)}
    </div>
  );
}

function Hero() {
  const { t, lang } = useLang();
  const size = lang === "bn"
    ? "text-[2.2rem] leading-[1.35] sm:text-5xl lg:text-[3.4rem]"
    : "text-[2.3rem] leading-[1.08] sm:text-5xl lg:text-[3.6rem]";
  const lines = [...t("landing.title1").split("|"), t("landing.title2a"), t("landing.title2b")];
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-14 lg:pt-16 lg:pb-24 grid gap-12 lg:grid-cols-[1.1fr_.9fr] items-center">
      {/* centred on phones and tablets, left aligned beside the photos on desktop */}
      <div className="text-center lg:text-left">
        <figure className="m-0">
          <blockquote lang="bn" className="bn !text-center lg:!text-left text-[clamp(1.3rem,6.2vw,2rem)] leading-snug text-clay">
            ওরা কথা বলতে পারে না, আমরা পারি।
          </blockquote>
          {lang === "en" && (
            <figcaption className="mt-1 text-ink-2 !text-center lg:!text-left">{t("landing.mottoGloss")}</figcaption>
          )}
        </figure>

        {/* the staircase: on a phone the lines step left and right around the centre, on desktop they step in from the left */}
        <h1 className={`mt-6 font-semibold tracking-[-0.02em] ${size}`}>
          {lines.map((line, i) => (
            <span key={line} className={`block ${i % 2 ? "pl-[1.3em] lg:pl-[1.6em]" : "pr-[1.3em] lg:pr-0"} ${i > 1 ? "font-normal" : "font-bold"}`}>{line}</span>
          ))}
        </h1>

        <p className="mt-6 mx-auto lg:mx-0 text-lg sm:text-xl text-ink-2 max-w-[34rem] !text-center lg:!text-justify">{t("landing.lead")}</p>

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3">
          <Link to="/rescues#post" className="btn btn-clay btn-pill min-h-14 px-7 text-[1.06rem]">
            <Camera size={21} aria-hidden="true" /> {t("landing.report")}
          </Link>
          <Link to="/login?mode=signup" className="btn btn-line btn-pill min-h-14 px-7 text-[1.06rem]">
            {t("landing.join")}
          </Link>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-md h-[22rem] sm:h-[29rem]" aria-hidden="true">
        <figure className="print left-0 bottom-0 w-[72%] -rotate-2">
          <img src="/img/hero-hand.jpg" alt="" className="aspect-[4/5]" />
        </figure>
        <figure className="print right-0 top-0 w-[50%] rotate-2">
          <img src="/img/feeding.jpg" alt="" className="aspect-square" />
        </figure>
      </div>
    </section>
  );
}

function Landing() {
  const { t } = useLang();
  const posts = useRescues(12);
  const needing = posts && posts.filter(open).slice(0, 3);

  const steps = [
    { title: "landing.s1Title", text: "landing.s1Text" },
    { title: "landing.s2Title", text: "landing.s2Text" },
    { title: "landing.s3Title", text: "landing.s3Text" },
  ];

  return (
    <>
      <Hero />

      {/* one photo of a vet visit beside the real sequence, read top to bottom like a notice */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16 items-center">
          <img src="/img/vet.jpg" alt="" className="w-full aspect-[4/3] lg:aspect-[4/5] object-cover rounded-[4px]" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold">{t("landing.howEyebrow")}</h2>
            <ol className="mt-6 border-t-2 border-ink">
              {steps.map(({ title, text }, i) => (
                <li key={title} className="grid grid-cols-[3rem_1fr] gap-x-4 py-5 border-b border-line">
                  <span className="font-display text-4xl font-bold leading-none text-clay tabular-nums" aria-hidden="true">{i + 1}</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold">{t(title)}</h3>
                    <p className="mt-1 text-ink-2">{t(text)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h2 className="text-3xl sm:text-4xl font-semibold">{t("desk.needAll")}</h2>
            <Link to="/rescues" className="shrink-0 min-h-11 inline-flex items-center font-semibold text-clay underline underline-offset-4">
              {t("desk.allRescues")}
            </Link>
          </div>
          <CaseGrid posts={needing} empty={t("landing.boardEmpty")} />
        </div>
      </section>
    </>
  );
}

function Desk() {
  const { userData, backendUrl } = useContext(AppContext);
  const { t, lang, area, ago, apiError } = useLang();
  const stop = lang === "bn" ? "।" : ".";
  const posts = useRescues(24);
  const [myTeams, setMyTeams] = useState(null);
  const [invites, setInvites] = useState([]);
  const [top, setTop] = useState([]);
  const volunteer = userData.role === "volunteer";
  const home = AREAS.includes(userData.location) ? userData.location : null;

  useEffect(() => {
    axios.get(`${backendUrl}/api/volunteers/top?limit=5`).then((r) => setTop(r.data)).catch(() => {});
    if (volunteer) {
      axios.get(`${backendUrl}/api/teams/my-teams`).then((r) => setMyTeams(r.data)).catch(() => setMyTeams([]));
      axios.get(`${backendUrl}/api/invites/me`).then((r) => setInvites(r.data)).catch(() => {});
    }
  }, [backendUrl, volunteer]);

  // open cases, the user's own area first, then by how pressing they are, then newest
  const near = useMemo(() => {
    if (!posts) return null;
    const rank = (p) => STATUSES.indexOf(p.status || "urgent");
    return posts.filter(open).sort((a, b) =>
      (whereOf(b) === home) - (whereOf(a) === home) || rank(a) - rank(b) || new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 6);
  }, [posts, home]);
  const mine = useMemo(() => (posts || []).filter((p) => p.volunteer?._id === userData._id), [posts, userData._id]);

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

  const panel = "pt-6 mt-6 border-t border-line first:mt-0 first:pt-0 first:border-0";

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_300px] xl:gap-12">
      <section aria-labelledby="near-title">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 mb-6">
          <div>
            <h1 id="near-title" className="text-[1.9rem] sm:text-[2.3rem] font-semibold">{t(home ? "desk.needNear" : "desk.needAll")}</h1>
            {home && <p className="mt-1 text-ink-2 !text-left">{t("desk.nearNote", { area: area(home) })}</p>}
          </div>
          <Link to="/rescues" className="min-h-11 inline-flex items-center font-semibold text-clay underline underline-offset-4">
            {t("desk.allRescues")}
          </Link>
        </div>
        <CaseGrid posts={near} empty={t("desk.allClear")} cols="sm:grid-cols-2 2xl:grid-cols-3" />
      </section>

      <aside>
        <section className={panel} aria-labelledby="mine-title">
          <h2 id="mine-title" className="text-xl font-semibold">{t("desk.mine")}</h2>
          {mine.length === 0 ? (
            <p className="mt-2 text-ink-2">{t("desk.mineEmpty")}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {mine.slice(0, 4).map((p) => (
                <li key={p._id} className="grid grid-cols-[56px_1fr] gap-3 items-center !text-left">
                  <img src={`${backendUrl}${p.imageUrl}`} alt="" className="w-14 h-14 rounded-lg object-cover bg-sunken" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate !text-left">{p.caption || area(whereOf(p) || "Dhaka")}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-2 !text-left">
                      <StatusTag status={p.status || "urgent"} /> {ago(p.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {volunteer && invites.length > 0 && (
          <section className={panel} aria-labelledby="inv-title">
            <h2 id="inv-title" className="text-xl font-semibold">{t("desk.invited")}</h2>
            <ul className="mt-3 space-y-3">
              {invites.map((inv) => (
                <li key={inv._id} className="rounded-[6px] bg-clay-lo p-3.5 !text-left">
                  <p className="!text-left"><span className="font-semibold">{inv.team?.name}</span>, <span className="text-ink-2">{t("desk.from", { name: inv.from?.name || "" })}</span></p>
                  <div className="mt-2.5 flex gap-2">
                    <button onClick={() => answer(inv, "accepted")} className="btn btn-moss flex-1"><Check size={16} aria-hidden="true" /> {t("desk.join")}</button>
                    <button onClick={() => answer(inv, "rejected")} className="btn btn-line flex-1"><X size={16} aria-hidden="true" /> {t("desk.decline")}</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {volunteer && (
          <section className={panel} aria-labelledby="teams-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="teams-title" className="text-xl font-semibold">{t("desk.yourTeams")}</h2>
              <Link to="/my-team" className="min-h-11 inline-flex items-center text-sm font-semibold text-clay underline underline-offset-4">{t("desk.manage")}</Link>
            </div>
            {myTeams === null ? (
              <div className="skeleton h-12 mt-2" />
            ) : myTeams.length === 0 ? (
              <p className="mt-1 text-ink-2">
                {t("desk.noTeam")} <Link to="/teams" className="text-clay font-semibold underline">{t("desk.findOne")}</Link>{" "}
                <Link to="/createteam" className="underline">{t("desk.orStart")}</Link>
              </p>
            ) : (
              <ul className="divide-y divide-line">
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

        <section className={panel} aria-labelledby="support-title">
          <h2 id="support-title" className="text-xl font-semibold">{t("desk.support")}</h2>
          <p className="mt-2 text-ink-2 !text-left">
            {t("desk.youHave")} <Points value={userData.points} className="text-ink" />{stop}{" "}
            <Link to="/volunteers" className="font-semibold text-ink underline underline-offset-2">{t("desk.sendPoints")}</Link>{" "}
            {t("desk.or")}{" "}
            <Link to="/products" className="font-semibold text-ink underline underline-offset-2">{t("desk.buySupplies")}</Link>{stop}
          </p>
          {!volunteer && (
            <p className="mt-2 !text-left"><Link to="/profile" className="font-semibold text-clay underline underline-offset-2">{t("desk.becomeTitle")}</Link></p>
          )}
          {top.length > 0 && (
            <>
              <h3 className="mt-5 font-sans text-base font-semibold">{t("desk.thank")}</h3>
              <ul className="mt-2 space-y-1">
                {top.map((v, i) => (
                  <li key={v._id}>
                    <Link to={`/volunteers/${v._id}`} className="flex items-center gap-3 rounded-[4px] p-1.5 -mx-1.5 hover:bg-sunken">
                      <Avatar name={v.name} size="w-8 h-8 text-xs" tone={["clay", "moss", "sun"][i % 3]} />
                      <span className="flex-1 font-medium truncate">{v.name}</span>
                      <Points value={v.points} className="text-sm text-ink-2" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </aside>
    </div>
  );
}

export default function HomePage() {
  const { isLoggedIn, userData } = useContext(AppContext);
  return isLoggedIn && userData ? <Desk /> : <Landing />;
}
