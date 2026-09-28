import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import userModel from './models/userModel.js';
import Product from './models/ProductModel.js';
import Order from './models/Order.js';
import Team from './models/teamModel.js';
import RescueImage from './models/imageModel.js';
import TeamInvite from './models/inviteModel.js';
import Cart from './models/CartModel.js';
import { readFileSync } from 'fs';

// photos in frontend/public/img/shop, all from Unsplash (credits in the README)
const shop = '/img/shop';
const products = [
  { id: 'SP-001', name: 'Dry Dog Food, 3 kg', category: 'food', purchaseCost: 950, sellingPrice: 1350, stockQuantity: 40, imageUrl: `${shop}/dry-food.jpg`,
    description: 'Chicken and rice kibble that street dogs take to quickly. One bag feeds a small pack for about a week.', features: ['3 kg bag', 'Chicken and rice', 'Resealable'] },
  { id: 'SP-002', name: 'Bone Biscuits, 500 g', category: 'food', purchaseCost: 260, sellingPrice: 390, stockQuantity: 65, imageUrl: `${shop}/biscuits.jpg`,
    description: 'Crunchy biscuits for pockets. Good for earning trust with a nervous dog before a vet visit.', features: ['500 g', 'Baked, not fried', 'No added salt'] },
  { id: 'SP-003', name: 'Steel Paw Bowl', category: 'accessories', purchaseCost: 180, sellingPrice: 290, stockQuantity: 55, imageUrl: `${shop}/paw-bowl.jpg`,
    description: 'Heavy steel bowl with a rubber base. Leave it outside a shop for a water point that does not get kicked over.', features: ['1 litre', 'Rubber base', 'Rust resistant'] },
  { id: 'SP-004', name: 'Ceramic Food Bowl', category: 'accessories', purchaseCost: 240, sellingPrice: 380, stockQuantity: 30, imageUrl: `${shop}/ceramic-bowl.jpg`,
    description: 'Deep ceramic bowl for fosters at home. Easy to wash, too heavy to push around the floor.', features: ['Dishwasher safe', '800 ml', 'Glazed inside'] },
  { id: 'SP-005', name: 'Wicker Puppy Bed', category: 'accessories', purchaseCost: 900, sellingPrice: 1400, stockQuantity: 9, imageUrl: `${shop}/wicker-bed.jpg`,
    description: 'Small woven bed with a cushion, sized for puppies and cats recovering after treatment.', features: ['Removable cushion', '45 cm across', 'Hand woven'] },
  { id: 'SP-006', name: 'Round Cushion Bed', category: 'accessories', purchaseCost: 1200, sellingPrice: 1850, stockQuantity: 12, imageUrl: `${shop}/cushion-bed.jpg`,
    description: 'Soft donut bed with raised sides. Most fosters say this is the first thing a rescued dog sleeps properly in.', features: ['Washable cover', 'Medium size', 'Anti slip base'] },
  { id: 'SP-007', name: 'Polka Dot Bed', category: 'accessories', purchaseCost: 1100, sellingPrice: 1650, stockQuantity: 4, imageUrl: `${shop}/dot-bed.jpg`,
    description: 'Padded round bed with a bright cover, for small and medium dogs.', features: ['Machine washable', 'Small to medium', 'Thick base'] },
  { id: 'SP-008', name: 'Red Leash, 1.5 m', category: 'accessories', purchaseCost: 280, sellingPrice: 450, stockQuantity: 34, imageUrl: `${shop}/leash.jpg`,
    description: 'Waterproof coated webbing that does not smell after the rains. For clinic trips and adoption days.', features: ['1.5 m', 'Waterproof', 'Steel clip'] },
  { id: 'SP-009', name: 'Rubber Chew Bone', category: 'toys', purchaseCost: 220, sellingPrice: 350, stockQuantity: 28, imageUrl: `${shop}/chew-bone.jpg`,
    description: 'Tough rubber bone for teething puppies. Takes a treat in the ends to keep them busy.', features: ['Natural rubber', 'Treat holder', 'Floats'] },
  { id: 'SP-010', name: 'Plush Squeaky Toy', category: 'toys', purchaseCost: 190, sellingPrice: 320, stockQuantity: 22, imageUrl: `${shop}/plush-toy.jpg`,
    description: 'Soft toy with a squeaker. Popular with fosters who have just learned how to play.', features: ['Squeaker inside', 'Double stitched', 'Machine washable'] },
  { id: 'SP-011', name: 'Slicker Brush', category: 'health', purchaseCost: 260, sellingPrice: 420, stockQuantity: 25, imageUrl: `${shop}/slicker-brush.jpg`,
    description: 'Wooden brush with fine pins for knots, and for a tick check after a rescue.', features: ['Wooden handle', 'Fine steel pins', 'Cats and dogs'] },
  { id: 'SP-012', name: 'Deshedding Tool', category: 'health', purchaseCost: 700, sellingPrice: 1100, stockQuantity: 3, imageUrl: `${shop}/deshedding.jpg`,
    description: 'Takes out loose undercoat before summer. Also handy for checking the skin for mange and wounds.', features: ['Stainless blade', 'Push button clean', 'Rubber grip'] },
];

