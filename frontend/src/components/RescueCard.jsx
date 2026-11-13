import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { TriangleAlert, Stethoscope, Footprints, Check } from "lucide-react";
import { backendUrl } from "../config";
import { AppContext } from "../context/AppContext";
import { useLang } from "../context/LangContext";

export const STATUSES = ["urgent", "vet", "helping", "resolved"];

const ICONS = { urgent: TriangleAlert, vet: Stethoscope, helping: Footprints, resolved: Check };

export function StatusTag({ status, fresh = false }) {
  const { t } = useLang();
  const Icon = ICONS[status] || TriangleAlert;
  return (
    <span className={`status status-${status} ${fresh ? "is-safe" : ""}`}>
      <Icon aria-hidden="true" strokeWidth={2.4} />
      {t(`rescue.status_${status}`)}
    </span>
  );
}

export default function RescueCard({ post }) {
  const { t, area, ago } = useLang();
  const { userData } = useContext(AppContext);
  const [status, setStatus] = useState(post.status || "urgent");
  const [justSafe, setJustSafe] = useState(false);
  const who = post.volunteer;
  const where = post.area || who?.location;
  // the poster and any volunteer can move a rescue along
  const canChange = userData && (userData.role === "volunteer" || userData.role === "admin" || (who && who._id === userData._id));
  const mine = userData && who && who._id === userData._id;

  const change = async (next) => {
    const before = status;
    setStatus(next);
    setJustSafe(false);
    try {
      await axios.patch(`${backendUrl}/api/upload/rescue/${post._id}/status`, { status: next });
      if (next === "resolved") setJustSafe(true);
      else toast.success(t("rescue.statusSaved"));
    } catch {
      setStatus(before);
      toast.error(t("rescue.statusFail"));
    }
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-[6px] border border-line bg-card">
      <div className="relative">
        <img
          src={`${backendUrl}${post.imageUrl}`}
          alt={post.caption ? t("rescue.alt", { caption: post.caption }) : t("rescue.altPlain")}
          loading="lazy"
          className="w-full aspect-[4/3] object-cover bg-sunken"
        />
        <span className="absolute left-2.5 top-2.5"><StatusTag status={status} fresh={justSafe} /></span>
      </div>
      <div className="flex flex-col gap-1.5 px-3.5 pt-3 pb-3.5">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2 !text-left">
          {where && (
            <span className="font-bold text-ink">{area(where)}</span>
          )}
          <span>{ago(post.createdAt)}</span>
        </p>
        <p className="line-clamp-3 !text-left">{post.caption || t("rescue.noNote")}</p>
        {who && (
          <p className="text-sm text-ink-2 !text-left">
            {mine ? t("rescue.byYou") : (
              <>
                {t("rescue.postedBy")}{" "}
                {who.role === "volunteer"
                  ? <Link to={`/volunteers/${who._id}`} className="text-ink underline underline-offset-2 hover:text-clay">{who.name}</Link>
                  : <span className="text-ink">{who.name}</span>}
              </>
            )}
          </p>
        )}
        {justSafe && (
          <p className="safe-note font-semibold text-moss !text-left" role="status">{t("rescue.markedSafe")}</p>
        )}
        {canChange && (
          <label className="mt-1.5 inline-flex items-center gap-2 text-sm text-ink-2">
            {t("rescue.statusLabel")}
            <select value={status} onChange={(e) => change(e.target.value)} className="status-pick">
              {STATUSES.map((s) => <option key={s} value={s}>{t(`rescue.status_${s}`)}</option>)}
            </select>
          </label>
        )}
      </div>
    </article>
  );
}
