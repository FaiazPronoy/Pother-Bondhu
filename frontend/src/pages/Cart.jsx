import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Minus, Plus, Trash2, Heart } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { Empty, PageHeader, Points } from '../components/bits';

export const DONATIONS = [0, 20, 50, 100];

const Cart = () => {
  const { cart, updateCartItemQuantity, removeFromCart, isLoggedIn, setCart, backendUrl } = useContext(AppContext);
  const [stockMap, setStockMap] = useState({});
  const [donation, setDonation] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const total = subtotal + donation;

  // stock may have changed since things went into the cart, so check once on arrival
  useEffect(() => {
    if (cart.length === 0) return;
    (async () => {
      const stock = {};
      const adjusted = [];
      await Promise.all(cart.map(async (item) => {
        try {
          const res = await axios.get(`${backendUrl}/api/products/${item.id}`);
          const p = res.data.product;
          stock[item.id] = p.stockQuantity;
          if (p.stockQuantity === 0) {
            toast.info(`${item.name} ran out and was taken out of your cart.`);
          } else {
            const quantity = Math.min(item.quantity, p.stockQuantity);
            if (quantity < item.quantity) toast.info(`Only ${quantity} of ${item.name} left, so the cart was changed.`);
            adjusted.push({ ...item, sellingPrice: p.sellingPrice, stockQuantity: p.stockQuantity, quantity });
          }
        } catch {
          adjusted.push(item);
        }
      }));
      setStockMap(stock);
      // keep the cart's order
      setCart(cart.map((c) => adjusted.find((a) => a.id === c.id)).filter(Boolean));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProceed = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname } });
    } else {
      navigate('/checkout', { state: { from: 'cart', donation } });
    }
  };

  if (cart.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Cart" title="Your cart" />
        <Empty title="Your cart is empty" action={<Link to="/products" className="btn btn-clay">Go to the shop</Link>}>
          Food, bowls and bedding for the animals you look after are in the shop.
        </Empty>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Cart" title="Your cart" />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="card divide-y divide-line">
          {cart.map((item) => {
            const stock = stockMap[item.id] ?? item.stockQuantity ?? 0;
            return (
              <li key={item.id} className="p-4 sm:p-5 flex gap-4">
                <img src={item.imageUrl} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-sunken shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/products/${item.id}`} className="font-semibold text-lg leading-snug hover:text-clay">{item.name}</Link>
                    <button onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}
                      className="w-10 h-10 -mr-2 -mt-1 grid place-items-center rounded-full text-ink-2 hover:text-danger hover:bg-sunken shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-ink-2">{item.sellingPrice.toLocaleString('en-IN')} each</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full border-[1.5px] border-line-2">
                      <button type="button" onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                        className="w-10 h-10 grid place-items-center disabled:opacity-40" aria-label={`One fewer ${item.name}`}><Minus size={16} /></button>
                      <span className="w-8 text-center font-semibold tabular-nums">{item.quantity}</span>
                      <button type="button" onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= stock}
                        className="w-10 h-10 grid place-items-center disabled:opacity-40" aria-label={`One more ${item.name}`}><Plus size={16} /></button>
                    </div>
                    <Points value={item.sellingPrice * item.quantity} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card p-5 h-fit lg:sticky lg:top-6 space-y-5">
          <div className="flex justify-between"><span className="text-ink-2">Items</span><Points value={subtotal} /></div>

          <fieldset>
            <legend className="label inline-flex items-center gap-2"><Heart size={16} className="text-clay" aria-hidden="true" /> Add something for rescues?</legend>
            <div className="grid grid-cols-4 gap-2">
              {DONATIONS.map((d) => (
                <button key={d} type="button" className="chip justify-center !px-0" aria-pressed={donation === d} onClick={() => setDonation(d)}>
                  {d === 0 ? 'No' : `+${d}`}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-between items-baseline border-t border-line pt-4">
            <span className="font-semibold">Total</span>
            <Points value={total} className="text-2xl font-display text-clay" />
          </div>
          <button onClick={handleProceed} className="btn btn-clay w-full text-base">
            {isLoggedIn ? 'Go to checkout' : 'Sign in to check out'}
          </button>
        </aside>
      </div>
    </>
  );
};

export default Cart;