const people = [
  { name: 'Admin', email: 'admin@cholobachai.com', password: 'Admin@1234', role: 'admin', points: 0, location: 'Dhanmondi', bio: 'Runs the CholoBachai shop and keeps the board tidy.' },
  { name: 'Nabila Rahman', email: 'nabila@cholobachai.com', password: 'Volunteer@123', role: 'volunteer', points: 4200, location: 'Dhanmondi', bio: 'Fosters kittens and runs the Dhanmondi lake feeding route most evenings. Ask me about the three-legged one.' },
  { name: 'Tanvir Hasan', email: 'tanvir@cholobachai.com', password: 'Volunteer@123', role: 'volunteer', points: 3100, location: 'Uttara', bio: 'I have a car and I do not sleep much, so night rescues and clinic runs are mine.' },
  { name: 'Sadia Islam', email: 'sadia@cholobachai.com', password: 'Volunteer@123', role: 'volunteer', points: 2650, location: 'Mirpur', bio: 'Final year vet student. First aid, deworming and the monthly vaccination camp in Mirpur.' },
  { name: 'Rafiq Ahmed', email: 'rafiq@cholobachai.com', password: 'Volunteer@123', role: 'volunteer', points: 1800, location: 'Gulshan', bio: 'Weekend volunteer. Mostly cats around Gulshan 2 and adoption day logistics.' },
  { name: 'Arif Chowdhury', email: 'arif@cholobachai.com', password: 'Volunteer@123', role: 'volunteer', points: 950, location: 'Badda', bio: 'Tea stall on Link Road. The dogs here know the sound of my shutter opening.' },
  { name: 'Priya Das', email: 'priya@cholobachai.com', password: 'Volunteer@123', role: 'volunteer', points: 1400, location: 'Mohammadpur', bio: 'মায়ের সাথে ২০১৯ থেকে মোহাম্মদপুর বাজারের কুকুরগুলোকে খাওয়াই।' },
  { name: 'Mehedi Khan', email: 'mehedi@cholobachai.com', password: 'Donor@1234', role: 'donor', points: 6000, location: 'Banani', bio: '' },
  { name: 'Farhana Akter', email: 'farhana@cholobachai.com', password: 'Donor@1234', role: 'donor', points: 4500, location: 'Moghbazar', bio: '' },
];

