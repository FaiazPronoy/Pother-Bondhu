import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
  items: [
    {
      // this is the product's own "id" string (e.g. SmartBowl-1), which is what
      // the cart works with on the client, not the mongo _id
      productId: { type: String, required: true },
      quantity: { type: Number, default: 1, min: 1 }
    }
  ]
}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);
