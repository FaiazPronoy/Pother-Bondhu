import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { MapPin, Plus, UserPlus, Search } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { Avatar, Empty, Loading, PageHeader, SignInPrompt } from "../components/bits";
import { useLang } from "../context/LangContext";

const MyTeam = () => {
  const { backendUrl, isLoggedIn, userData } = useContext(AppContext);
  const { t, area, apiError } = useLang();
  const [params] = useSearchParams();
  const [teams, setTeams] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(params.get("team") || "");
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [filter, setFilter] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    axios.get(`${backendUrl}/api/teams/my-teams`).then((r) => setTeams(r.data)).catch(() => setTeams([]));
    axios.get(`${backendUrl}/api/volunteers`).then((r) => setVolunteers(r.data)).catch(() => {});
  }, [backendUrl, isLoggedIn]);

  const leading = useMemo(() => (teams || []).filter((t) => t.creator?._id === userData?._id), [teams, userData]);

  // only volunteers who are not me and not already in the chosen team
  const invitable = useMemo(() => {
    const team = leading.find((t) => t._id === selectedTeam);
    const inTeam = new Set((team?.members || []).map((m) => m._id));
    const q = filter.trim().toLowerCase();
    return volunteers.filter((v) =>
      v._id !== userData?._id && !inTeam.has(v._id) &&
      (!q || v.name.toLowerCase().includes(q) || (v.location || "").toLowerCase().includes(q)));
  }, [volunteers, leading, selectedTeam, filter, userData]);

  if (!isLoggedIn) return <SignInPrompt>{t("myTeam.signIn")}</SignInPrompt>;
  if (teams === null) return <Loading />;

  const toggle = (id) =>
    setSelectedVolunteers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const sendInvites = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/invites/send`, { teamId: selectedTeam, volunteerIds: selectedVolunteers });
      toast.success(t("myTeam.sent", { n: data.length }));
      setSelectedVolunteers([]);
    } catch (err) {
      toast.error(apiError(err, "myTeam.fail"));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={t("myTeam.eyebrow")}
        title={t("myTeam.title")}
        action={<Link to="/createteam" className="btn btn-clay"><Plus size={18} aria-hidden="true" /> {t("teams.start")}</Link>}
      >
        {t("myTeam.lead")}
      </PageHeader>

      {teams.length === 0 ? (
        <Empty title={t("myTeam.none")} action={<Link to="/teams" className="btn btn-clay">{t("myTeam.browse")}</Link>}>
          {t("myTeam.noneText")}
        </Empty>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <ul className="space-y-4">
            {teams.map((team) => (
              <li key={team._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link to={`/teams/${team._id}`} className="block text-xl font-semibold hover:text-clay">{team.name}</Link>
                    <p className="text-ink-2 inline-flex items-center gap-1 mt-1">
                      <MapPin size={15} aria-hidden="true" /> {area(team.area || "Dhaka")}
                    </p>
                  </div>
                  {team.creator?._id === userData._id ? <span className="tag tag-sun">{t("myTeam.youLead")}</span> : <span className="tag tag-moss">{t("myTeam.member")}</span>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {team.members.map((m, i) => (
                    <span key={m._id} className="inline-flex items-center gap-2 rounded-full bg-sunken pl-1 pr-3 py-1 text-sm">
                      <Avatar name={m.name} size="w-7 h-7 text-[10px]" tone={["clay", "moss", "sun"][i % 3]} /> {m.name}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <section aria-labelledby="invite-title">
            <form onSubmit={sendInvites} className="card p-5 lg:sticky lg:top-6 space-y-4">
              <h2 id="invite-title" className="text-xl font-semibold inline-flex items-center gap-2"><UserPlus size={20} aria-hidden="true" /> {t("myTeam.invite")}</h2>
              {leading.length === 0 ? (
                <p className="text-ink-2">{t("myTeam.onlyLead")}</p>
              ) : (
                <>
                  <div>
                    <label htmlFor="team-select" className="label">{t("myTeam.which")}</label>
                    <select id="team-select" value={selectedTeam} onChange={(e) => { setSelectedTeam(e.target.value); setSelectedVolunteers([]); }} className="field">
                      <option value="">{t("myTeam.chooseTeam")}</option>
                      {leading.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  {selectedTeam && (
                    <fieldset>
                      <legend className="label">{t("myTeam.who")}</legend>
                      <div className="relative mb-2">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden="true" />
                        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} className="field pl-9 !min-h-10"
                          placeholder={t("myTeam.filter")} aria-label={t("myTeam.filterLabel")} />
                      </div>
                      <div className="max-h-72 overflow-y-auto rounded-xl border border-line divide-y divide-line">
                        {invitable.length === 0 ? (
                          <p className="p-3 text-ink-2 text-sm">{t("myTeam.nobody")}</p>
                        ) : invitable.map((v) => (
                          <label key={v._id} className={`flex items-center gap-3 p-3 cursor-pointer ${selectedVolunteers.includes(v._id) ? "bg-moss-lo" : "hover:bg-sunken"}`}>
                            <input type="checkbox" checked={selectedVolunteers.includes(v._id)} onChange={() => toggle(v._id)}
                              className="w-5 h-5 accent-[var(--sb-moss)]" />
                            <span className="min-w-0">
                              <span className="block font-medium">{v.name}</span>
                              <span className="block text-sm text-ink-2">{v.location ? area(v.location) : t("common.areaNotSet")}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <button type="submit" disabled={!selectedTeam || selectedVolunteers.length === 0 || sending} className="btn btn-moss w-full">
                    {sending ? t("myTeam.sending") : selectedVolunteers.length ? t("myTeam.send", { n: selectedVolunteers.length }) : t("myTeam.sendNone")}
                  </button>
                </>
              )}
            </form>
          </section>
        </div>
      )}
    </>
  );
};

export default MyTeam;
