import { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, MapPin, Send, UserPlus } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { Avatar, Empty, Loading, timeAgo } from "../components/bits";

export default function TeamDetails() {
  const { key } = useParams();
  const { backendUrl, userData } = useContext(AppContext);
  const [team, setTeam] = useState(null);
  const [err, setErr] = useState("");
  const [update, setUpdate] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTeam(null);
    setErr("");
    axios.get(`${backendUrl}/api/teams/${encodeURIComponent(key)}`)
      .then((r) => !cancelled && setTeam(r.data.team))
      .catch((e) => !cancelled && setErr(e?.response?.status === 404 ? "missing" : "failed"));
    return () => { cancelled = true; };
  }, [key, backendUrl]);

  if (err === "missing") {
    return <Empty title="We couldn't find that team" action={<Link to="/teams" className="btn btn-clay">See all teams</Link>}>It may have been removed, or the link is wrong.</Empty>;
  }
  if (err) return <Empty title="Couldn't load this team">Check your connection and try again.</Empty>;
  if (!team) return <Loading />;

  const me = userData?._id;
  const isMember = !!me && team.members.some((m) => m._id === me);
  const isCreator = !!me && team.creator?._id === me;
  const activities = [...(team.activities || [])].reverse();

  const post = async (e) => {
    e.preventDefault();
    const message = update.trim();
    if (!message) return;
    setPosting(true);
    try {
      const r = await axios.post(`${backendUrl}/api/teams/${team._id}/activity`, { message });
      setTeam({ ...team, activities: r.data });
      setUpdate("");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Could not post that update");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <Link to="/teams" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink font-medium mb-6">
        <ArrowLeft size={17} aria-hidden="true" /> All teams
      </Link>

      <header className="card p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-clay-lo" aria-hidden="true" />
        <div className="relative">
          <span className={`tag ${team.category === "Medical" ? "tag-moss" : team.category === "Other" ? "tag-sun" : "tag-clay"}`}>{team.category}</span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">{team.name}</h1>
          <p className="mt-2 text-ink-2 inline-flex items-center gap-1"><MapPin size={16} aria-hidden="true" /> {team.area || "Dhaka"} · started by {team.creator?.name || "a volunteer"}</p>
          {team.description && <p className="mt-4 text-lg max-w-2xl">{team.description}</p>}
          {isCreator && (
            <Link to={`/my-team?team=${team._id}`} className="btn btn-moss mt-6"><UserPlus size={18} aria-hidden="true" /> Invite volunteers</Link>
          )}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <section aria-labelledby="log-title">
          <h2 id="log-title" className="text-2xl font-semibold mb-4">Team log</h2>

          {isMember && (
            <form onSubmit={post} className="card p-4 mb-6">
              <label htmlFor="update" className="label">Post an update for the team</label>
              <textarea id="update" value={update} maxLength={280} onChange={(e) => setUpdate(e.target.value)} className="field !min-h-20"
                placeholder="e.g. Fed the Road 27 pack, the small black one is limping again." />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-ink-2 tabular-nums">{update.length}/280</span>
                <button type="submit" disabled={posting || !update.trim()} className="btn btn-clay"><Send size={16} aria-hidden="true" /> Post</button>
              </div>
            </form>
          )}

          {activities.length === 0 ? (
            <p className="text-ink-2">No updates yet.</p>
          ) : (
            <ol className="relative border-l-2 border-dashed border-line-2 ml-3 space-y-6">
              {activities.map((a, i) => (
                <li key={i} className="pl-6 relative">
                  <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-sun border-4 border-paper" aria-hidden="true" />
                  <p className="text-sm text-ink-2">
                    {a.by && <span className="font-semibold text-ink">{a.by} · </span>}
                    {a.createdAt ? timeAgo(a.createdAt) : ""}
                  </p>
                  <p className="mt-0.5">{a.message}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="card p-5 h-fit" aria-labelledby="members-title">
          <h2 id="members-title" className="text-lg font-semibold">{team.members.length} member{team.members.length === 1 ? "" : "s"}</h2>
          <ul className="mt-3 space-y-2">
            {team.members.map((m, i) => (
              <li key={m._id}>
                <Link to={`/volunteers/${m._id}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-sunken">
                  <Avatar name={m.name} size="w-9 h-9 text-xs" tone={["clay", "moss", "sun"][i % 3]} />
                  <span className="font-medium">{m.name}</span>
                  {m._id === team.creator?._id && <span className="tag tag-sun ml-auto">Lead</span>}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
