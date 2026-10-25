import mongoose from 'mongoose';
import Product from '../models/ProductModel.js';
import Order from '../models/Order.js';

const LOW_STOCK = 10;
const EDITABLE = ['name', 'description', 'purchaseCost', 'sellingPrice', 'imageUrl', 'stockQuantity', 'category', 'features'];

export const getAllProducts = async (req, res) => {
  try {
    res.json(await Product.find());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const key = req.params.id;
    let product = await Product.findOne({ id: key });
    if (!product && mongoose.Types.ObjectId.isValid(key)) {
      product = await Product.findById(key);
    }
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const countProducts = async (req, res) => {
  try {
    res.json({ count: await Product.countDocuments() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    res.json(await Product.find({ stockQuantity: { $lte: LOW_STOCK } }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMostOrderedProducts = async (req, res) => {
  try {
    const top = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', imageUrl: { $first: '$items.imageUrl' }, orders: { $sum: '$items.quantity' } } },
      { $sort: { orders: -1 } },
      { $limit: 5 },
    ]);
    res.json(top.map(({ _id, imageUrl, orders }) => ({ name: _id, imageUrl, orders })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const fields = Object.fromEntries(EDITABLE.map((key) => [key, req.body[key]]));
    const product = await Product.create({
      ...fields,
      id: req.body.id,
      stockQuantity: req.body.stockQuantity ?? 0,
      features: req.body.features ?? [],
      productAddDate: req.body.productAddDate,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    for (const key of EDITABLE) {
      if (req.body[key] !== undefined) product[key] = req.body[key];
    }
    res.json(await product.save());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
