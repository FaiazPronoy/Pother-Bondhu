
import Order from '../models/Order.js';
import User from '../models/userModel.js';
import Product from '../models/ProductModel.js'; 
import mongoose from 'mongoose';

// Place an order.
// Stock and points are taken with conditional updates ("only if there is
// enough"), so two orders arriving together cannot both spend the same
// points or the last item. If a later step fails, the earlier ones are put back.
export const placeOrder = async (req, res) => {
  const userId = req.userId;
  const { items, name, phone, address, shipping, promo, donation } = req.body;

  if (!items || !name || !phone || !address || !shipping) {
    return res.status(400).json({ success: false, message: "Please fill in all required fields." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Your cart is empty." });
  }

  const donationPoints = Number(donation) || 0;
  if (donationPoints < 0 || !Number.isInteger(donationPoints)) {
    return res.status(400).json({ success: false, message: "Donation must be a whole number of points." });
  }

  const taken = []; // stock already reserved, so it can be returned on failure
  let charged = 0;
  const giveBack = () => Promise.all(taken.map((t) =>
    Product.updateOne({ _id: t._id }, { $inc: { stockQuantity: t.quantity } })));

  try {
    // the same product twice in one order counts as one line
    const wanted = new Map();
    for (const item of items) {
      const key = String(item.id || item._id || '');
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ success: false, message: `Invalid quantity for ${item.name || key}` });
      }
      wanted.set(key, (wanted.get(key) || 0) + quantity);
    }

    const lines = [];
    let totalPoints = 0;
    for (const [key, quantity] of wanted) {
      let product = await Product.findOne({ id: key });
      if (!product && mongoose.Types.ObjectId.isValid(key)) product = await Product.findById(key);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${key}` });
      }
      lines.push({ product, quantity });
      totalPoints += Number(product.sellingPrice) * quantity;
    }
    totalPoints += donationPoints;

    for (const { product, quantity } of lines) {
      const got = await Product.updateOne(
        { _id: product._id, stockQuantity: { $gte: quantity } },
        { $inc: { stockQuantity: -quantity } }
      );
      if (got.modifiedCount !== 1) {
        await giveBack();
        return res.status(400).json({ success: false, message: `Not enough stock for ${product.name}` });
      }
      taken.push({ _id: product._id, quantity });
    }

    const paid = await User.updateOne(
      { _id: userId, points: { $gte: totalPoints } },
      { $inc: { points: -totalPoints } }
    );
    if (paid.modifiedCount !== 1) {
      await giveBack();
      return res.status(400).json({ success: false, message: "Not enough PetPoints." });
    }
    charged = totalPoints;

    const newOrder = await Order.create({
      userId,
      items: lines.map(({ product, quantity }) => ({
        productId: product._id,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity,
        sellingPrice: Number(product.sellingPrice),
        purchaseCost: Number(product.purchaseCost) || 0,
      })),
      userInfo: { name, phone, address, shipping, promo },
      donation: donationPoints,
      totalPoints,
    });

    res.status(200).json({ success: true, message: "Order placed successfully.", orderId: newOrder._id });
  } catch (error) {
    console.error("Order placement error:", error);
    await giveBack().catch(() => {});
    if (charged) await User.updateOne({ _id: userId }, { $inc: { points: charged } }).catch(() => {});
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Admin: Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders." });
  }
};

// Admin: Delete order
export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByIdAndDelete(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.status(200).json({ success: true, message: 'Order deleted successfully.' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status || !['Pending', 'Out for Delivery', 'Delivered'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status provided." });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

// Notify frontend (real-time order status update)

    
    res.status(200).json({ success: true, message: 'Order status updated successfully.', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};