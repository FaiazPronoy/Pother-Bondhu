import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { AREAS, Avatar, Empty, PageHeader, Points } from '../components/bits';
import { useLang } from '../context/LangContext';

export default function VolunteersPage() {
  const { backendUrl } = useContext(AppContext);
  const { t, area: areaName } = useLang();
  const [volunteers, setVolunteers] = useState(null);
  const [area, setArea] = useState('');
  const [typed, setTyped] = useState('');

  useEffect(() => {
    setVolunteers(null);
    axios.get(`${backendUrl}/api/volunteers${area ? `?location=${encodeURIComponent(area)}` : ''}`)
      .then((r) => setVolunteers(r.data))
      .catch(() => setVolunteers([]));
  }, [backendUrl, area]);

  const search = (e) => {
    e.preventDefault();
    setArea(typed.trim());
  };

  return (
    <>
      <PageHeader eyebrow={t('vols.eyebrow')} title={t('vols.title')}>{t('vols.lead')}</PageHeader>

      <div className="flex flex-col gap-3 mb-8 lg:flex-row lg:items-center">
        <form onSubmit={search} className="relative w-full lg:max-w-sm" role="search">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden="true" />
          <input type="search" value={typed} onChange={(e) => setTyped(e.target.value)} className="field pl-10"
            placeholder={t('vols.search')} aria-label={t('vols.searchLabel')} />
        </form>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('vols.quick')}>
          <button type="button" className="chip" aria-pressed={!area} onClick={() => { setArea(''); setTyped(''); }}>{t('vols.everywhere')}</button>
          {['Dhanmondi', 'Mirpur', 'Uttara', 'Gulshan'].map((a) => (
            <button key={a} type="button" className="chip" aria-pressed={area === a} onClick={() => { setArea(a); setTyped(a); }}>{areaName(a)}</button>
          ))}
        </div>
      </div>

      {volunteers === null ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-48" />)}
        </div>
      ) : volunteers.length === 0 ? (
        <Empty title={area ? t('vols.noneIn', { area: areaName(area) }) : t('vols.none')}>
          {AREAS.includes(area) ? t('vols.beFirst') : t('vols.tryOther')}
        </Empty>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {volunteers.map((v, i) => (
            <li key={v._id}>
              <Link to={`/volunteers/${v._id}`} className="card p-5 sm:p-6 h-full flex flex-col hover:border-line-2 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={v.name} size="w-14 h-14 text-lg" tone={['clay', 'moss', 'sun'][i % 3]} />
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">{v.name}</h2>
                    <p className="text-ink-2">{v.location ? areaName(v.location) : t('common.areaNotSet')}</p>
                  </div>
                </div>
                <p className="mt-3 text-ink-2 flex-1">{v.bio || t('vols.noBio')}</p>
                <p className="mt-4 self-start rounded-md bg-moss-lo px-2.5 py-0.5 text-sm text-moss-hi"><Points value={v.points} /></p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
