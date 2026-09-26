import React, { useContext, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Heart, Wallet } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { DONATIONS } from './Cart';
import { Empty, PageHeader, Points } from '../components/bits';
import { useLang } from '../context/LangContext';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, userData, isLoggedIn, backendUrl, setCart, checkAuthStatus } = useContext(AppContext);
  const { t, num, apiError } = useLang();
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
      toast.error(t('checkout.both', { name: product.name }));
    } else {
      setIncludeCart(true);
    }
    setShowCartBox(false);
  };

  const products = mergedProducts();

  // reaching /checkout directly, or refreshing it, loses what was being bought
  if (products.length === 0) {
    return (
      <Empty title={t('checkout.nothing')} action={<Link to="/cart" className="btn btn-clay">{t('checkout.goCart')}</Link>}>
        {t('checkout.nothingText')}
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
      toast.error(t('checkout.badPhone'));
      return;
    }
    if (short > 0) {
      toast.error(t('checkout.short', { n: short }));
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
        toast.success(effectiveDonation > 0 ? t('checkout.placedDonation', { n: effectiveDonation }) : t('checkout.placed'));
        // leave first and empty the cart in the same render, or this page
        // flashes its "nothing to check out" state on the way out.
        // A buy-now order leaves the cart alone unless the cart was added to it.
        navigate('/products', { replace: true });
        if (from === 'cart' || includeCart) setCart([]);
      } else {
        toast.error(apiError({ response }, 'checkout.fail'));
      }
    } catch (err) {
      toast.error(apiError(err, 'checkout.fail'));
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow={t('checkout.eyebrow')} title={t('checkout.title')} />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {showCartBox && (
            <div className="card p-5 border-sun">
              <p className="font-semibold">{t('checkout.alsoCart', { n: cart.length })}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={handleIncludeCart} className="btn btn-moss">{t('checkout.yesAdd')}</button>
                <button type="button" onClick={() => setShowCartBox(false)} className="btn btn-line">{t('checkout.justThis')}</button>
              </div>
            </div>
          )}

          <form id="checkout" onSubmit={handlePlaceOrder} className="card p-5 sm:p-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="label">{t('checkout.name')}</label>
                <input id="name" name="name" autoComplete="name" required maxLength={60} value={formData.name} onChange={handleChange} className="field" />
              </div>
              <div>
                <label htmlFor="phone" className="label">{t('checkout.phone')}</label>
                <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" required placeholder="017XXXXXXXX"
                  value={formData.phone} onChange={handleChange} className="field" />
              </div>
            </div>
            <div>
              <label htmlFor="address" className="label">{t('checkout.address')}</label>
              <textarea id="address" name="address" autoComplete="street-address" required maxLength={300}
                placeholder={t('checkout.addressHint')} value={formData.address} onChange={handleChange} className="field !min-h-24" />
            </div>
            <fieldset>
              <legend className="label">{t('checkout.delivery')}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {[['standard', t('checkout.standard'), t('checkout.standardNote')], ['express', t('checkout.express'), t('checkout.expressNote')]].map(([value, label, note]) => (
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
                <legend className="label inline-flex items-center gap-2"><Heart size={16} className="text-clay" aria-hidden="true" /> {t('cart.donate')}</legend>
                <div className="grid grid-cols-4 gap-2 max-w-sm">
                  {DONATIONS.map((d) => (
                    <button key={d} type="button" className="chip justify-center !px-0" aria-pressed={donationInput === d} onClick={() => setDonationInput(d)}>
                      {d === 0 ? t('cart.no') : `+${num(d)}`}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </form>
        </div>

        <aside className="card p-5 h-fit lg:sticky lg:top-6">
          <h2 className="text-xl font-semibold">{t('checkout.yourOrder')}</h2>
          <ul className="mt-4 divide-y divide-line">
            {products.map((item) => (
              <li key={item.id} className="py-3 flex items-center gap-3">
                <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover bg-sunken" />
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">{item.name}</span>
                  <span className="text-sm text-ink-2">× {num(item.quantity)}</span>
                </span>
                <span className="tabular-nums">{num(item.sellingPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {effectiveDonation > 0 && (
            <p className="flex justify-between py-2 text-clay"><span>{t('checkout.forRescues')}</span><span className="tabular-nums">{num(effectiveDonation)}</span></p>
          )}
          <p className="flex justify-between items-baseline border-t border-line pt-4 mt-2">
            <span className="font-semibold">{t('cart.total')}</span>
            <Points value={totalPoints} className="text-2xl font-display text-clay" />
          </p>
          <p className={`mt-3 text-sm rounded-xl p-3 flex items-center gap-2 ${short > 0 ? 'bg-clay-lo text-ink' : 'bg-moss-lo text-ink'}`}>
            <Wallet size={16} aria-hidden="true" />
            {short > 0
              ? <span>{t('checkout.youHave', { points: num(userData.points) })} <Link to="/profile?tab=wallet" className="font-semibold underline">{t('checkout.topUpMore', { n: short })}</Link></span>
              : <span>{t('checkout.paidFrom', { points: num(userData.points) })}</span>}
          </p>
          <button type="submit" form="checkout" disabled={placingOrder || short > 0} className="btn btn-clay w-full mt-4 text-base">
            {placingOrder ? t('checkout.placing') : t('checkout.place')}
          </button>
        </aside>
      </div>
    </>
  );
};

export default CheckoutPage;