// the first in crew leads the team; log entries are [who, message, hours ago]
const teams = [
  { id: 'TEAM-01', name: 'Dhanmondi Street Feeders', area: 'Dhanmondi', category: 'Rescue', crew: ['nabila', 'sadia', 'priya'],
    description: 'Evening feeding route around Dhanmondi lake and Road 27. We meet at 8 pm by the Rabindra Sarobar steps.',
    log: [['nabila', 'Fed 11 at the lake tonight. The brown mother is back with four pups.', 52], ['priya', 'মেহেদি ভাইয়ের পাঠানো পেটপয়েন্ট দিয়ে দুই ব্যাগ খাবার কিনলাম। অনেক ধন্যবাদ!', 30], ['nabila', 'Road 27 boy with the sore eye is going to the clinic tomorrow with Tanvir.', 6]] },
  { id: 'TEAM-02', name: 'Night Rescue Unit', area: 'Uttara', category: 'Rescue', crew: ['tanvir', 'rafiq', 'arif'],
    description: 'On call after dark for injured animals and road accidents. Message the lead first if it is urgent.',
    log: [['tanvir', 'Picked up a hit-and-run puppy near Sector 7 at 1 am. Stable at the clinic.', 70], ['arif', 'Can cover the Badda side on Thursdays now.', 20]] },
  { id: 'TEAM-03', name: 'Mirpur Vaccination Drive', area: 'Mirpur', category: 'Medical', crew: ['sadia', 'tanvir'],
    description: 'Monthly rabies vaccination and deworming camp, first Friday of the month at Mirpur 10.',
    log: [['sadia', '32 dogs vaccinated at the camp. We ran out of collars for marking, need more.', 96], ['tanvir', 'Collected the new vaccine batch.', 10]] },
  { id: 'TEAM-04', name: 'Gulshan Cat Watch', area: 'Gulshan', category: 'Other', crew: ['rafiq'],
    description: 'Keeping count of the cat colonies around the Gulshan and Banani markets, and finding fosters for kittens.',
    log: [['rafiq', 'Started this so the cat people have their own corner.', 40]] },
  { id: 'TEAM-05', name: 'Badda Link Road Patrol', area: 'Badda', category: 'Rescue', crew: ['arif', 'tanvir'],
    description: 'লিংক রোড আর রেলক্রসিংয়ের পাশের কুকুরগুলোর জন্য পানির পাত্র আর প্রতিদিনের খোঁজখবর।',
    log: [['arif', 'ছয়টা পানির পাত্রই ভরে দিয়েছি। এই সপ্তাহে গরম খুব বেশি।', 18]] },
];

// photos in backend/seed-photos, stored in the database the same way an upload is
// [who, file, area, caption, hours ago]
const rescues = [
  ['nabila', 'injured-eye.jpg', 'Dhanmondi', 'Eye looks swollen and cloudy. Found him near Road 27. Friendly, let me sit next to him. Needs a clinic trip.', 5],
  ['sadia', 'street-dinner.jpg', 'Mirpur', 'Night round done. 14 dogs fed between Mirpur 10 and 11. The black one ate twice, she is nursing somewhere close.', 9],
  ['tanvir', 'white-kitten.jpg', 'Uttara', 'Tiny white kitten crying under a parked CNG in Sector 7. No mother in two hours. Taking her home for tonight.', 20],
  ['farhana', 'cat-colony.jpg', 'Moghbazar', 'The cat colony behind the Moghbazar flyover is up to five now. Two look young enough for the next camp.', 28],
  ['arif', 'road-dog.jpg', 'Badda', 'লিংক রোডের গলির মাঝখানে শুয়ে আছে, এই গরমে প্রায় নড়ছেই না। পানি দিয়েছি। আজ রাতে কেউ একবার দেখে আসতে পারবেন?', 34],
  ['mehedi', 'bowl-dog.jpg', 'Banani', 'Water bowl is back outside the Banani 11 tea stall. The owner says we can refill it every morning.', 47],
  ['rafiq', 'ledge-cat.jpg', 'Gulshan', 'On the wall behind Gulshan 2 market. Eating fine but her ear is torn. Flagging it for the cat team.', 60],
  ['priya', 'mohammadpur-dog.jpg', 'Mohammadpur', 'টাউন হল বাজারের সামনে রোজ দুপুরে এই মেয়েটা ঘুমায়। খুব রোগা। ভাত আর একটা ডিম দিয়ে এসেছি।', 75],
  ['tanvir', 'pack.jpg', 'Uttara', 'Pack of four near the Sector 13 park, one limping on his front leg. They know us now, so we can get close.', 100],
  ['sadia', 'calico.jpg', 'Mirpur', 'Vaccinated this one at the Mirpur camp. Sat through it like a champion.', 130],
];

