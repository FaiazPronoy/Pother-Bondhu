import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TeamDetailsModal from "../components/TeamDetailsModal";

const backendUrl = "http://localhost:4000";


const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const abortRef = useRef(null);
  const [typingValue, setTypingValue] = useState(''); // for debounced search
  const [debounced, setDebounced] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [filterType, setFilterType] = useState(''); // '' | 'Rescue' | 'Medical'

  // Simple debounce
  useEffect(() => {
    const id = setTimeout(() => setDebounced(typingValue.trim()), 300);
    return () => clearTimeout(id);
  }, [typingValue]);

  // Unified fetch that works with either array or {items: [...]}
  const fetchTeams = async (name = '', type = filterType) => {
    try {
      setLoading(true);
      setError(null);
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const q = name.trim();
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (type) params.set('type', type);
      const url = q || type
        ? `${backendUrl}/api/teams?${params.toString()}`
        : `${backendUrl}/api/teams/all`;

      const res = await fetch(url, { signal: abortRef.current.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch teams');

      const list = Array.isArray(data) ? data : (data.items || []);
      setTeams(list);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTeams();
    return () => abortRef.current?.abort();
  }, []);

  // Live (debounced) search as you type
  useEffect(() => {
    fetchTeams(debounced, filterType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, filterType]);

  const handleSearch = (e) => {
    e.preventDefault();
    setTypingValue(searchName); // sync immediate search on submit
  };

  const handleViewTeam = (team) => {
    const key = team.slug || team.id || team._id;
    setSelectedKey(key);
    setSelectedTitle(team.name);
    setModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar with Search */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">All Rescue Teams</h1>

                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => {
                        setSearchName(e.target.value);
                        setTypingValue(e.target.value); // trigger debounce
                      }}
                      placeholder="Search by team name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Search by team name"
                    />
                    <svg
                      className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </form>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-700 mb-3">Quick Filters</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setFilterType('Rescue')}
                      className={`text-sm px-3 py-1 rounded-full transition ${
                        filterType === 'Rescue'
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                      }`}
                    >
                      Rescue Teams
                    </button>

                    <button
                      onClick={() => setFilterType('Medical')}
                      className={`text-sm px-3 py-1 rounded-full transition ${
                        filterType === 'Medical'
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                      }`}
                    >
                      Medical Teams
                    </button>

                    <button
                      onClick={() => setFilterType('')}
                      className={`text-sm px-3 py-1 rounded-full transition ${
                        !filterType
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                      }`}
                    >
                      Show All
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                  <div className="text-red-600">{error}</div>
                </div>
              ) : teams.length === 0 ? (
                <div className="col-span-2">
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No teams found</h3>
                    <p className="mt-1 text-gray-500">Try adjusting your search or filter</p>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {teams.map((team) => {
                    const key = team.slug || team.id || team._id; // canonical for routing
                    return (
                      <div
                        key={team._id || team.id || key}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300"
                      >
                        <div className="p-6">
                          <h2 className="text-xl font-semibold text-black-700 mb-4">
                            {team.name}
                          </h2>

                          <div className="pt-4 border-t border-gray-100">
                              <button
                                onClick={() => handleViewTeam(team)}
                                className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-4 rounded-full transition duration-200"
                              >
                                View Team Details
                              </button>
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    {/* Team Details Modal */}
    <TeamDetailsModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      teamKey={selectedKey}
      title={selectedTitle}
    />

    </>
  );
};

export default Teams;
