// src/components/TeamDetailsModal.jsx
import React from "react";
import { backendUrl } from '../config';
export default function TeamDetailsModal({ open, onClose, teamKey, title }) {
  const [team, setTeam] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  // fetch on open + key change
  React.useEffect(() => {
    if (!open || !teamKey) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      setTeam(null);
      try {
        const res = await fetch(`${backendUrl}/api/teams/${encodeURIComponent(teamKey)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
        if (!cancelled) setTeam(data.team || data);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, teamKey]);

  // close on Esc
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const display = team || { name: title };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold">{display?.name || "Team"}</h2>
          <button
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="mt-6">Loading…</div>
        ) : err ? (
          <div className="mt-6 text-red-600">Failed to load: {err}</div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center text-gray-700">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/>
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span><span className="font-medium">Area:</span> {display?.area || "Not specified"}</span>
            </div>

            <div className="text-gray-700">
              <span className="font-medium">Created by:</span>{" "}
              {display?.creator?.name || "Unknown"}
            </div>

            <div>
              <p className="font-medium text-gray-800 mb-1">Members:</p>
              {Array.isArray(display?.members) && display.members.length > 0 ? (
                <ul className="list-disc ml-6 space-y-1 text-gray-700">
                  {display.members.map((m) => (
                    <li key={m._id || m.id}>
                      {m.name || m.email} {m.email ? `(${m.email})` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No members yet</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
