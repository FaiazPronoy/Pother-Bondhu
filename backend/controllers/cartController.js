import Cart from '../models/CartModel.js';
import Product from '../models/ProductModel.js';

export const saveUserCart = async (req, res) => {
  const userId = req.userId;
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ message: 'items must be an array' });
  }

  // the client sends whole product objects, but only the id and quantity are
  // worth storing - name and price are read back from the product itself
  const slimItems = items
    .map((item) => ({
      productId: item.id || item.productId,
      quantity: Math.max(1, Math.floor(Number(item.quantity)) || 1),
    }))
    .filter((item) => item.productId);

  try {
    const existingCart = await Cart.findOne({ userId });
    if (existingCart) {
      existingCart.items = slimItems;
      await existingCart.save();
    } else {
      await Cart.create({ userId, items: slimItems });
    }
    res.status(200).json({ message: 'Cart saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserCart = async (req, res) => {
  const userId = req.userId;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(200).json({ cart: [] });
    }

    const products = await Product.find({ id: { $in: cart.items.map((i) => i.productId) } });
    const byId = new Map(products.map((p) => [p.id, p]));

    // a product can be deleted while it is sitting in someone's cart
    const items = cart.items
      .filter((item) => byId.has(item.productId))
      .map((item) => {
        const product = byId.get(item.productId);
        return {
          id: product.id,
          _id: product._id,
          name: product.name,
          sellingPrice: product.sellingPrice,
          imageUrl: product.imageUrl,
          stockQuantity: product.stockQuantity,
          quantity: item.quantity,
        };
      });

    res.status(200).json({ cart: items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
