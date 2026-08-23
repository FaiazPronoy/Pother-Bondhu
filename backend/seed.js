import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import userModel from './models/userModel.js';
import Product from './models/ProductModel.js';
import Order from './models/Order.js';
import Team from './models/teamModel.js';

// image files that already live in frontend/public
const products = [
  { id: 'SP-001', name: 'Smart Bowl', category: 'tech', purchaseCost: 900, sellingPrice: 1450, stockQuantity: 24, imageUrl: '/SmartBowl.jpg',
    description: 'Weighing bowl that tracks how much your pet actually eats.', features: ['Portion tracking', 'App notifications', 'Dishwasher safe'] },
  { id: 'SP-002', name: 'Smart Collar', category: 'tech', purchaseCost: 1800, sellingPrice: 2700, stockQuantity: 15, imageUrl: '/SmartColler.jpg',
    description: 'GPS collar with an activity log, sized for cats and small dogs.', features: ['GPS', '5 day battery', 'Water resistant'] },
  { id: 'SP-003', name: 'Quantum Feeder', category: 'tech', purchaseCost: 2400, sellingPrice: 3600, stockQuantity: 8, imageUrl: '/QuantumFeeder.jpg',
    description: 'Automatic feeder with six programmable meals a day.', features: ['6 meals', 'Voice recorder', 'Backup battery'] },
  { id: 'SP-004', name: 'Veken Water Fountain', category: 'tech', purchaseCost: 1100, sellingPrice: 1750, stockQuantity: 19, imageUrl: '/VekenFountain.jpg',
    description: 'Circulating fountain that keeps water fresh for cats who ignore still bowls.', features: ['2.5L', 'Quiet pump', 'Carbon filter'] },
  { id: 'SP-005', name: 'Air Purifier', category: 'tech', purchaseCost: 3200, sellingPrice: 4800, stockQuantity: 6, imageUrl: '/AirPurifier.jpg',
    description: 'HEPA purifier aimed at pet dander and litter dust.', features: ['HEPA', 'Odour filter', 'Night mode'] },
  { id: 'SP-006', name: 'Super Food', category: 'food', purchaseCost: 650, sellingPrice: 990, stockQuantity: 60, imageUrl: '/SuperFood.jpg',
    description: 'Grain free dry food with salmon as the first ingredient.', features: ['2kg', 'Grain free', 'Omega 3'] },
  { id: 'SP-007', name: 'Pet Feeding Mat', category: 'accessories', purchaseCost: 220, sellingPrice: 390, stockQuantity: 45, imageUrl: '/PetFeedingMat.jpg',
    description: 'Silicone mat with a raised lip, so spilled water stays put.', features: ['Non slip', 'Waterproof', 'Rolls up'] },
  { id: 'SP-008', name: 'Comfort Bed', category: 'accessories', purchaseCost: 1400, sellingPrice: 2200, stockQuantity: 12, imageUrl: '/ComfortBed.jpg',
    description: 'Padded donut bed with a removable, washable cover.', features: ['Washable cover', 'Medium size', 'Anti slip base'] },
  { id: 'SP-009', name: 'Pet Toy Set', category: 'toys', purchaseCost: 300, sellingPrice: 550, stockQuantity: 38, imageUrl: '/PetToy.jpg',
    description: 'Five piece set of rope and squeaky toys.', features: ['5 pieces', 'Non toxic', 'Machine washable'] },
  { id: 'SP-010', name: 'Grooming Kit', category: 'health', purchaseCost: 750, sellingPrice: 1250, stockQuantity: 21, imageUrl: '/GroomingKit.jpg',
    description: 'Brush, comb, scissors and nail clippers in one case.', features: ['7 tools', 'Storage case', 'Stainless steel'] },
  { id: 'SP-011', name: 'Dog Nail Grinder Kit', category: 'health', purchaseCost: 850, sellingPrice: 1400, stockQuantity: 4, imageUrl: '/DogNailGrinderKit.jpg',
    description: 'Rechargeable grinder that is quieter than clippers.', features: ['USB rechargeable', 'Low noise', '3 speeds'] },
  { id: 'SP-012', name: 'Pee Pads', category: 'health', purchaseCost: 400, sellingPrice: 700, stockQuantity: 52, imageUrl: '/PeePads.jpg',
    description: 'Absorbent training pads, fifty to a pack.', features: ['50 pack', '5 layers', 'Leak proof'] },
];

