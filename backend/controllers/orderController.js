
import Order from '../models/Order.js';
import User from '../models/userModel.js';
import Product from '../models/ProductModel.js'; 
import mongoose from 'mongoose';

// Place an order
export const placeOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, name, phone, address, shipping, promo, donation } = req.body;

    if (!items || !name || !phone || !address || !shipping) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty." });
    }

    const donationPoints = Number(donation) || 0;
    if (donationPoints < 0) {
      return res.status(400).json({ success: false, message: "Donation cannot be negative." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    let totalPoints = 0;
    const resolvedItems = []; // keep the resolved DB products  quantities


    // Validate and calculate total points
    for (const item of items) {
      //const product = await Product.findOne({ id: item._id });
      const key = item.id || item._id;
      let product = await Product.findOne({ id: key });
      if (!product && mongoose.Types.ObjectId.isValid(key)) {
          product = await Product.findById(key);
      }

      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.name || key}` });
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ success: false, message: `Invalid quantity for ${product.name}` });
      }

      if (product.stockQuantity < quantity) {
        return res.status(400).json({ success: false, message: `Not enough stock for ${item.name}` });
      }

      totalPoints += Number(product.sellingPrice) * quantity;
      resolvedItems.push({
              id: product.id,
              _id: product._id,
              name: product.name,
              imageUrl: product.imageUrl,
              quantity,
              sellingPrice: Number(product.sellingPrice),
              purchaseCost: Number(product.purchaseCost) || 0
      });
    }

    totalPoints += donationPoints;

    if (user.points < totalPoints) {
      return res.status(400).json({ success: false, message: "Not enough PetPoints." });
    }

    const newOrder = new Order({
      userId,
      items: resolvedItems.map(({ _id, name, imageUrl, quantity, sellingPrice, purchaseCost }) => ({
        productId: _id, name, imageUrl, quantity, sellingPrice, purchaseCost
      })),
      userInfo: {
        name,
        phone,
        address,
        shipping,
        promo
      },
      donation,
      totalPoints
    });

    await newOrder.save();

    // Deduct stock and update products
    for (const it of resolvedItems) {
      await Product.updateOne(
        { id: it.id },
        { $inc: { stockQuantity: -it.quantity } 
      });
    }

    // Deduct PetPoints
    user.points -= totalPoints;
    await user.save();
    
    if (req.app.get("io")) {
      req.app.get("io").emit("orderPlaced", {
        userId,
        items,
        totalPoints
      });
    }

    res.status(200).json({ success: true, message: "Order placed successfully." });

  } catch (error) {
    console.error("Order placement error:", error);
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
    if (req.app.get("io")) {
      req.app.get("io").emit("orderUpdated", updatedOrder);
    }

    
    res.status(200).json({ success: true, message: 'Order status updated successfully.', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};