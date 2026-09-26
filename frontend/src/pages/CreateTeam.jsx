import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { AREAS, PageHeader, SignInPrompt } from "../components/bits";

const CreateTeamPage = () => {
  const { backendUrl, isLoggedIn, userData } = useContext(AppContext);
  const [teamName, setTeamName] = useState("");
  const [location, setLocation] = useState(AREAS.includes(userData?.location) ? userData.location : "");
  const [teamType, setTeamType] = useState("Rescue");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  if (!isLoggedIn) return <SignInPrompt>Sign in as a volunteer to start a team.</SignInPrompt>;

  if (userData.role !== "volunteer") {
    return (
      <div className="card p-8 max-w-xl">
        <h1 className="text-2xl font-semibold">Teams are started by volunteers</h1>
        <p className="mt-2 text-ink-2">Switch your account to volunteer in your profile, then come back here.</p>
        <Link to="/profile" className="btn btn-clay mt-5">Go to my profile</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/teams`, { teamName, location, teamType, description });
      toast.success(`${data.name} is up. Invite a few people next.`);
      navigate(`/teams/${data._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not create the team");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="New team" title="Start a team">
        Pick an area you can actually get to. You'll be the lead, and you can invite other volunteers afterwards.
      </PageHeader>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 max-w-2xl space-y-5">
        <div>
          <label htmlFor="teamName" className="label">Team name</label>
          <input id="teamName" type="text" value={teamName} maxLength={60} required
            onChange={(e) => setTeamName(e.target.value)} className="field" placeholder="e.g. Banani Night Feeders" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="area" className="label">Area</label>
            <select id="area" value={location} onChange={(e) => setLocation(e.target.value)} className="field" required>
              <option value="" disabled>Choose an area</option>
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="label">What the team does</label>
            <select id="type" value={teamType} onChange={(e) => setTeamType(e.target.value)} className="field">
              <option value="Rescue">Rescue and feeding</option>
              <option value="Medical">Medical and first aid</option>
              <option value="Other">Something else</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="desc" className="label">A line about the team <span className="font-normal text-ink-2">(optional)</span></label>
          <textarea id="desc" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} className="field"
            placeholder="When you meet, what you do, what help you need." />
        </div>

        <button type="submit" disabled={saving} className="btn btn-clay">{saving ? "Creating…" : "Create team"}</button>
      </form>
    </>
  );
};

export default CreateTeamPage;
