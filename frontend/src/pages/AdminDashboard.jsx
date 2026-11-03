import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, ArrowRight, Boxes, Coins, CreditCard, PiggyBank, ShoppingCart, TrendingUp } from 'lucide-react';
import AdminNavbar from '../components/AdminNavbar';
import { DarkmodeContext } from '../context/DarkmodeContext';
import { backendUrl } from '../config';
import { petPoints } from '../components/bits';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLICE_COLOURS = ['#FFD700', '#9B59B6', '#FF69B4', '#1E90FF', '#2ECC71'];
const BAR_COLOUR = '#A2574F';

const startOfWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
};

const itemTotals = (order) => {
    let sales = 0, cost = 0;
    for (const item of order.items || []) {
        sales += (item.sellingPrice || 0) * (item.quantity || 0);
        cost += (item.purchaseCost || 0) * (item.quantity || 0);
    }
    return { sales, cost };
};

const summarise = (orders) => {
    const weekStart = startOfWeek();
    const now = new Date();
    const revenueByDay = Array(7).fill(0);
    const profitByDay = Array(7).fill(0);
    let paidIn = 0, sales = 0, cost = 0, month = 0;

    for (const order of orders) {
        const created = new Date(order.createdAt);
        const totals = itemTotals(order);
        paidIn += order.totalPoints || 0;
        sales += totals.sales;
        cost += totals.cost;
        if (created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()) {
            month += order.totalPoints || 0;
        }
        if (created >= weekStart) {
            revenueByDay[created.getDay()] += order.totalPoints || 0;
            profitByDay[created.getDay()] += totals.sales - totals.cost;
        }
    }

    return {
        pending: orders.filter((o) => o.status === 'Pending').length,
        average: orders.length ? paidIn / orders.length : 0,
        paidIn, cost, profit: sales - cost, month, revenueByDay, profitByDay,
    };
};

