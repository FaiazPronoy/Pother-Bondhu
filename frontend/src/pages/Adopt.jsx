import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { MapPin, Heart, Check, X, Plus, ImagePlus } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { AREAS, PageHeader, Empty } from "../components/bits";
import { useLang } from "../context/LangContext";

const MAX_BYTES = 3 * 1024 * 1024;

function AskForm({ animal, onDone }) {
  const { backendUrl } = useContext(AppContext);
  const { t, apiError } = useLang();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${backendUrl}/api/adoptions/${animal._id}/requests`, { phone, message });
      toast.success(t("adopt.asked"));
      onDone();
    } catch (err) {
      toast.error(apiError(err, "adopt.askFail"));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 border-t border-line pt-4">
      <div>
        <label htmlFor={`phone-${animal._id}`} className="label">{t("adopt.phone")}</label>
        <input id={`phone-${animal._id}`} type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
          className="field" autoComplete="tel" placeholder="01XXXXXXXXX" />
      </div>
      <div>
        <label htmlFor={`msg-${animal._id}`} className="label">{t("adopt.message")}</label>
        <textarea id={`msg-${animal._id}`} value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)}
          className="field" placeholder={t("adopt.messageHint")} />
      </div>
      <p className="text-sm text-ink-2">{t("adopt.phoneNote")}</p>
      <button type="submit" disabled={sending} className="btn btn-clay self-start">
        {sending ? t("adopt.sending") : t("adopt.send")}
      </button>
    </form>
  );
}

function AnimalCard({ animal, onChanged }) {
  const { backendUrl, isLoggedIn, userData } = useContext(AppContext);
  const { t, area } = useLang();
  const [open, setOpen] = useState(false);
  const adopted = animal.status === "adopted";
  const own = userData && animal.postedBy?._id === userData._id;
  const facts = [animal.age, animal.sex && t(`adopt.sex_${animal.sex}`)].filter(Boolean).join(", ");

  return (
    <li className={`card overflow-hidden flex flex-col ${adopted ? "opacity-90" : ""}`}>
      <div className="relative">
        <img src={`${backendUrl}${animal.imageUrl}`} alt={t("adopt.photoAlt", { name: animal.name })} loading="lazy"
          className="w-full aspect-[4/3] object-cover" />
        <span className={`absolute top-3 left-3 tag ${adopted ? "tag-moss" : "tag-clay"}`}>
          {adopted ? t("adopt.homed") : t(`adopt.kind_${animal.species}`)}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-semibold">{animal.name}</h3>
        {facts && <p className="text-ink-2">{facts}</p>}
        {animal.area && <p className="mt-1 text-ink-2 inline-flex items-center gap-1"><MapPin size={15} aria-hidden="true" /> {area(animal.area)}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className={`tag ${animal.vaccinated ? "tag-moss" : ""}`}>{animal.vaccinated ? t("adopt.vaccinated") : t("adopt.notVaccinated")}</span>
          <span className={`tag ${animal.neutered ? "tag-moss" : ""}`}>{animal.neutered ? t("adopt.neutered") : t("adopt.notNeutered")}</span>
        </div>
        {animal.story && <p className="mt-3 text-ink-2 text-pretty">{animal.story}</p>}
        <p className="mt-auto pt-4 text-sm text-ink-2">
          {animal.postedBy?.name && t("adopt.postedBy", { name: animal.postedBy.name })}
          {!adopted && animal.waiting > 0 && <> {t("adopt.waiting", { n: animal.waiting })}</>}
        </p>

        {!adopted && (
          animal.myRequest ? (
            <p className="mt-3 font-semibold text-moss-hi">{t(`adopt.my_${animal.myRequest.status}`)}</p>
          ) : own ? (
            <p className="mt-3 text-sm font-semibold text-ink-2">{t("adopt.yours")}</p>
          ) : !isLoggedIn ? (
            <Link to="/login" state={{ from: "/adopt" }} className="btn btn-line mt-3 self-start">{t("adopt.signIn")}</Link>
          ) : open ? (
            <AskForm animal={animal} onDone={() => { setOpen(false); onChanged(); }} />
          ) : (
            <button type="button" onClick={() => setOpen(true)} className="btn btn-clay mt-3 self-start">
              <Heart size={17} aria-hidden="true" /> {t("adopt.want")}
            </button>
          )
        )}
      </div>
    </li>
  );
}

function PostAnimal({ onPosted }) {
  const { backendUrl, userData } = useContext(AppContext);
  const { t, area: areaName, apiError } = useLang();
  const blank = { name: "", species: "dog", age: "", sex: "", area: AREAS.includes(userData.location) ? userData.location : "", story: "", vaccinated: false, neutered: false };
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error(t("adopt.noPhoto"));
    if (file.size > MAX_BYTES) return toast.error(t("rescues.tooBig"));
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.append("image", file);
    setSending(true);
    try {
      await axios.post(`${backendUrl}/api/adoptions`, body);
      toast.success(t("adopt.postedOk"));
      setForm(blank);
      setFile(null);
      onPosted();
    } catch (err) {
      toast.error(apiError(err, "adopt.postFail"));
    } finally {
      setSending(false);
    }
  };

  return (
    <details className="card p-5 sm:p-6 mb-10">
      <summary className="cursor-pointer font-semibold text-lg inline-flex items-center gap-2 min-h-11">
        <Plus size={19} aria-hidden="true" /> {t("adopt.postTitle")}
      </summary>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="a-name" className="label">{t("adopt.name")}</label>
          <input id="a-name" required maxLength={40} value={form.name} onChange={set("name")} className="field" />
        </div>
        <div>
          <label htmlFor="a-kind" className="label">{t("adopt.kind")}</label>
          <select id="a-kind" value={form.species} onChange={set("species")} className="field">
            <option value="dog">{t("adopt.kind_dog")}</option>
            <option value="cat">{t("adopt.kind_cat")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="a-age" className="label">{t("adopt.age")}</label>
          <input id="a-age" maxLength={30} value={form.age} onChange={set("age")} className="field" placeholder={t("adopt.ageHint")} />
        </div>
        <div>
          <label htmlFor="a-sex" className="label">{t("adopt.sex")}</label>
          <select id="a-sex" value={form.sex} onChange={set("sex")} className="field">
            <option value="">{t("adopt.sex_unknown")}</option>
            <option value="male">{t("adopt.sex_male")}</option>
            <option value="female">{t("adopt.sex_female")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="a-area" className="label">{t("rescues.where")}</label>
          <select id="a-area" value={form.area} onChange={set("area")} className="field">
            <option value="">{t("common.somewhere")}</option>
            {AREAS.map((a) => <option key={a} value={a}>{areaName(a)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="a-photo" className="label">{t("adopt.photo")}</label>
          <label className="field flex items-center gap-2 cursor-pointer">
            <ImagePlus size={18} aria-hidden="true" />
            <span className="truncate">{file ? file.name : t("adopt.pickPhoto")}</span>
            <input id="a-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files[0] || null)} />
          </label>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="a-story" className="label">{t("adopt.story")}</label>
          <textarea id="a-story" maxLength={600} value={form.story} onChange={set("story")} className="field" placeholder={t("adopt.storyHint")} />
        </div>
        <label className="inline-flex items-center gap-2 min-h-11">
          <input type="checkbox" checked={form.vaccinated} onChange={set("vaccinated")} className="w-5 h-5 accent-[var(--sb-clay)]" /> {t("adopt.vaccinated")}
        </label>
        <label className="inline-flex items-center gap-2 min-h-11">
          <input type="checkbox" checked={form.neutered} onChange={set("neutered")} className="w-5 h-5 accent-[var(--sb-clay)]" /> {t("adopt.neutered")}
        </label>
        <button type="submit" disabled={sending} className="btn btn-clay self-start">{sending ? t("adopt.sending") : t("adopt.postBtn")}</button>
      </form>
    </details>
  );
}

function MyRequests({ mine, onChanged }) {
  const { backendUrl } = useContext(AppContext);
  const { t, apiError } = useLang();
  const [busy, setBusy] = useState("");
  const withRequests = mine.posted.filter((a) => a.requests.length > 0);
  if (!withRequests.length && !mine.asked.length) return null;

  const answer = async (animal, request, action) => {
    setBusy(request._id);
    try {
      await axios.patch(`${backendUrl}/api/adoptions/${animal._id}/requests/${request._id}`, { action });
      toast.success(action === "accept" ? t("adopt.acceptedOk") : t("adopt.declinedOk"));
      onChanged();
    } catch (err) {
      toast.error(apiError(err, "adopt.answerFail"));
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="card p-5 sm:p-6 mb-10" aria-labelledby="mine-title">
      <h2 id="mine-title" className="text-xl font-semibold">{t("adopt.mineTitle")}</h2>
      {withRequests.map((a) => (
        <div key={a._id} className="mt-5">
          <h3 className="font-semibold">{a.name} {a.status === "adopted" && <span className="tag tag-moss ml-2">{t("adopt.homed")}</span>}</h3>
          <ul className="mt-2 divide-y divide-line">
            {a.requests.map((r) => (
              <li key={r._id} className="py-3 flex flex-wrap items-start gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{r.user?.name} <a href={`tel:${r.phone}`} className="text-clay underline underline-offset-2 ml-1">{r.phone}</a></p>
                  {r.message && <p className="text-ink-2 text-pretty">{r.message}</p>}
                </div>
                {r.status === "waiting" && a.status === "available" ? (
                  <div className="flex gap-2">
                    <button type="button" disabled={busy === r._id} onClick={() => answer(a, r, "accept")} className="btn btn-clay !min-h-11">
                      <Check size={16} aria-hidden="true" /> {t("adopt.accept")}
                    </button>
                    <button type="button" disabled={busy === r._id} onClick={() => answer(a, r, "decline")} className="btn btn-line !min-h-11">
                      <X size={16} aria-hidden="true" /> {t("adopt.decline")}
                    </button>
                  </div>
                ) : (
                  <span className="tag">{t(`adopt.req_${r.status}`)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {mine.asked.length > 0 && (
        <ul className="mt-5 grid gap-2">
          {mine.asked.map((a) => (
            <li key={a._id} className="flex flex-wrap items-center justify-between gap-2">
              <span>{t("adopt.youAsked", { name: a.name, by: a.postedBy })}</span>
              <span className="tag">{t(`adopt.req_${a.status}`)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Adopt() {
  const { backendUrl, isLoggedIn, userData } = useContext(AppContext);
  const { t } = useLang();
  const [animals, setAnimals] = useState(null);
  const [mine, setMine] = useState(null);
  const [kind, setKind] = useState("");
  const canPost = userData && ["volunteer", "admin"].includes(userData.role);

  const load = () => {
    axios.get(`${backendUrl}/api/adoptions`).then((r) => setAnimals(r.data)).catch(() => setAnimals([]));
    if (isLoggedIn) axios.get(`${backendUrl}/api/adoptions/mine`).then((r) => setMine(r.data)).catch(() => {});
  };
  useEffect(load, [backendUrl, isLoggedIn]);

  const shown = useMemo(() => (animals || []).filter((a) => !kind || a.species === kind), [animals, kind]);

  return (
    <>
      <PageHeader title={t("adopt.title")}>{t("adopt.lead")}</PageHeader>

      {canPost && <PostAnimal onPosted={load} />}
      {mine && <MyRequests mine={mine} onChanged={load} />}

      <div className="flex flex-wrap justify-center gap-2 mb-8" role="group" aria-label={t("adopt.filter")}>
        {[["", "adopt.all"], ["dog", "adopt.dogs"], ["cat", "adopt.cats"]].map(([k, label]) => (
          <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{t(label)}</button>
        ))}
      </div>

      {animals === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton aspect-[4/5]" />)}
        </div>
      ) : shown.length === 0 ? (
        <Empty title={t("adopt.emptyTitle")}>{t("adopt.emptyText")}</Empty>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => <AnimalCard key={a._id} animal={a} onChanged={load} />)}
        </ul>
      )}
    </>
  );
}
