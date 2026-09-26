import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { AppContext } from "../context/AppContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(AppContext);
  const inStock = product.stockQuantity > 0;
  const few = inStock && product.stockQuantity <= 5;

  return (
    <article className="card overflow-hidden flex flex-col h-full group">
      <Link to={`/products/${product.id || product._id}`} className="block relative">
        <img src={product.imageUrl} alt="" loading="lazy"
          className="w-full aspect-square object-cover bg-sunken group-hover:scale-[1.02] transition-transform duration-300" />
        {!inStock && <span className="absolute top-3 left-3 tag bg-ink text-paper">Out of stock</span>}
        {few && <span className="absolute top-3 left-3 tag tag-sun">Only {product.stockQuantity} left</span>}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-2">{product.category}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug">
          <Link to={`/products/${product.id || product._id}`} className="hover:text-clay">{product.name}</Link>
        </h3>
        <p className="mt-1 text-sm text-ink-2 line-clamp-2 flex-1">{product.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="leading-tight">
            <span className="block text-lg font-semibold text-clay tabular-nums">{Number(product.sellingPrice).toLocaleString("en-IN")}</span>
            <span className="block text-xs text-ink-2">PetPoints</span>
          </p>
          <button type="button" onClick={() => addToCart(product, 1)} disabled={!inStock}
            className="w-11 h-11 rounded-full bg-ink text-paper grid place-items-center hover:bg-clay disabled:opacity-40 disabled:hover:bg-ink"
            aria-label={`Add ${product.name} to cart`}>
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default React.memo(ProductCard);
