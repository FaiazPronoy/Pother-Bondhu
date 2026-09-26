import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { AREAS, PageHeader, SignInPrompt } from "../components/bits";
import { useLang } from "../context/LangContext";

const CreateTeamPage = () => {
  const { backendUrl, isLoggedIn, userData } = useContext(AppContext);
  const { t, area, apiError } = useLang();
  const [teamName, setTeamName] = useState("");
  const [location, setLocation] = useState(AREAS.includes(userData?.location) ? userData.location : "");
  const [teamType, setTeamType] = useState("Rescue");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  if (!isLoggedIn) return <SignInPrompt>{t("create.signIn")}</SignInPrompt>;

  if (userData.role !== "volunteer") {
    return (
      <div className="card p-8 max-w-xl">
        <h1 className="text-2xl font-semibold">{t("create.onlyVol")}</h1>
        <p className="mt-2 text-ink-2">{t("create.onlyVolText")}</p>
        <Link to="/profile" className="btn btn-clay mt-5">{t("create.toProfile")}</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/teams`, { teamName, location, teamType, description });
      toast.success(t("create.done", { name: data.name }));
      navigate(`/teams/${data._id}`);
    } catch (err) {
      toast.error(apiError(err, "create.fail"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow={t("create.eyebrow")} title={t("create.title")}>{t("create.lead")}</PageHeader>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 max-w-2xl space-y-5">
        <div>
          <label htmlFor="teamName" className="label">{t("create.name")}</label>
          <input id="teamName" type="text" value={teamName} maxLength={60} required
            onChange={(e) => setTeamName(e.target.value)} className="field" placeholder={t("create.nameHint")} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="area" className="label">{t("create.area")}</label>
            <select id="area" value={location} onChange={(e) => setLocation(e.target.value)} className="field" required>
              <option value="" disabled>{t("create.chooseArea")}</option>
              {AREAS.map((a) => <option key={a} value={a}>{area(a)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="label">{t("create.kind")}</label>
            <select id="type" value={teamType} onChange={(e) => setTeamType(e.target.value)} className="field">
              <option value="Rescue">{t("create.kindRescue")}</option>
              <option value="Medical">{t("create.kindMedical")}</option>
              <option value="Other">{t("create.kindOther")}</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="desc" className="label">{t("create.about")} <span className="font-normal text-ink-2">{t("create.optional")}</span></label>
          <textarea id="desc" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} className="field"
            placeholder={t("create.aboutHint")} />
        </div>

        <button type="submit" disabled={saving} className="btn btn-clay">{saving ? t("create.creating") : t("create.submit")}</button>
      </form>
    </>
  );
};

export default CreateTeamPage;
