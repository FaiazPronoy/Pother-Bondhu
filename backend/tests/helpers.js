import { inject } from 'vitest';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

export const baseUrl = () => inject('baseUrl');

export async function api(method, path, { body, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(baseUrl() + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // some responses have no body
  }
  return { status: res.status, body: json, cookie: (res.headers.get('set-cookie') || '').split(';')[0] };
}

async function withDb(fn) {
  const client = await MongoClient.connect(inject('mongoUri'));
  try {
    return await fn(client.db());
  } finally {
    await client.close();
  }
}

let counter = 0;
const uniqueEmail = (prefix) => `${prefix}${Date.now()}-${counter++}@test.local`;

export async function createUser({ role = 'donor', points = 0 } = {}) {
  const email = uniqueEmail(role);
  const password = 'TestPassword123!';
  await withDb((db) =>
    db.collection('users').insertOne({
      name: `Test ${role}`,
      email,
      password: bcrypt.hashSync(password, 10),
      role,
      points,
      isAccountVerified: true,
      verifyOtp: '', verifyOtpExpireAt: 0, resetOtp: '', resetOtpExpireAt: 0,
      location: '', bio: '',
      createdAt: new Date(), updatedAt: new Date(),
    })
  );
  const login = await api('POST', '/api/auth/login', { body: { email, password } });
  return { email, password, cookie: login.cookie, role };
}

export async function createProduct({ sellingPrice = 100, purchaseCost = 40, stockQuantity = 50 } = {}) {
  const id = `TEST-${Date.now()}-${counter++}`;
  await withDb((db) =>
    db.collection('products').insertOne({
      id,
      name: `Test product ${id}`,
      description: 'seeded by tests',
      purchaseCost,
      sellingPrice,
      imageUrl: '/PetToy.jpg',
      stockQuantity,
      category: 'toys',
      features: [],
      productAddDate: new Date(),
    })
  );
  return { id, sellingPrice, purchaseCost, stockQuantity };
}

export const getUser = (email) => withDb((db) => db.collection('users').findOne({ email }));
export const getLatestOrder = () =>
  withDb((db) => db.collection('orders').find().sort({ createdAt: -1 }).limit(1).next());
