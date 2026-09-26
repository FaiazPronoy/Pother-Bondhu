import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { useLang } from '../context/LangContext';

const NotFound = () => {
  const { t } = useLang();
  return (
    <div className="py-16 text-center max-w-lg mx-auto">
      <div className="flex justify-center gap-3 text-line-2 mb-6" aria-hidden="true">
        <PawPrint size={28} className="-rotate-12 translate-y-3" />
        <PawPrint size={28} className="rotate-6" />
        <PawPrint size={28} className="-rotate-12 translate-y-3 opacity-60" />
        <PawPrint size={28} className="rotate-6 opacity-30" />
      </div>
      <p className="font-display text-7xl font-semibold text-clay">404</p>
      <h1 className="mt-3 text-3xl font-semibold">{t("notFound.title")}</h1>
      <p className="mt-3 text-ink-2 text-lg text-pretty">{t("notFound.text")}</p>
      <Link to="/" className="btn btn-clay mt-8">{t("notFound.home")}</Link>
    </div>
  );
};

export default NotFound;
