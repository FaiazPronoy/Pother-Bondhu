import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { backendUrl } from "../config";
import { useLang } from "../context/LangContext";

export default function RescueCard({ post }) {
  const { t, area, ago } = useLang();
  const who = post.volunteer;
  return (
    <figure className="polaroid relative">
      <img
        src={`${backendUrl}${post.imageUrl}`}
        alt={post.caption ? t("rescue.alt", { caption: post.caption }) : t("rescue.altPlain")}
        loading="lazy"
        className="w-full aspect-[4/3] object-cover"
      />
      <figcaption className="px-1 pt-3 pb-4">
        {/* the caption stays in whatever language it was written in */}
        <p className="font-display italic text-[1.05rem] leading-snug line-clamp-3">
          {post.caption || t("rescue.noNote")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6B5646]">
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
      </figcaption>
    </figure>
  );
}
