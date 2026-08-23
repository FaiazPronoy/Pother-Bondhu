import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const NotFound = () => {
  return (
    <div className="bg-blue-50 text-gray-800 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto py-24 px-6 text-center">
        <p className="text-6xl font-bold text-blue-600 mb-4">404</p>
        <h1 className="text-2xl font-bold mb-3">We couldn't find that page</h1>
        <p className="text-gray-600 mb-8">
          The link may be out of date, or the page may have moved.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to home
        </Link>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
