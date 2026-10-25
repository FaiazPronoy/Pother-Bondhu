// backend/models/Order.js
import mongoose from 'mongoose';


const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'user'
  },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      imageUrl: String,
      quantity: { type: Number, min: 1 },
      sellingPrice: { type: Number, min: 0 },
      purchaseCost: { type: Number, min: 0, default: 0 }
    }
  ],
  
  userInfo: {
    name: String,
    phone: String,
    address: String,
    promo: String,
    shipping: String
  },
  donation: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPoints: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Out for Delivery', 'Delivered'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
