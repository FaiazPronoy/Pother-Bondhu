import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Plus, Users } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Empty } from '../components/bits';
import { useLang } from '../context/LangContext';

const TYPES = ['', 'Rescue', 'Medical', 'Other'];

const Teams = () => {
  const { backendUrl, userData } = useContext(AppContext);
  const { t, area } = useLang();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingValue, setTypingValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filterType, setFilterType] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(typingValue.trim()), 300);
    return () => clearTimeout(id);
  }, [typingValue]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const params = new URLSearchParams();
        if (debounced) params.set('search', debounced);
        if (filterType) params.set('type', filterType);
        // /all populates members; the search route does not, but has the count
        const url = debounced
          ? `${backendUrl}/api/teams?${params}`
          : `${backendUrl}/api/teams/all${filterType ? `?type=${filterType}` : ''}`;

        const res = await fetch(url, { signal: abortRef.current.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(t('teams.loadFail'));
        setTeams(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        if (err.name !== 'AbortError') setError(t('teams.loadFail'));
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
    return () => abortRef.current?.abort();
  }, [debounced, filterType, backendUrl]);

  return (
    <>
      <PageHeader
        eyebrow={t('teams.eyebrow')}
        title={t('teams.title')}
        action={userData?.role === 'volunteer' && (
          <Link to="/createteam" className="btn btn-clay"><Plus size={18} aria-hidden="true" /> {t('teams.start')}</Link>
        )}
      >
        {t('teams.lead')}
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-4 md:items-center mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden="true" />
          <input
            type="search"
            value={typingValue}
            onChange={(e) => setTypingValue(e.target.value)}
            placeholder={t('teams.search')}
            className="field pl-10"
            aria-label={t('teams.searchLabel')}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('teams.type')}>
          {TYPES.map((value) => (
            <button key={value || 'all'} type="button" className="chip" aria-pressed={filterType === value} onClick={() => setFilterType(value)}>
              {value ? t(`teamType.${value}`) : t('teams.all')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-44" />)}
        </div>
      ) : error ? (
        <Empty title={t('teams.loadFail')} />
      ) : teams.length === 0 ? (
        <Empty title={t('teams.none')}>{t('teams.noneText')}</Empty>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <li key={team._id}>
              <Link to={`/teams/${team._id}`} className="card p-6 h-full flex flex-col hover:border-line-2 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className={`tag ${team.category === 'Medical' ? 'tag-moss' : team.category === 'Other' ? 'tag-sun' : 'tag-clay'}`}>
                    {t(`teamType.${team.category || 'Rescue'}`)}
                  </span>
                  <span className="text-sm text-ink-2 inline-flex items-center gap-1">
                    <Users size={15} aria-hidden="true" /> {t('common.members', { n: team.members?.length || 0 })}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold">{team.name}</h2>
                <p className="mt-1 text-ink-2 inline-flex items-center gap-1"><MapPin size={15} aria-hidden="true" /> {area(team.area || 'Dhaka')}</p>
                {team.description && <p className="mt-3 text-ink-2 line-clamp-2">{team.description}</p>}
                {team.creator?.name && <p className="mt-auto pt-4 text-sm text-ink-2">{t('teams.startedBy', { name: team.creator.name })}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Teams;