// spread the demo orders over the last few weeks so the revenue charts have a shape
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const orderPlan = [
  { buyer: 'mehedi@cholobachai.com', days: 2,  lines: [['SP-001', 1], ['SP-009', 2]], donation: 200, status: 'Delivered' },
  { buyer: 'farhana@cholobachai.com', days: 4, lines: [['SP-006', 3]], donation: 0, status: 'Delivered' },
  { buyer: 'mehedi@cholobachai.com', days: 6,  lines: [['SP-004', 1], ['SP-007', 2]], donation: 100, status: 'Delivered' },
  { buyer: 'farhana@cholobachai.com', days: 9, lines: [['SP-010', 1]], donation: 0, status: 'Out for Delivery' },
  { buyer: 'mehedi@cholobachai.com', days: 13, lines: [['SP-008', 1], ['SP-012', 1]], donation: 300, status: 'Delivered' },
  { buyer: 'farhana@cholobachai.com', days: 18, lines: [['SP-002', 1]], donation: 0, status: 'Delivered' },
  { buyer: 'mehedi@cholobachai.com', days: 24, lines: [['SP-011', 1], ['SP-009', 1]], donation: 0, status: 'Pending' },
  { buyer: 'farhana@cholobachai.com', days: 30, lines: [['SP-003', 1], ['SP-006', 2]], donation: 500, status: 'Delivered' },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to', mongoose.connection.name);

  // the launcher runs this with --if-needed on every start: it fills an empty
  // database, or one that only holds the demo people from before the rename,
  // and leaves anything else alone
  if (process.argv.includes('--if-needed')) {
    const emails = (await userModel.find({}, 'email').lean()).map((u) => u.email);
    const oldDemo = emails.length > 0 && emails.every((e) => e.endsWith('@straybachao.com'));
    if (emails.length && !oldDemo) {
      console.log(emails.includes('admin@cholobachai.com')
        ? 'Demo data is already there.'
        : 'This database has other accounts in it, so the demo data was not loaded. Run npm run seed to replace everything.');
      await mongoose.disconnect();
      return;
    }
  }

  await Promise.all([
    userModel.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Team.deleteMany({}),
    RescueImage.deleteMany({}),
    TeamInvite.deleteMany({}),
    Cart.deleteMany({}),
  ]);
  console.log('Cleared users, products, orders, teams, rescues and invitations');

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

  const byName = (handle) => userByEmail.get(`${handle}@cholobachai.com`);
  const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);

  const createdTeams = await Team.insertMany(
    teams.map(({ crew, log, ...t }) => ({
      ...t,
      creator: byName(crew[0])._id,
      members: crew.map((c) => byName(c)._id),
      activities: log.map(([who, message, h]) => ({ message, by: byName(who).name, createdAt: hoursAgo(h) })),
    }))
  );
  console.log(`Inserted ${createdTeams.length} teams`);

  // Nabila has an invitation waiting, so the invite flow can be tried straight away
  const catWatch = createdTeams.find((t) => t.id === 'TEAM-04');
  await TeamInvite.create({ team: catWatch._id, from: byName('rafiq')._id, to: byName('nabila')._id, status: 'pending', createdAt: hoursAgo(3) });

  const dir = new URL('./seed-photos/', import.meta.url);
  for (const [who, file, area, caption, h] of rescues) {
    const _id = new mongoose.Types.ObjectId();
    await RescueImage.create([{
      _id, userId: byName(who)._id, imageUrl: `/api/upload/rescue/${_id}`, caption, area,
      data: readFileSync(new URL(file, dir)), contentType: 'image/jpeg',
      createdAt: hoursAgo(h), updatedAt: hoursAgo(h),
    }], { timestamps: false });
  }
  console.log(`Inserted ${rescues.length} rescue posts with photos`);

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
  console.log('Admin login:     admin@cholobachai.com / Admin@1234');
  console.log('Volunteer login: nabila@cholobachai.com / Volunteer@123');
  console.log('Donor login:     mehedi@cholobachai.com / Donor@1234');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
