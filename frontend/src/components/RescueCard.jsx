import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { MapPin } from "lucide-react";
import { backendUrl } from "../config";
import { AppContext } from "../context/AppContext";
import { useLang } from "../context/LangContext";

export const STATUSES = ["urgent", "vet", "helping", "resolved"];

export function StatusTag({ status }) {
  const { t } = useLang();
  return (
    <span className={`status status-${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {t(`rescue.status_${status}`)}
    </span>
  );
}

export default function RescueCard({ post }) {
  const { t, area, ago } = useLang();
  const { userData } = useContext(AppContext);
  const [status, setStatus] = useState(post.status || "urgent");
  const who = post.volunteer;
  // the poster and any volunteer can move a rescue along
  const canChange = userData && (userData.role === "volunteer" || userData.role === "admin" || (who && who._id === userData._id));

  const change = async (next) => {
    const before = status;
    setStatus(next);
    try {
      await axios.patch(`${backendUrl}/api/upload/rescue/${post._id}/status`, { status: next });
      toast.success(t("rescue.statusSaved"));
    } catch {
      setStatus(before);
      toast.error(t("rescue.statusFail"));
    }
  };

  return (
    <figure className={`polaroid relative ${status === "urgent" ? "is-urgent" : ""}`}>
      <div className="relative">
        <img
          src={`${backendUrl}${post.imageUrl}`}
          alt={post.caption ? t("rescue.alt", { caption: post.caption }) : t("rescue.altPlain")}
          loading="lazy"
          className="w-full aspect-[4/3] object-cover"
        />
        <span className="absolute left-2 top-2"><StatusTag status={status} /></span>
      </div>
      <figcaption className="px-1 pt-3 pb-4 text-center">
        <p className="font-display italic text-[1.05rem] leading-snug line-clamp-3 text-balance">
          {post.caption || t("rescue.noNote")}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-[#6B5646]">
          {(post.area || who?.location) && (
            <span className="inline-flex items-center gap-1 font-semibold text-[#8F3416]">
              <MapPin size={14} aria-hidden="true" /> {area(post.area || who.location)}
            </span>
          )}
          {who && (
            who.role === "volunteer" ? (
              <Link to={`/volunteers/${who._id}`} className="underline underline-offset-2 hover:text-[#2B2019]">{who.name}</Link>
            ) : (
              <span>{who.name}</span>
            )
          )}
          <span>{ago(post.createdAt)}</span>
        </div>
        {canChange && (
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#6B5646]">
            {t("rescue.statusLabel")}
            <select value={status} onChange={(e) => change(e.target.value)} className="status-pick">
              {STATUSES.map((s) => <option key={s} value={s}>{t(`rescue.status_${s}`)}</option>)}
            </select>
          </label>
        )}
      </figcaption>
    </figure>
  );
}
