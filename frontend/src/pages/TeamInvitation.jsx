import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Check, X } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { Avatar, Empty, Loading, PageHeader, SignInPrompt } from '../components/bits';
import { useLang } from '../context/LangContext';

const TeamInvitations = () => {
  const { backendUrl, isLoggedIn } = useContext(AppContext);
  const { t, ago, apiError } = useLang();
  const [invitations, setInvitations] = useState(null);
  const [answered, setAnswered] = useState({});

  useEffect(() => {
    if (!isLoggedIn) return;
    axios.get(`${backendUrl}/api/invites/me`)
      .then((r) => setInvitations(r.data))
      .catch(() => setInvitations([]));
  }, [backendUrl, isLoggedIn]);

  if (!isLoggedIn) return <SignInPrompt>{t('invites.signIn')}</SignInPrompt>;
  if (invitations === null) return <Loading />;

  const handleRespond = async (invite, status) => {
    try {
      await axios.patch(`${backendUrl}/api/invites/${invite._id}/respond`, { status });
      setAnswered((a) => ({ ...a, [invite._id]: status }));
      window.dispatchEvent(new Event("invites-changed"));
      toast.success(status === 'accepted' ? t('invites.welcome', { team: invite.team?.name || '' }) : t('invites.declinedToast'));
    } catch (err) {
      toast.error(apiError(err, 'invites.fail'));
    }
  };

  return (
    <>
      <PageHeader eyebrow={t('invites.eyebrow')} title={t('invites.title')}>{t('invites.lead')}</PageHeader>

      {invitations.length === 0 ? (
        <Empty title={t('invites.none')} action={<Link to="/teams" className="btn btn-line">{t('invites.browse')}</Link>}>
          {t('invites.noneText')}
        </Empty>
      ) : (
        <ul className="space-y-4 max-w-3xl">
          {invitations.map((inv) => {
            const done = answered[inv._id];
            return (
              <li key={inv._id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar name={inv.from?.name} size="w-12 h-12" tone="moss" />
                <div className="flex-1 min-w-0">
                  {inv.team ? (
                    <Link to={`/teams/${inv.team._id}`} className="text-lg font-semibold text-clay hover:underline">{inv.team.name}</Link>
                  ) : (
                    <p className="text-lg font-semibold">{t('invites.aTeam')}</p>
                  )}
                  <p className="text-ink-2">{t('invites.invitedYou', { name: inv.from?.name || t('invites.aLead') })} · {ago(inv.createdAt)}</p>
                </div>
                {done ? (
                  <span className={`tag ${done === 'accepted' ? 'tag-moss' : 'tag-sun'}`}>{done === 'accepted' ? t('invites.joined') : t('invites.declined')}</span>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleRespond(inv, 'accepted')} className="btn btn-moss"><Check size={17} aria-hidden="true" /> {t('invites.join')}</button>
                    <button onClick={() => handleRespond(inv, 'rejected')} className="btn btn-line"><X size={17} aria-hidden="true" /> {t('invites.decline')}</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default TeamInvitations;