const people = [
  { name: 'Admin', email: 'admin@savepaws.com', password: 'Admin@1234', role: 'admin', points: 0, location: 'Dhaka', bio: 'Runs the Save Paws shop and rescue network.' },
  { name: 'Nabila Rahman', email: 'nabila@savepaws.com', password: 'Volunteer@123', role: 'volunteer', points: 4200, location: 'Dhanmondi', bio: 'Fosters kittens and runs the Dhanmondi feeding route.' },
  { name: 'Tanvir Hasan', email: 'tanvir@savepaws.com', password: 'Volunteer@123', role: 'volunteer', points: 3100, location: 'Uttara', bio: 'Handles night rescues and transport to the clinic.' },
  { name: 'Sadia Islam', email: 'sadia@savepaws.com', password: 'Volunteer@123', role: 'volunteer', points: 2650, location: 'Mirpur', bio: 'Vet student, does first aid and vaccination drives.' },
  { name: 'Rafiq Ahmed', email: 'rafiq@savepaws.com', password: 'Volunteer@123', role: 'volunteer', points: 1800, location: 'Gulshan', bio: 'Weekend volunteer, mostly adoption day logistics.' },
  { name: 'Mehedi Khan', email: 'mehedi@savepaws.com', password: 'Donor@1234', role: 'donor', points: 6000, location: 'Banani', bio: '' },
  { name: 'Farhana Akter', email: 'farhana@savepaws.com', password: 'Donor@1234', role: 'donor', points: 4500, location: 'Bashundhara', bio: '' },
];

const teams = [
  { id: 'TEAM-01', name: 'Dhanmondi Street Feeders', area: 'Dhanmondi', category: 'Rescue', description: 'Daily feeding route around Dhanmondi lake.' },
  { id: 'TEAM-02', name: 'Night Rescue Unit', area: 'Uttara', category: 'Rescue', description: 'On call for injured animals after dark.' },
  { id: 'TEAM-03', name: 'Mirpur Vaccination Drive', area: 'Mirpur', category: 'Medical', description: 'Monthly vaccination and deworming camp.' },
];

// spread the demo orders over the last few weeks so the revenue charts have a shape
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const orderPlan = [
  { buyer: 'mehedi@savepaws.com', days: 2,  lines: [['SP-001', 1], ['SP-009', 2]], donation: 200, status: 'Delivered' },
  { buyer: 'farhana@savepaws.com', days: 4, lines: [['SP-006', 3]], donation: 0, status: 'Delivered' },
  { buyer: 'mehedi@savepaws.com', days: 6,  lines: [['SP-004', 1], ['SP-007', 2]], donation: 100, status: 'Delivered' },
  { buyer: 'farhana@savepaws.com', days: 9, lines: [['SP-010', 1]], donation: 0, status: 'Out for Delivery' },
  { buyer: 'mehedi@savepaws.com', days: 13, lines: [['SP-008', 1], ['SP-012', 1]], donation: 300, status: 'Delivered' },
  { buyer: 'farhana@savepaws.com', days: 18, lines: [['SP-002', 1]], donation: 0, status: 'Delivered' },
  { buyer: 'mehedi@savepaws.com', days: 24, lines: [['SP-011', 1], ['SP-009', 1]], donation: 0, status: 'Pending' },
  { buyer: 'farhana@savepaws.com', days: 30, lines: [['SP-003', 1], ['SP-006', 2]], donation: 500, status: 'Delivered' },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to', mongoose.connection.name);

  await Promise.all([
    userModel.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Team.deleteMany({}),
  ]);
  console.log('Cleared users, products, orders and teams');

  const createdUsers = await userModel.insertMany(
    people.map((p) => ({ ...p, password: bcrypt.hashSync(p.password, 10) }))
  );
  const userByEmail = new Map(createdUsers.map((u) => [u.email, u]));
  console.log(`Inserted ${createdUsers.length} users`);

  const createdProducts = await Product.insertMany(
    products.map((p) => ({ ...p, productAddDate: daysAgo(40) }))
  );
  const productById = new Map(createdProducts.map((p) => [p.id, p]));
  console.log(`Inserted ${createdProducts.length} products`);

  const volunteers = createdUsers.filter((u) => u.role === 'volunteer');
  await Team.insertMany(
    teams.map((t, i) => ({
      ...t,
      creator: volunteers[i % volunteers.length]._id,
      members: [volunteers[i % volunteers.length]._id, volunteers[(i + 1) % volunteers.length]._id],
      activities: [{ message: `${t.name} was created.` }],
    }))
  );
  console.log(`Inserted ${teams.length} teams`);

  const orders = orderPlan.map((plan) => {
    const buyer = userByEmail.get(plan.buyer);
    const items = plan.lines.map(([id, quantity]) => {
      const product = productById.get(id);
      return {
        productId: product._id,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity,
        sellingPrice: product.sellingPrice,
        purchaseCost: product.purchaseCost,
      };
    });
    const totalPoints =
      items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0) + plan.donation;

    return {
      userId: buyer._id,
      items,
      userInfo: { name: buyer.name, phone: '01700000000', address: `${buyer.location}, Dhaka`, promo: '', shipping: 'standard' },
      donation: plan.donation,
      totalPoints,
      status: plan.status,
      createdAt: daysAgo(plan.days),
      updatedAt: daysAgo(plan.days),
    };
  });

  await Order.insertMany(orders, { timestamps: false });
  console.log(`Inserted ${orders.length} orders`);

  const revenue = orders.reduce((sum, o) => sum + o.totalPoints, 0);
  console.log(`\nDone. Demo revenue across seeded orders: ${revenue} points`);
  console.log('Admin login:     admin@savepaws.com / Admin@1234');
  console.log('Volunteer login: nabila@savepaws.com / Volunteer@123');
  console.log('Donor login:     mehedi@savepaws.com / Donor@1234');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
