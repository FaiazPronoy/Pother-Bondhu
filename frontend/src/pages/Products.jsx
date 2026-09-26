import { useContext, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { AppContext } from '../context/AppContext';
import { Empty, PageHeader } from '../components/bits';
import { useLang } from '../context/LangContext';

const CATEGORIES = ['all', 'food', 'accessories', 'toys', 'health'];

// one page for the shop, a category and a search: they only differ in the filter
const Products = () => {
  const { productData, productLoading } = useContext(AppContext);
  const { t } = useLang();
  const { category = 'all' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') || '';
  const [typed, setTyped] = useState(q);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return productData.filter((p) =>
      (category === 'all' || p.category?.toLowerCase() === category) &&
      (!needle || p.name.toLowerCase().includes(needle) || (p.description || '').toLowerCase().includes(needle)));
  }, [productData, category, q]);

  const search = (e) => {
    e.preventDefault();
    const term = typed.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/products');
  };

  return (
    <>
      <PageHeader eyebrow={t('shop.eyebrow')} title={q ? t('shop.results', { q }) : t('shop.title')}>{t('shop.lead')}</PageHeader>

      <div className="flex flex-col items-center gap-4 mb-10">
        <form onSubmit={search} className="relative w-full max-w-lg" role="search">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden="true" />
          <input type="search" value={typed} onChange={(e) => setTyped(e.target.value)} className="field pl-10"
            placeholder={t('shop.search')} aria-label={t('shop.searchLabel')} />
        </form>
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t('shop.cats')}>
          {CATEGORIES.map((key) => (
            <button key={key} type="button" className="chip" aria-pressed={!q && category === key}
              onClick={() => { setTyped(''); navigate(key === 'all' ? '/products' : `/products/category/${key}`); }}>
              {t(`shopCat.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {productLoading ? (
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[3/4]" />)}
        </div>
      ) : shown.length === 0 ? (
        <Empty title={t('shop.none')}>{t('shop.noneText')}</Empty>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </>
  );
};

export default Products;
