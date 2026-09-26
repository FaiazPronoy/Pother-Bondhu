import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="py-16 text-center max-w-lg mx-auto">
      <div className="flex justify-center gap-3 text-line-2 mb-6" aria-hidden="true">
        <PawPrint size={28} className="-rotate-12 translate-y-3" />
        <PawPrint size={28} className="rotate-6" />
        <PawPrint size={28} className="-rotate-12 translate-y-3 opacity-60" />
        <PawPrint size={28} className="rotate-6 opacity-30" />
      </div>
      <p className="font-display text-7xl font-semibold text-clay">404</p>
      <h1 className="mt-3 text-3xl font-semibold">The trail goes cold here</h1>
      <p className="mt-3 text-ink-2 text-lg">This page doesn't exist, or it moved. The rest of the site is right where you left it.</p>
      <Link to="/" className="btn btn-clay mt-8">Back home</Link>
    </div>
  );
};

export default NotFound;
