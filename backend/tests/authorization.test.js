import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers.js';

describe('admin-only routes', () => {
  const adminRoutes = [
    ['GET', '/api/orders/all'],
    ['GET', '/api/products/count'],
    ['GET', '/api/products/low-stock'],
    ['GET', '/api/products/most-ordered'],
  ];

  it.each(adminRoutes)('%s %s rejects anonymous callers', async (method, path) => {
    const res = await api(method, path);
    expect(res.status).toBe(401);
  });

  it.each(adminRoutes)('%s %s rejects a signed-in donor', async (method, path) => {
    const donor = await createUser();
    const res = await api(method, path, { cookie: donor.cookie });
    expect(res.status).toBe(403);
  });

  it.each(adminRoutes)('%s %s allows an admin', async (method, path) => {
    const admin = await createUser({ role: 'admin' });
    const res = await api(method, path, { cookie: admin.cookie });
    expect(res.status).toBe(200);
  });
});

describe('product catalogue writes', () => {
  const newProduct = () => ({
    id: `X-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: 'Written by test',
    sellingPrice: 100,
    purchaseCost: 40,
    stockQuantity: 5,
    category: 'toys',
  });

  it('cannot be created anonymously', async () => {
    const res = await api('POST', '/api/products', { body: newProduct() });
    expect(res.status).toBe(401);
  });

  it('cannot be created by a donor', async () => {
    const donor = await createUser();
    const res = await api('POST', '/api/products', { body: newProduct(), cookie: donor.cookie });
    expect(res.status).toBe(403);
  });

  it('can be created by an admin', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await api('POST', '/api/products', { body: newProduct(), cookie: admin.cookie });
    expect(res.status).toBe(201);
  });

  it('can be edited down to zero by an admin', async () => {
    const admin = await createUser({ role: 'admin' });
    const product = newProduct();
    await api('POST', '/api/products', { body: product, cookie: admin.cookie });
    const res = await api('PUT', `/api/products/${product.id}`, {
      body: { purchaseCost: 0, stockQuantity: 0 },
      cookie: admin.cookie,
    });
    expect(res.status).toBe(200);
    expect(res.body.purchaseCost).toBe(0);
    expect(res.body.stockQuantity).toBe(0);
    expect(res.body.name).toBe(product.name);
  });

  it('cannot be deleted anonymously', async () => {
    const res = await api('DELETE', '/api/products/anything');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders/', () => {
  it('is not a route', async () => {
    const res = await api('GET', '/api/orders/');
    expect(res.status).toBe(404);
  });
});
