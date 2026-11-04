import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { PageHeader } from "../components/bits";
import { useLang } from "../context/LangContext";
import AreaMap from "../components/AreaMap";

// Only places with an address on their own site or in a news report. Phone
// numbers that disagree between directory sites are left out on purpose.
// Checked on 4 November 2026.
const PLACES = [
  {
    key: "cvh", kind: "vet", area: "Puran Dhaka", at: [23.718, 90.408],
    name: "Central Veterinary Hospital",
    address: "48 Kazi Alauddin Road, Dhaka 1000",
    hours: "hoursCvh",
    source: "https://www.bssnews.net/news/256089", sourceName: "BSS, March 2025",
  },
  {
    key: "ld", kind: "vet", area: "Uttara", at: [23.869, 90.396],
    name: "LD Veterinary Hospital & Daycare Center",
    address: "Sector 7, Uttara, Dhaka",
    source: "https://www.tbsnews.net/bangladesh/health/first-private-hospital-pets-launched-uttara", sourceName: "The Business Standard, 2019",
  },
  {
    key: "robinhood", kind: "rescue", area: "Khilgaon", at: [23.752, 90.427],
    name: "RobinHood The Animal Rescuer",
    address: "Tilpapara Road 9, Khilgaon, Dhaka",
    phone: "+8801970737283", email: "contact@robinhoodrescue.org",
    source: "https://www.robinhoodrescue.org/", sourceName: "robinhoodrescue.org",
  },
  {
    key: "haven", kind: "shelter", area: "Mirpur", at: [23.8255, 90.364],
    name: "Animal Haven",
    address: "Plot 1916, Road 8/8, Block F, Sagufta Pallabi, Mirpur 12, Dhaka",
    email: "animalhavenorg@gmail.com",
    source: "https://animalhavenorg.wixsite.com/info/contact", sourceName: "Animal Haven website",
  },
];

const KIND_COLOR = { vet: "#3F6B4E", rescue: "#A52A2A", shelter: "#E9A23B" };

export default function Vets() {
  const { t, area } = useLang();
  const pins = PLACES.map((p) => ({ key: p.key, at: p.at, color: KIND_COLOR[p.kind], size: 11, label: p.name }));

  return (
    <>
      <PageHeader title={t("vets.title")}>{t("vets.lead")}</PageHeader>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-start">
        <ul className="grid gap-4">
          {PLACES.map((p) => (
            <li key={p.key} className="card p-5">
              <span className={`tag ${p.kind === "vet" ? "tag-moss" : "tag-clay"}`}>{t(`vets.kind_${p.kind}`)}</span>
              <h2 className="mt-3 text-xl font-semibold text-balance">{p.name}</h2>
              <p className="mt-2 flex gap-2 text-ink-2"><MapPin size={17} className="mt-1 shrink-0" aria-hidden="true" /> {p.address}</p>
              {p.hours && <p className="mt-1 flex gap-2 text-ink-2"><Clock size={17} className="mt-1 shrink-0" aria-hidden="true" /> {t(`vets.${p.hours}`)}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {p.phone && <a href={`tel:${p.phone}`} className="btn btn-line !min-h-11"><Phone size={16} aria-hidden="true" /> {p.phone}</a>}
                {p.email && <a href={`mailto:${p.email}`} className="btn btn-line !min-h-11"><Mail size={16} aria-hidden="true" /> {t("vets.email")}</a>}
              </div>
              <p className="mt-3 text-sm text-ink-2">
                {area(p.area)}. {t("vets.source")}{" "}
                <a href={p.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink inline-flex items-center gap-1">
                  {p.sourceName} <ExternalLink size={13} aria-hidden="true" />
                </a>
              </p>
            </li>
          ))}
        </ul>

        <div className="lg:sticky lg:top-24">
          <AreaMap pins={pins} label={t("vets.mapLabel")} />
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
            {Object.entries(KIND_COLOR).map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: c }} aria-hidden="true" />{t(`vets.kind_${k}`)}
              </span>
            ))}
          </div>
          <div className="card p-5 mt-6">
            <h2 className="text-lg font-semibold">{t("vets.beforeTitle")}</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-ink-2">
              <li>{t("vets.before1")}</li>
              <li>{t("vets.before2")}</li>
              <li>{t("vets.before3")}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
