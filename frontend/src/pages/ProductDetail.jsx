import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Check, Minus, Plus } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { AppContext } from '../context/AppContext';
import { Empty, Loading, Points } from '../components/bits';
import { useLang } from '../context/LangContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, productData, isLoggedIn, backendUrl } = useContext(AppContext);
  const { t, num } = useLang();

  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
    const cached = productData.find((p) => String(p.id) === String(id) || String(p._id) === String(id));
    if (cached) {
      setProduct(cached);
      return;
    }
    axios.get(`${backendUrl}/api/products/${encodeURIComponent(id)}`)
      .then((r) => setProduct(r.data.product))
      .catch(() => setMissing(true));
  }, [id, productData, backendUrl]);

  if (missing) return <Empty title={t('shop.missing')} action={<Link to="/products" className="btn btn-clay">{t('shop.backToShop')}</Link>} />;
  if (!product) return <Loading />;

  const related = productData
    .filter((p) => p.id !== product.id)
    .sort((a, b) => (b.category === product.category) - (a.category === product.category))
    .slice(0, 4);

  const inStock = product.stockQuantity > 0;
  const maxQty = Math.min(product.stockQuantity || 0, 10);

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname } });
    } else {
      navigate('/checkout', { state: { from: 'buyNow', product: { ...product, quantity } } });
    }
  };

  return (
    <>
      <Link to="/products" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink font-medium mb-6">
        <ArrowLeft size={17} aria-hidden="true" /> {t('shop.back')}
      </Link>

      <div className="grid gap-8 lg:gap-12 md:grid-cols-2">
        <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover rounded-3xl bg-sunken" />

        <div className="flex flex-col">
          <p className="eyebrow">{t(`shopCat.${product.category}`)}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">{product.name}</h1>
          <p className="mt-4 text-3xl font-display text-clay"><Points value={product.sellingPrice} /></p>
          <p className="mt-4 text-lg text-ink-2">{product.description}</p>

          {product.features?.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-center gap-2"><Check size={18} className="text-moss" aria-hidden="true" /> {f}</li>
              ))}
            </ul>
          )}

          <p className={`mt-6 font-semibold ${inStock ? 'text-moss' : 'text-danger'}`}>
            {inStock ? t('shop.inStock', { n: product.stockQuantity }) : t('shop.outNow')}
          </p>

          {inStock && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border-[1.5px] border-line-2 bg-card">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
                  className="w-11 h-11 grid place-items-center rounded-full disabled:opacity-40" aria-label={t('shop.fewer')}><Minus size={18} /></button>
                <span className="w-10 text-center font-semibold tabular-nums" aria-live="polite" aria-label={t('shop.qty', { n: quantity })}>{num(quantity)}</span>
                <button type="button" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty}
                  className="w-11 h-11 grid place-items-center rounded-full disabled:opacity-40" aria-label={t('shop.more')}><Plus size={18} /></button>
              </div>
              <button className="btn btn-line flex-1 min-w-36" onClick={() => addToCart(product, quantity)}>{t('shop.addToCart')}</button>
              <button className="btn btn-clay flex-1 min-w-36" onClick={handleBuyNow}>{t('shop.buyNow')}</button>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="more-title">
          <h2 id="more-title" className="text-2xl font-semibold mb-6">{t('shop.alsoNeed')}</h2>
          <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
};

export default ProductDetail;
