import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Check, X } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { Avatar, Empty, Loading, PageHeader, SignInPrompt, timeAgo } from '../components/bits';

const TeamInvitations = () => {
  const { backendUrl, isLoggedIn } = useContext(AppContext);
  const [invitations, setInvitations] = useState(null);
  const [answered, setAnswered] = useState({});

  useEffect(() => {
    if (!isLoggedIn) return;
    axios.get(`${backendUrl}/api/invites/me`)
      .then((r) => setInvitations(r.data))
      .catch(() => setInvitations([]));
  }, [backendUrl, isLoggedIn]);

  if (!isLoggedIn) return <SignInPrompt>Sign in to see your invitations.</SignInPrompt>;
  if (invitations === null) return <Loading />;

  const handleRespond = async (invite, status) => {
    try {
      await axios.patch(`${backendUrl}/api/invites/${invite._id}/respond`, { status });
      setAnswered((a) => ({ ...a, [invite._id]: status }));
      window.dispatchEvent(new Event("invites-changed"));
      toast.success(status === 'accepted' ? `Welcome to ${invite.team?.name}` : 'Invitation declined');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not answer that invitation');
    }
  };

  return (
    <>
      <PageHeader eyebrow="Invitations" title="Teams that want you">
        A team lead picked you. Join if you can help in their area; saying no is fine too.
      </PageHeader>

      {invitations.length === 0 ? (
        <Empty title="No invitations right now" action={<Link to="/teams" className="btn btn-line">Browse teams</Link>}>
          When a team lead invites you, it shows up here and on your rescue desk.
        </Empty>
      ) : (
        <ul className="space-y-4 max-w-3xl">
          {invitations.map((inv) => {
            const done = answered[inv._id];
            return (
              <li key={inv._id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar name={inv.from?.name} size="w-12 h-12" tone="moss" />
                <div className="flex-1 min-w-0">
                  <p className="text-lg">
                    <span className="font-semibold">{inv.from?.name || 'A team lead'}</span> invited you to{' '}
                    {inv.team ? <Link to={`/teams/${inv.team._id}`} className="font-semibold text-clay hover:underline">{inv.team.name}</Link> : 'a team'}
                  </p>
                  <p className="text-sm text-ink-2">{timeAgo(inv.createdAt)}</p>
                </div>
                {done ? (
                  <span className={`tag ${done === 'accepted' ? 'tag-moss' : 'tag-sun'}`}>{done === 'accepted' ? 'Joined' : 'Declined'}</span>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleRespond(inv, 'accepted')} className="btn btn-moss"><Check size={17} aria-hidden="true" /> Join</button>
                    <button onClick={() => handleRespond(inv, 'rejected')} className="btn btn-line"><X size={17} aria-hidden="true" /> Decline</button>
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
