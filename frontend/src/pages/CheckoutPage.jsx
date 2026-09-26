import React, { useContext, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Heart, Wallet } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { DONATIONS } from './Cart';
import { Empty, PageHeader, Points } from '../components/bits';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, userData, isLoggedIn, backendUrl, setCart, checkAuthStatus } = useContext(AppContext);
  const { from, product, donation = 0 } = location.state || {};

  const [includeCart, setIncludeCart] = useState(false);
  const [showCartBox, setShowCartBox] = useState(from === 'buyNow' && cart.length > 0);
  const [donationInput, setDonationInput] = useState(0);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    phone: '',
    address: '',
    shipping: 'standard',
  });

  if (!isLoggedIn) return <Navigate to="/login" state={{ from: '/cart' }} replace />;

  const mergedProducts = () => {
    const productMap = {};
    const allItems = from === 'cart' ? cart : includeCart ? [product, ...cart] : [product];
    for (const item of allItems.filter(Boolean)) {
      const qty = item.quantity || 1;
      if (productMap[item.id]) productMap[item.id].quantity += qty;
      else productMap[item.id] = { ...item, quantity: qty };
    }
    return Object.values(productMap);
  };

  const handleIncludeCart = () => {
    const inCart = cart.find((c) => c.id === product.id);
    if (inCart && inCart.quantity + (product.quantity || 1) > product.stockQuantity) {
      toast.error(`There isn't enough ${product.name} in stock for both.`);
    } else {
      setIncludeCart(true);
    }
    setShowCartBox(false);
  };

  const products = mergedProducts();

  // reaching /checkout directly, or refreshing it, loses what was being bought
  if (products.length === 0) {
    return (
      <Empty title="Nothing to check out" action={<Link to="/cart" className="btn btn-clay">Go to your cart</Link>}>
        This page lost track of your order, which happens after a refresh. Your cart is still there.
      </Empty>
    );
  }

  const effectiveDonation = from === 'buyNow' ? donationInput : donation;
  const itemsTotal = products.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const totalPoints = itemsTotal + effectiveDonation;
  const short = totalPoints - (userData?.points || 0);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!/^01[3-9]\d{8}$/.test(formData.phone.trim())) {
      toast.error('Enter an 11 digit mobile number, like 017XXXXXXXX.');
      return;
    }
    if (short > 0) {
      toast.error(`You need ${short} more PetPoints for this order.`);
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await axios.post(`${backendUrl}/api/orders/place`, {
        items: products,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        shipping: formData.shipping,
        donation: effectiveDonation,
      });

      if (response.data.success) {
        await checkAuthStatus();
        toast.success(effectiveDonation > 0
          ? `Order placed, and ${effectiveDonation} PetPoints went to rescues. Thank you.`
          : 'Order placed. We will call before delivery.');
        // leave first and empty the cart in the same render, or this page
        // flashes its "nothing to check out" state on the way out.
        // A buy-now order leaves the cart alone unless the cart was added to it.
        navigate('/products', { replace: true });
        if (from === 'cart' || includeCart) setCart([]);
      } else {
        toast.error(response.data.message || 'The order did not go through. Try again.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'The order did not go through. Try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Checkout" title="Where should it go?" />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {showCartBox && (
            <div className="card p-5 border-sun">
              <p className="font-semibold">You also have {cart.length} thing{cart.length === 1 ? '' : 's'} in your cart. Order them together?</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={handleIncludeCart} className="btn btn-moss">Yes, add them</button>
                <button type="button" onClick={() => setShowCartBox(false)} className="btn btn-line">Just this one</button>
              </div>
            </div>
          )}

          <form id="checkout" onSubmit={handlePlaceOrder} className="card p-5 sm:p-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="label">Name</label>
                <input id="name" name="name" autoComplete="name" required maxLength={60} value={formData.name} onChange={handleChange} className="field" />
              </div>
              <div>
                <label htmlFor="phone" className="label">Mobile number</label>
                <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" required placeholder="017XXXXXXXX"
                  value={formData.phone} onChange={handleChange} className="field" />
              </div>
            </div>
            <div>
              <label htmlFor="address" className="label">Address</label>
              <textarea id="address" name="address" autoComplete="street-address" required maxLength={300}
                placeholder="House, road, area" value={formData.address} onChange={handleChange} className="field !min-h-24" />
            </div>
            <fieldset>
              <legend className="label">Delivery</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {[['standard', 'Standard', '3 to 5 days'], ['express', 'Express', 'Next day inside Dhaka']].map(([value, label, note]) => (
                  <label key={value} className={`flex items-start gap-3 rounded-xl border-[1.5px] p-4 cursor-pointer ${formData.shipping === value ? 'border-clay bg-clay-lo/40' : 'border-line-2'}`}>
                    <input type="radio" name="shipping" value={value} checked={formData.shipping === value} onChange={handleChange}
                      className="mt-1 w-4 h-4 accent-[var(--sb-clay)]" />
                    <span><span className="block font-semibold">{label}</span><span className="text-sm text-ink-2">{note}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            {from === 'buyNow' && (
              <fieldset>
                <legend className="label inline-flex items-center gap-2"><Heart size={16} className="text-clay" aria-hidden="true" /> Add something for rescues?</legend>
                <div className="grid grid-cols-4 gap-2 max-w-sm">
                  {DONATIONS.map((d) => (
                    <button key={d} type="button" className="chip justify-center !px-0" aria-pressed={donationInput === d} onClick={() => setDonationInput(d)}>
                      {d === 0 ? 'No' : `+${d}`}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </form>
        </div>

        <aside className="card p-5 h-fit lg:sticky lg:top-6">
          <h2 className="text-xl font-semibold">Your order</h2>
          <ul className="mt-4 divide-y divide-line">
            {products.map((item) => (
              <li key={item.id} className="py-3 flex items-center gap-3">
                <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover bg-sunken" />
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">{item.name}</span>
                  <span className="text-sm text-ink-2">× {item.quantity}</span>
                </span>
                <span className="tabular-nums">{(item.sellingPrice * item.quantity).toLocaleString('en-IN')}</span>
              </li>
            ))}
          </ul>
          {effectiveDonation > 0 && (
            <p className="flex justify-between py-2 text-clay"><span>For rescues</span><span className="tabular-nums">{effectiveDonation}</span></p>
          )}
          <p className="flex justify-between items-baseline border-t border-line pt-4 mt-2">
            <span className="font-semibold">Total</span>
            <Points value={totalPoints} className="text-2xl font-display text-clay" />
          </p>
          <p className={`mt-3 text-sm rounded-xl p-3 flex items-center gap-2 ${short > 0 ? 'bg-clay-lo text-ink' : 'bg-moss-lo text-ink'}`}>
            <Wallet size={16} aria-hidden="true" />
            {short > 0
              ? <span>You have {userData.points.toLocaleString('en-IN')}. <Link to="/profile?tab=wallet" className="font-semibold underline">Top up {short} more</Link></span>
              : <span>Paid from your {userData.points.toLocaleString('en-IN')} PetPoints</span>}
          </p>
          <button type="submit" form="checkout" disabled={placingOrder || short > 0} className="btn btn-clay w-full mt-4 text-base">
            {placingOrder ? 'Placing your order…' : 'Place order'}
          </button>
        </aside>
      </div>
    </>
  );
};

export default CheckoutPage;