const Panel = ({ title, children }) => {
    const { isDarkMode } = useContext(DarkmodeContext);
    return (
        <section className={`rounded-xl shadow-md border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {title && <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{title}</h3>}
            {children}
        </section>
    );
};

const Stat = ({ to, title, value, icon: Icon, iconClass }) => {
    const { isDarkMode } = useContext(DarkmodeContext);
    return (
        <Link to={to} className={`relative block rounded-xl shadow-md border p-6 overflow-hidden transition hover:shadow-lg hover:-translate-y-0.5 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <span className="absolute left-0 inset-y-0 w-1 bg-blue-600" aria-hidden="true" />
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</h3>
                    <p className={`mt-1 text-2xl font-bold tabular-nums leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                </div>
                <Icon className={`w-10 h-10 shrink-0 ${iconClass}`} aria-hidden="true" />
            </div>
        </Link>
    );
};

const QuietWeek = () => {
    const { isDarkMode } = useContext(DarkmodeContext);
    return <p className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No orders this week yet</p>;
};

const BarChart = ({ values }) => {
    const { isDarkMode } = useContext(DarkmodeContext);
    if (!values.some(Boolean)) return <QuietWeek />;
    const max = Math.max(...values, 100);
    return (
        <svg viewBox="0 0 350 200" className="w-full h-[220px]" role="img" aria-label="Revenue for each day this week">
            {values.map((value, i) => {
                const height = (value / max) * 130;
                const x = i * 50 + 10;
                const y = 170 - height;
                return (
                    <g key={DAYS[i]}>
                        <text x={x + 15} y={y - 8} fontSize="11" fontWeight="bold" textAnchor="middle" fill={isDarkMode ? 'white' : 'black'}>
                            {value.toLocaleString('en-GB')}
                        </text>
                        <rect x={x} y={y} width="30" height={height} rx="6" fill={BAR_COLOUR} />
                        <text x={x + 15} y="190" fontSize="11" textAnchor="middle" fill={isDarkMode ? '#D1D5DB' : '#4B5563'}>{DAYS[i]}</text>
                    </g>
                );
            })}
        </svg>
    );
};

const LineChart = ({ values }) => {
    const { isDarkMode } = useContext(DarkmodeContext);
    if (!values.some(Boolean)) return <QuietWeek />;
    const max = Math.max(...values, 1);
    const points = values.map((value, i) => ({ x: 20 + i * 52, y: 150 - (value / max) * 120, value }));
    return (
        <svg viewBox="0 0 350 190" className="w-full h-[220px]" role="img" aria-label="Profit for each day this week">
            <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={BAR_COLOUR} strokeWidth="3" />
            {points.map((p, i) => (
                <g key={DAYS[i]}>
                    <circle cx={p.x} cy={p.y} r="5" fill={BAR_COLOUR} />
                    <text x={p.x} y={p.y - 10} fontSize="11" textAnchor="middle" fill={isDarkMode ? 'white' : 'black'}>{p.value}</text>
                    <text x={p.x} y="180" fontSize="11" textAnchor="middle" fill={isDarkMode ? '#D1D5DB' : '#4B5563'}>{DAYS[i]}</text>
                </g>
            ))}
        </svg>
    );
};

const DonutChart = ({ items }) => {
    const { isDarkMode } = useContext(DarkmodeContext);
    const total = items.reduce((sum, item) => sum + (Number(item.orders) || 0), 0);
    if (!total) return <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No orders yet</p>;

    const r = 90, hole = 35;
    const at = (angle, radius) => [r + radius * Math.cos((angle - 90) * Math.PI / 180), r + radius * Math.sin((angle - 90) * Math.PI / 180)];
    let start = 0;
    const slices = items.map((item, i) => {
        const angle = ((Number(item.orders) || 0) / total) * 360;
        const end = start + angle;
        const large = angle > 180 ? 1 : 0;
        const [x1, y1] = at(start, r), [x2, y2] = at(end, r), [x3, y3] = at(end, hole), [x4, y4] = at(start, hole);
        const [lx, ly] = at(start + angle / 2, r * 0.65);
        const slice = {
            key: item.name || i,
            colour: SLICE_COLOURS[i % SLICE_COLOURS.length],
            path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${hole} ${hole} 0 ${large} 0 ${x4} ${y4} Z`,
            label: [lx, ly, ((angle / 360) * 100).toFixed(1)],
        };
        start = end;
        return slice;
    });

    return (
        <div className="flex flex-wrap items-center justify-center gap-6">
            <svg width={r * 2} height={r * 2} role="img" aria-label="Share of orders by product">
                {slices.map((s) => (
                    <g key={s.key}>
                        <path d={s.path} fill={s.colour} stroke="#f3f4f6" strokeWidth="1" />
                        <text x={s.label[0]} y={s.label[1]} fontSize="10" fontWeight="bold" textAnchor="middle" fill="black">{s.label[2]}%</text>
                    </g>
                ))}
            </svg>
            <ul className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {items.map((item, i) => (
                    <li key={item.name || i} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SLICE_COLOURS[i % SLICE_COLOURS.length] }} />
                        {item.name || `Product ${i + 1}`}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const statusClass = { Pending: 'text-yellow-500', 'Out for Delivery': 'text-blue-500' };

const AdminDashboard = () => {
    const { isDarkMode } = useContext(DarkmodeContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [orders, setOrders] = useState([]);
    const [productCount, setProductCount] = useState(0);
    const [lowStock, setLowStock] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const get = (path) => axios.get(`${backendUrl}${path}`, { withCredentials: true }).then((r) => r.data);
        Promise.all([get('/api/orders/all'), get('/api/products/count'), get('/api/products/low-stock'), get('/api/products/most-ordered')])
            .then(([orderData, count, low, top]) => {
                setOrders(orderData.orders || []);
                setProductCount(count.count || 0);
                setLowStock(low);
                setTopProducts(top);
            })
            .catch((err) => setError(err.response?.data?.message || 'Could not load the dashboard.'))
            .finally(() => setLoading(false));
    }, []);

    const stats = useMemo(() => summarise(orders), [orders]);
    const muted = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    const link = `mt-4 inline-flex items-center text-sm hover:underline ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`;
    const show = (value) => (loading ? '…' : value);

    return (
        <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <AdminNavbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen((open) => !open)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main className="flex-1 min-w-0 p-4 sm:p-6">
                <h2 className={`text-3xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Admin Dashboard</h2>
                <p className={`text-center mb-10 ${muted}`}>Orders, stock and revenue. Profit does not include donations to rescues.</p>

                {error && (
                    <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${isDarkMode ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Stat to="/adminproducts" title="Total Products" value={show(productCount)} icon={Boxes} iconClass={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    <Stat to="/adminorders" title="Pending Orders" value={show(stats.pending)} icon={ShoppingCart} iconClass={isDarkMode ? 'text-yellow-200' : 'text-yellow-400'} />
                    <Stat to="/adminrevenue" title="Monthly Revenue" value={show(petPoints(stats.month))} icon={CreditCard} iconClass={isDarkMode ? 'text-green-500' : 'text-green-600'} />
                    <Stat to="/adminrevenue" title="Average Order Value" value={show(petPoints(stats.average.toFixed(2)))} icon={Coins} iconClass={isDarkMode ? 'text-gray-500' : 'text-blue-600'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                    <Panel title="Weekly Revenue"><BarChart values={stats.revenueByDay} /></Panel>
                    <Panel title="Most Ordered Products"><DonutChart items={topProducts} /></Panel>
                    <Panel title="Profit Trends This Week"><LineChart values={stats.profitByDay} /></Panel>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Panel title="Recent Orders">
                        <ul className={`space-y-3.5 text-sm ${muted}`}>
                            {orders.slice(0, 3).map((order) => (
                                <li key={order._id}>
                                    <span className="font-medium">#{order._id.slice(-6)} {order.userInfo?.name}</span>, {petPoints(order.totalPoints)} -{' '}
                                    <span className={statusClass[order.status] || 'text-green-500'}>{order.status}</span>
                                </li>
                            ))}
                        </ul>
                        <Link to="/adminorders" className={link}>
                            View All Orders <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </Panel>
                    <Panel title="Low Stock Alert">
                        <ul className={`space-y-3.5 text-sm ${muted}`}>
                            {lowStock.map((product) => (
                                <li key={product.id} className="flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                                    <span className="font-medium">{product.name}</span>&nbsp;- {product.stockQuantity} pcs
                                </li>
                            ))}
                        </ul>
                        <Link to="/adminproducts" className={link}>
                            Manage Stock <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </Panel>
                    <Panel title="Financial Overview">
                        <ul className={`space-y-3.5 text-sm ${muted}`}>
                            <li className="flex items-center gap-2"><Coins className="w-5 h-5 text-red-600" /><span><b>Ordered Purchase Cost</b>: {petPoints(stats.cost)}</span></li>
                            <li className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" /><span><b>Total Paid In</b>: {petPoints(stats.paidIn)}</span></li>
                            <li className="flex items-center gap-2"><PiggyBank className="w-5 h-5 text-purple-500" /><span><b>Net Profit</b>: {petPoints(stats.profit)}</span></li>
                        </ul>
                        <Link to="/adminrevenue" className={link}>
                            View Detailed Revenue <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </Panel>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
