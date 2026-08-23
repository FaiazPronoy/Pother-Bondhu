// TeamDetails.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { backendUrl } from '../config';
export default function TeamDetails() {
  const { key } = useParams(); // slug | id | _id
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    const tryFetch = async (url) => {
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      return data.team || data; // support {team} or raw doc
    };

    (async () => {
      setErr("");
      setLoading(true);
      try {
        const encoded = encodeURIComponent(key);

        // Try your desired route first
        const tries = [
          `${backendUrl}/api/teams/${encoded}`,
          // Common alternates you might already have:
          `${backendUrl}/api/teams/get/${encoded}`,
          `${backendUrl}/api/teams/by-id/${encoded}`,
          `${backendUrl}/api/team/${encoded}`,            // singular
          `${backendUrl}/api/team/get/${encoded}`
        ];

        let found = null;
        let lastError = null;
        for (const url of tries) {
          try {
            found = await tryFetch(url);
            break;
          } catch (e) {
            lastError = e;
          }
        }
        if (!found) throw lastError || new Error("Team not found");

        if (!cancelled) setTeam(found);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [key]);

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">Failed to load team: {String(err)}</div>;
  if (!team) return <div className="p-4">Not found.</div>;

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <Link to="/teams" className="text-sm underline">&larr; Back to teams</Link>
      <h1 className="text-2xl font-semibold mt-2">{team.name}</h1>
      {team.description && <p className="mt-2">{team.description}</p>}

      {Array.isArray(team.members) && team.members.length > 0 && (
        <div className="mt-6">
          <h2 className="font-medium mb-2">Members</h2>
          <ul className="list-disc ml-6 space-y-1">
            {team.members.map((m) => (
              <li key={m._id || m.id}>{m.name || m.email || m.username}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
