import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ImagePlus, X, Send } from "lucide-react";
import { AppContext } from "../context/AppContext";
import RescueCard from "../components/RescueCard";
import { AREAS, PageHeader, Empty, SignInPrompt } from "../components/bits";
import { useLang } from "../context/LangContext";

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

function PostForm({ onPosted }) {
  const { backendUrl, userData } = useContext(AppContext);
  const { t, area: areaName, apiError } = useLang();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [area, setArea] = useState(AREAS.includes(userData.location) ? userData.location : "");
  const [sending, setSending] = useState(false);
  const input = useRef(null);

  // free the old preview URL whenever the photo changes
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const pick = (f) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return toast.error(t("rescues.badType"));
    if (f.size > MAX_BYTES) return toast.error(t("rescues.tooBig"));
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clear = () => {
    setFile(null);
    setPreview("");
    if (input.current) input.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error(t("rescues.noPhoto"));
    const form = new FormData();
    form.append("image", file);
    form.append("caption", caption.trim());
    form.append("area", area);
    setSending(true);
    try {
      await axios.post(`${backendUrl}/api/upload/rescue`, form);
      toast.success(t("rescues.posted"));
      clear();
      setCaption("");
      onPosted();
    } catch (err) {
      toast.error(apiError(err, "rescues.postFail"));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6 grid gap-5 md:grid-cols-[240px_1fr]" aria-labelledby="post-title">
      <div>
        {preview ? (
          <div className="relative">
            <img src={preview} alt={t("rescues.picked")} className="w-full aspect-[4/3] object-cover rounded-xl" />
            <button type="button" onClick={clear} aria-label={t("rescues.removePhoto")}
              className="absolute top-2 right-2 w-9 h-9 grid place-items-center rounded-full bg-[#1A1411]/75 text-white hover:bg-[#1A1411]">
              <X size={18} />
            </button>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-2 aspect-[4/3] rounded-xl border-2 border-dashed border-line-2 bg-sunken text-ink-2 cursor-pointer hover:border-clay hover:text-clay text-center px-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          >
            <ImagePlus size={32} aria-hidden="true" />
            <span className="font-semibold">{t("rescues.addPhoto")}</span>
            <span className="text-sm">{t("rescues.photoRules")}</span>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
              onChange={(e) => pick(e.target.files[0])} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 id="post-title" className="text-xl font-semibold">{t("rescues.formTitle")}</h2>
        <div>
          <label htmlFor="area" className="label">{t("rescues.where")}</label>
          <select id="area" value={area} onChange={(e) => setArea(e.target.value)} className="field">
            <option value="">{t("common.somewhere")}</option>
            {AREAS.map((a) => <option key={a} value={a}>{areaName(a)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="caption" className="label">{t("rescues.what")}</label>
          <textarea id="caption" value={caption} maxLength={500} onChange={(e) => setCaption(e.target.value)} className="field"
            placeholder={t("rescues.whatHint")} aria-describedby="caption-note" />
          <p className="mt-1 flex justify-between gap-3 text-sm text-ink-2">
            <span id="caption-note">{t("rescues.langNote")}</span>
            <span className="tabular-nums shrink-0">{caption.length}/500</span>
          </p>
        </div>
        <button type="submit" disabled={sending} className="btn btn-clay self-start">
          <Send size={17} aria-hidden="true" /> {sending ? t("rescues.posting") : t("rescues.post")}
        </button>
      </div>
    </form>
  );
}

export default function Rescues() {
  const { backendUrl, isLoggedIn } = useContext(AppContext);
  const { t, area: areaName } = useLang();
  const [posts, setPosts] = useState(null);
  const [area, setArea] = useState("");
  const location = useLocation();

  const load = () => {
    axios.get(`${backendUrl}/api/upload/rescue?limit=24`)
      .then((r) => setPosts(r.data))
      .catch(() => setPosts([]));
  };

  useEffect(load, [backendUrl]);

  // the dashboard's "Post a rescue" button links to #post
  useEffect(() => {
    if (location.hash === "#post") document.getElementById("post")?.scrollIntoView({ behavior: "smooth" });
  }, [location.hash]);

  const shown = useMemo(
    () => (posts || []).filter((p) => !area || (p.area || p.volunteer?.location) === area),
    [posts, area]
  );
  const areasInUse = useMemo(
    () => AREAS.filter((a) => (posts || []).some((p) => (p.area || p.volunteer?.location) === a)),
    [posts]
  );

  return (
    <>
      <PageHeader eyebrow={t("rescues.eyebrow")} title={t("rescues.title")}>{t("rescues.lead")}</PageHeader>

      <section id="post" className="mb-12 scroll-mt-24">
        {isLoggedIn ? <PostForm onPosted={load} /> : <SignInPrompt>{t("rescues.signIn")}</SignInPrompt>}
      </section>

      {areasInUse.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10" role="group" aria-label={t("rescues.filter")}>
          <button type="button" className="chip" aria-pressed={!area} onClick={() => setArea("")}>{t("rescues.everywhere")}</button>
          {areasInUse.map((a) => (
            <button key={a} type="button" className="chip" aria-pressed={area === a} onClick={() => setArea(a)}>{areaName(a)}</button>
          ))}
        </div>
      )}

      {posts === null ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton aspect-[4/5]" />)}
        </div>
      ) : shown.length === 0 ? (
        <Empty title={t("rescues.emptyTitle")}>{t("rescues.emptyText")}</Empty>
      ) : (
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => <RescueCard key={p._id} post={p} />)}
        </div>
      )}
    </>
  );
}
