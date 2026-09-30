import React, { useState, useEffect, useContext } from 'react';
import { X, Coins, CalendarDays, PiggyBank, HeartHandshake } from 'lucide-react';
import AdminNavbar from './AdminNavbar';
import { DarkmodeContext } from '../context/DarkmodeContext';
import axios from 'axios';
import { backendUrl } from '../config';
import { petPoints } from './bits';

// what the shop sold, what those products cost us, and what was given for rescues
const sum = (orders) => {
    let sales = 0, cost = 0, donations = 0;
    for (const order of orders) {
        for (const item of order.items || []) {
            sales += (item.sellingPrice || 0) * (item.quantity || 0);
            cost += (item.purchaseCost || 0) * (item.quantity || 0);
        }
        donations += order.donation || 0;
    }
    return { sales, cost, profit: sales - cost, donations, count: orders.length };
};

// the week starts on Sunday, the month on the 1st
const startOfWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
};
const startOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
};

const Card = ({ title, icon: Icon, iconClass, value, valueClass, note, onClick }) => {
    const { isDarkMode } = useContext(DarkmodeContext);
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl shadow-md p-6 border text-left hover:-translate-y-0.5 transition-transform ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-white/10'}`}>
            <h3 className={`text-lg font-semibold text-center ${isDarkMode ? 'text-gray-200' : 'text-blue-700'} mb-4`}>{title}</h3>
            <div className="flex items-center justify-center">
                <Icon className={`w-8 h-8 mr-2 shrink-0 ${iconClass}`} aria-hidden="true" />
                <p className={`text-2xl font-semibold ${valueClass || (isDarkMode ? 'text-gray-200' : 'text-blue-700')}`}>{value}</p>
            </div>
            <p className={`mt-2 text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{note}</p>
        </button>
    );
};

// clicking a card shows the orders behind its number
const OrdersModal = ({ title, orders, totals, onClose }) => {
    const { isDarkMode } = useContext(DarkmodeContext);
    const row = `flex justify-between py-2 px-3 rounded-md ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-800'}`;

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30 p-4" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl shadow-lg p-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h3>
                    <button onClick={onClose} aria-label="Close" className={`p-1 rounded-full ${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}>
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-2 mb-5">
                    <div className={row}><span>Shop sales</span><span>{petPoints(totals.sales)}</span></div>
                    <div className={row}><span>Cost of those products</span><span>{petPoints(totals.cost)}</span></div>
                    <div className={`${row} font-semibold`}><span>Profit</span><span className={totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}>{petPoints(totals.profit)}</span></div>
                    <div className={row}><span>Given for rescues</span><span>{petPoints(totals.donations)}</span></div>
                </div>
                {orders.length === 0 ? (
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No orders in this period yet.</p>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead className={isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}>
                            <tr>
                                <th className="px-3 py-2 text-left">Date</th>
                                <th className="px-3 py-2 text-left">Customer</th>
                                <th className="px-3 py-2 text-left">Items</th>
                                <th className="px-3 py-2 text-right">Paid</th>
                            </tr>
                        </thead>
                        <tbody className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
                            {orders.map((order) => (
                                <tr key={order._id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                    <td className="px-3 py-2 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                                    <td className="px-3 py-2">{order.userInfo?.name || 'Unknown'}</td>
                                    <td className="px-3 py-2">{(order.items || []).map((i) => `${i.name} × ${i.quantity}`).join(', ')}</td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">{petPoints(order.totalPoints)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const RevenuePage = () => {
    const { isDarkMode } = useContext(DarkmodeContext);
    // start folded on a phone, where the open sidebar takes most of the screen
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
    const [activeTab, setActiveTab] = useState('Revenue & Profit');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/orders/all`, { withCredentials: true });
                if (data.success) setOrders(data.orders || []);
                else setError(data.message || 'Could not load the orders.');
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load the orders.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const weekOrders = orders.filter((o) => new Date(o.createdAt) >= startOfWeek());
    const monthOrders = orders.filter((o) => new Date(o.createdAt) >= startOfMonth());
    const all = sum(orders);
    const week = sum(weekOrders);
    const month = sum(monthOrders);
    const average = all.count ? (all.sales + all.donations) / all.count : 0;
    const monthName = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    const profitClass = (n) => (n >= 0 ? 'text-green-600' : 'text-red-600');

    const periods = {
        all: { title: 'All orders', orders, totals: all },
        week: { title: 'This week (from Sunday)', orders: weekOrders, totals: week },
        month: { title: monthName, orders: monthOrders, totals: month },
    };

    return (
        <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <AdminNavbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
            <div className="flex-1 min-w-0 p-4 sm:p-6">
                <h1 className={`text-3xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}><u>Revenue & Profit</u></h1>
                <p className={`text-center mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Everything is in PetPoints. Click a card to see the orders behind it.</p>

                {loading ? (
                    <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading the orders...</p>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : (
                    <>
                        <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>All time</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card title="Shop sales" icon={Coins} iconClass="text-emerald-600" value={petPoints(all.sales)}
                                note={`From ${all.count} ${all.count === 1 ? 'order' : 'orders'}.`} onClick={() => setOpen('all')} />
                            <Card title="Product cost" icon={Coins} iconClass="text-lime-600" value={petPoints(all.cost)}
                                note="What the products we sold cost us." onClick={() => setOpen('all')} />
                            <Card title="Profit" icon={PiggyBank} iconClass="text-green-600" value={petPoints(all.profit)} valueClass={profitClass(all.profit)}
                                note="Shop sales minus product cost." onClick={() => setOpen('all')} />
                            <Card title="Given for rescues" icon={HeartHandshake} iconClass="text-orange-600" value={petPoints(all.donations)}
                                note={`Added at checkout. An order pays ${petPoints(average)} on average.`} onClick={() => setOpen('all')} />
                        </div>

                        <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>This week and this month</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card title="Sales this week" icon={PiggyBank} iconClass="text-orange-600" value={petPoints(week.sales)}
                                note={`${week.count} ${week.count === 1 ? 'order' : 'orders'} since Sunday.`} onClick={() => setOpen('week')} />
                            <Card title="Profit this week" icon={PiggyBank} iconClass="text-lime-600" value={petPoints(week.profit)} valueClass={profitClass(week.profit)}
                                note={`After ${petPoints(week.cost)} of product cost.`} onClick={() => setOpen('week')} />
                            <Card title={`Sales in ${monthName.split(' ')[0]}`} icon={CalendarDays} iconClass="text-purple-600" value={petPoints(month.sales)}
                                note={`${month.count} ${month.count === 1 ? 'order' : 'orders'} in ${monthName}.`} onClick={() => setOpen('month')} />
                            <Card title={`Profit in ${monthName.split(' ')[0]}`} icon={CalendarDays} iconClass="text-green-600" value={petPoints(month.profit)} valueClass={profitClass(month.profit)}
                                note={`After ${petPoints(month.cost)} of product cost.`} onClick={() => setOpen('month')} />
                        </div>
                    </>
                )}

                {open && <OrdersModal {...periods[open]} onClose={() => setOpen(null)} />}
            </div>
        </div>
    );
};

export default RevenuePage;
