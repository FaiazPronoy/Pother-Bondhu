import { useContext, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { AppContext } from '../context/AppContext';
import { Empty, PageHeader } from '../components/bits';

const CATEGORIES = [['all', 'Everything'], ['food', 'Food & treats'], ['accessories', 'Bowls, beds & leads'], ['toys', 'Toys'], ['health', 'Grooming & care']];

// one page for the shop, a category and a search: they only differ in the filter
const Products = () => {
  const { productData, productLoading } = useContext(AppContext);
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
      <PageHeader eyebrow="The shop" title={q ? `Results for “${q}”` : 'Supplies for the ones you look after'}>
        Pay with PetPoints. At checkout you can add a little extra that goes to rescues.
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-8">
        <form onSubmit={search} className="relative flex-1 max-w-md" role="search">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden="true" />
          <input type="search" value={typed} onChange={(e) => setTyped(e.target.value)} className="field pl-10"
            placeholder="Search food, beds, leads…" aria-label="Search the shop" />
        </form>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
          {CATEGORIES.map(([key, label]) => (
            <button key={key} type="button" className="chip" aria-pressed={!q && category === key}
              onClick={() => { setTyped(''); navigate(key === 'all' ? '/products' : `/products/category/${key}`); }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {productLoading ? (
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[3/4]" />)}
        </div>
      ) : shown.length === 0 ? (
        <Empty title="Nothing here">Try another word or category.</Empty>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </>
  );
};

export default Products;
