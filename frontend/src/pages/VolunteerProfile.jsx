import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, MapPin, HandHeart } from "lucide-react";
import { AppContext } from "../context/AppContext";
import RescueCard from "../components/RescueCard";
import { Avatar, Empty, Loading, Points, SignInPrompt } from "../components/bits";
import { useLang } from "../context/LangContext";

const PRESETS = [50, 100, 250, 500];

function Donate({ volunteer, onDone }) {
  const { backendUrl, userData, checkAuthStatus } = useContext(AppContext);
  const { t, num, apiError } = useLang();
  const [amount, setAmount] = useState(100);
  const [sending, setSending] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    const points = Number(amount);
    if (!Number.isInteger(points) || points < 1) return toast.error(t("vol.whole"));
    if (points > userData.points) return toast.error(t("vol.notEnough"));
    setSending(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/volunteers/${volunteer._id}/donate`, { amount: points });
      onDone(data.updatedPoints);
      await checkAuthStatus();
      toast.success(t("vol.sent", { n: points, name: volunteer.name.split(" ")[0] }));
    } catch (err) {
      toast.error(apiError(err, "vol.fail"));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} className="mt-6 rounded-2xl bg-sunken p-4 text-left">
      <p className="font-semibold inline-flex items-center gap-2"><HandHeart size={18} aria-hidden="true" /> {t("vol.send")}</p>
      <p className="text-sm text-ink-2 mt-1">{t("vol.sendWhy", { points: `${num(userData.points)} ${t("common.points")}` })}</p>
      <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label={t("vol.amount")}>
        {PRESETS.map((p) => (
          <button key={p} type="button" className="chip justify-center !px-0" aria-pressed={Number(amount) === p} onClick={() => setAmount(p)}>{num(p)}</button>
        ))}
      </div>
      <label htmlFor="amount" className="label mt-3">{t("vol.typeAmount")}</label>
      <input id="amount" type="number" min="1" step="1" inputMode="numeric" value={amount}
        onChange={(e) => setAmount(e.target.value)} className="field" />
      <button type="submit" disabled={sending} className="btn btn-clay w-full mt-3">{sending ? t("vol.sending") : t("vol.sendBtn")}</button>
    </form>
  );
}

const VolunteerProfile = () => {
  const { id } = useParams();
  const { backendUrl, isLoggedIn, userData } = useContext(AppContext);
  const { t, area } = useLang();
  const [profile, setProfile] = useState(null);
  const [rescueImages, setRescueImages] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios.get(`${backendUrl}/api/volunteers/${id}?page=${currentPage}&limit=9`)
      .then(({ data }) => {
        setProfile(data.volunteer);
        // the profile route does not repeat who posted each photo, so add it for the cards
        setRescueImages(data.rescueImages.map((img) => ({ ...img, volunteer: { ...data.volunteer, role: "volunteer" } })));
        setTotalPages(data.totalPages);
        setError("");
      })
      .catch((err) => setError(err?.response?.status === 404 ? "missing" : "failed"));
  }, [id, currentPage, backendUrl]);

  if (error === "missing") {
    return <Empty title={t("vol.missing")} action={<Link to="/volunteers" className="btn btn-clay">{t("vol.seeAll")}</Link>}>{t("vol.missingText")}</Empty>;
  }
  if (error) return <Empty title={t("vol.loadFail")}>{t("vol.loadFailText")}</Empty>;
  if (!profile) return <Loading />;

  const isMe = userData?._id === profile._id;

  return (
    <>
      <Link to="/volunteers" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink font-medium mb-6">
        <ArrowLeft size={17} aria-hidden="true" /> {t("vol.back")}
      </Link>

      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <aside className="card p-6 text-center h-fit lg:sticky lg:top-6">
          <div className="mx-auto w-fit"><Avatar name={profile.name} size="w-24 h-24 text-3xl" /></div>
          <h1 className="mt-4 text-2xl font-semibold">{profile.name}</h1>
          <p className="text-ink-2 inline-flex items-center gap-1 mt-1"><MapPin size={15} aria-hidden="true" /> {profile.location ? area(profile.location) : t("common.areaNotSet")}</p>
          <p className="mt-4 whitespace-pre-line">{profile.bio || t("vols.noBio")}</p>
          <p className="mt-5 inline-block rounded-full bg-moss-lo text-moss-hi px-4 py-1.5"><Points value={profile.points} /></p>

          {isMe ? (
            <Link to="/profile" className="btn btn-line w-full mt-6">{t("vol.edit")}</Link>
          ) : isLoggedIn ? (
            <Donate volunteer={profile} onDone={(points) => setProfile((p) => ({ ...p, points }))} />
          ) : (
            <div className="mt-6"><SignInPrompt>{t("vol.signIn", { name: profile.name.split(" ")[0] })}</SignInPrompt></div>
          )}
        </aside>

        <section aria-labelledby="rescues-title">
          <h2 id="rescues-title" className="text-2xl font-semibold mb-8">{t("vol.posts")}</h2>
          {rescueImages.length === 0 ? (
            <p className="text-ink-2">{t("vol.noPosts")}</p>
          ) : (
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {rescueImages.map((p) => <RescueCard key={p._id} post={p} />)}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex justify-center items-center gap-2 mt-10" aria-label={t("vol.pages")}>
              <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1} className="btn btn-line">{t("vol.newer")}</button>
              <span className="px-3 text-ink-2">{t("vol.page", { n: currentPage, total: totalPages })}</span>
              <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages} className="btn btn-line">{t("vol.older")}</button>
            </nav>
          )}
        </section>
      </div>
    </>
  );
};

export default VolunteerProfile;
