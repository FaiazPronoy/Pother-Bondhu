import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Info, Users } from 'lucide-react';
import AdminNavbar from './AdminNavbar';
import { DarkmodeContext } from '../context/DarkmodeContext';

const VolunteerPage = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationFilter, setLocationFilter] = useState('');
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('Volunteers');
    const { isDarkMode } = useContext(DarkmodeContext);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

    useEffect(() => {
        const fetchVolunteers = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${backendUrl}/api/volunteers`, { withCredentials: true });
                setVolunteers(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load volunteers.');
            } finally {
                setLoading(false);
            }
        };
        fetchVolunteers();
    }, [backendUrl]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const locations = [...new Set(volunteers.map(v => v.location).filter(Boolean))].sort();

    const filteredVolunteers = locationFilter
        ? volunteers.filter(v => v.location === locationFilter)
        : volunteers;

    const formatDate = (value) =>
        value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

    const pageClass = isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#FDF6F0] text-gray-800';
    const cardClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-white/10';
    const headClass = isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-[#F5E9E2] text-[#A2574F]';
    const rowClass = isDarkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-[#FDF6F0] border-gray-200';

    return (
        <div className={`flex min-h-screen ${pageClass}`}>
            <AdminNavbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main className="flex-1 p-6 overflow-x-hidden">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-[#A2574F]'}`}>
                        Volunteers
                    </h1>
                    <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        aria-label="Filter volunteers by area"
                        className={`border rounded-md py-1.5 px-3 text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                        <option value="">All areas</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>

                {loading && (
                    <div className={`rounded-xl border p-10 text-center ${cardClass}`}>
                        Loading volunteers...
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 p-6 text-center">
                        <p className="mb-3">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && filteredVolunteers.length === 0 && (
                    <div className={`rounded-xl border p-10 text-center ${cardClass}`}>
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium mb-1">
                            {volunteers.length === 0 ? 'No volunteers have signed up yet' : 'No volunteers in this area'}
                        </p>
                        <p className="text-sm opacity-70">
                            {volunteers.length === 0
                                ? 'Volunteers appear here once someone registers with the volunteer role.'
                                : 'Try clearing the area filter.'}
                        </p>
                    </div>
                )}

                {!loading && !error && filteredVolunteers.length > 0 && (
                    <div className={`rounded-xl border shadow-md overflow-x-auto ${cardClass}`}>
                        <table className="min-w-full">
                            <thead className={headClass}>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Area</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Points</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVolunteers.map((volunteer) => (
                                    <tr key={volunteer._id} className={`border-t ${rowClass}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{volunteer.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{volunteer.location || '--'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right tabular-nums">{volunteer.points ?? 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(volunteer.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                            <button
                                                onClick={() => setSelectedVolunteer(volunteer)}
                                                aria-label={`View details for ${volunteer.name}`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Info className="w-5 h-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedVolunteer && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className={`rounded-xl border shadow-lg max-w-md w-full p-6 ${cardClass}`}>
                            <h2 className="text-xl font-bold mb-4">{selectedVolunteer.name}</h2>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="font-medium">Area</dt>
                                    <dd>{selectedVolunteer.location || '--'}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="font-medium">PetPoints</dt>
                                    <dd className="tabular-nums">{selectedVolunteer.points ?? 0}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="font-medium">Joined</dt>
                                    <dd>{formatDate(selectedVolunteer.createdAt)}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium mb-1">About</dt>
                                    <dd className="opacity-80">{selectedVolunteer.bio || 'No bio provided.'}</dd>
                                </div>
                            </dl>
                            <button
                                onClick={() => setSelectedVolunteer(null)}
                                className="mt-6 w-full bg-[#A2574F] text-white py-2 rounded-md hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VolunteerPage;
