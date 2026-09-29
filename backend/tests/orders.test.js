import { describe, it, expect } from 'vitest';
import { api, createUser, createProduct, getUser, getLatestOrder } from './helpers.js';

const shipping = { name: 'Buyer', phone: '01700000000', address: '12 Test Road', shipping: 'standard' };

describe('placing an order', () => {
  it('charges for every item in the cart', async () => {
    const a = await createProduct({ sellingPrice: 500 });
    const b = await createProduct({ sellingPrice: 300 });
    const c = await createProduct({ sellingPrice: 200 });
    const buyer = await createUser({ points: 5000 });

    const res = await api('POST', '/api/orders/place', {
      cookie: buyer.cookie,
      body: {
        ...shipping,
        items: [
          { id: a.id, quantity: 1 },
          { id: b.id, quantity: 1 },
          { id: c.id, quantity: 1 },
        ],
      },
    });

    expect(res.status).toBe(200);
    const after = await getUser(buyer.email);
    expect(after.points).toBe(5000 - 1000);
  });

  it('multiplies price by quantity for each line', async () => {
    const p = await createProduct({ sellingPrice: 250 });
    const buyer = await createUser({ points: 5000 });

    await api('POST', '/api/orders/place', {
      cookie: buyer.cookie,
      body: { ...shipping, items: [{ id: p.id, quantity: 3 }] },
    });

    const after = await getUser(buyer.email);
    expect(after.points).toBe(5000 - 750);
  });

  it('adds the donation to the total', async () => {
    const p = await createProduct({ sellingPrice: 100 });
    const buyer = await createUser({ points: 5000 });

    await api('POST', '/api/orders/place', {
      cookie: buyer.cookie,
      body: { ...shipping, donation: 400, items: [{ id: p.id, quantity: 1 }] },
    });

    const after = await getUser(buyer.email);
    expect(after.points).toBe(5000 - 500);
  });

  it('rejects a negative quantity', async () => {
    const p = await createProduct({ sellingPrice: 500 });
    const buyer = await createUser({ points: 100 });

    const res = await api('POST', '/api/orders/place', {
      cookie: buyer.cookie,
      body: { ...shipping, items: [{ id: p.id, quantity: -5 }] },
    });

    expect(res.status).toBe(400);
    const after = await getUser(buyer.email);
    expect(after.points).toBe(100);
  });

  it('rejects a fractional quantity', async () => {
    const p = await createProduct({ sellingPrice: 100 });
    const buyer = await createUser({ points: 1000 });

    const res = await api('POST', '/api/orders/place', {
      cookie: buyer.cookie,
      body: { ...shipping, items: [{ id: p.id, quantity: 1.5 }] },
    });

    expect(res.status).toBe(400);
  });

  it('rejects a negative donation', async () => {
    const p = await createProduct({ sellingPrice: 100 });
    const buyer = await createUser({ points: 1000 });

    const res = await api('POST', '/api/orders/place', {
      cookie: buyer.cookie,
      body: { ...shipping, donation: -900, items: [{ id: p.id, quantity: 1 }] },
    });

    expect(res.status).toBe(400);
  });

  it('rejects an empty cart', async () => {
    const buyer = await createUser({ points: 1000 });
    const res = await api('POST', '/api/orders/place', {
      cookie: buyer.cookie,
      body: { ...shipping, items: [] },
    });

    expect(res.status).toBe(400);
  });

  it('refuses when the buyer cannot afford the total', async () => {
    const p = await createProduct({ sellingPrice: 900 });
    const buyer = await createUser({ points: 100 });

    const res = await api('POST', '/api/orders/place', {
      cookie: buyer.cookie,
      body: { ...shipping, items: [{ id: p.id, quantity: 1 }] },
    });

    expect(res.status).toBe(400);
    const after = await getUser(buyer.email);
    expect(after.points).toBe(100);
  });

  it('stores the cost and product id on each line', async () => {
    const p = await createProduct({ sellingPrice: 300, purchaseCost: 120 });
    const buyer = await createUser({ points: 1000 });

    await api('POST', '/api/orders/place', {
      cookie: buyer.cookie,
      body: { ...shipping, items: [{ id: p.id, quantity: 2 }] },
    });

    const order = await getLatestOrder();
    expect(order.items[0].purchaseCost).toBe(120);
    expect(order.items[0].productId).toBeTruthy();
  });

  it('needs a logged-in buyer', async () => {
    const p = await createProduct();
    const res = await api('POST', '/api/orders/place', {
      body: { ...shipping, items: [{ id: p.id, quantity: 1 }] },
    });
    expect(res.status).toBe(401);
  });
});

describe('your own orders', () => {
  it('shows each person only the orders they placed', async () => {
    const p = await createProduct({ sellingPrice: 100, purchaseCost: 60 });
    const buyer = await createUser({ points: 1000 });
    const other = await createUser({ points: 1000 });
    await api('POST', '/api/orders/place', { cookie: buyer.cookie, body: { ...shipping, items: [{ id: p.id, quantity: 2 }] } });
    await api('POST', '/api/orders/place', { cookie: other.cookie, body: { ...shipping, items: [{ id: p.id, quantity: 1 }] } });

    const res = await api('GET', '/api/orders/mine', { cookie: buyer.cookie });
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0].totalPoints).toBe(200);
    expect(res.body.orders[0].status).toBe('Pending');
    // what the shop paid for the item is not the buyer's business
    expect(res.body.orders[0].items[0].purchaseCost).toBeUndefined();
  });

  it('needs you to be signed in', async () => {
    const res = await api('GET', '/api/orders/mine');
    expect(res.status).toBe(401);
  });
});

describe('cancelling an order', () => {
  it('gives the points back and restocks when it was not delivered', async () => {
    const admin = await createUser({ role: 'admin' });
    const p = await createProduct({ sellingPrice: 200, stockQuantity: 10 });
    const buyer = await createUser({ points: 1000 });
    await api('POST', '/api/orders/place', { cookie: buyer.cookie, body: { ...shipping, items: [{ id: p.id, quantity: 2 }] } });
    const order = await getLatestOrder();
    expect((await getUser(buyer.email)).points).toBe(600);

    const res = await api('DELETE', `/api/orders/${order._id}`, { cookie: admin.cookie });
    expect(res.status).toBe(200);
    expect((await getUser(buyer.email)).points).toBe(1000);
    const again = await api('GET', `/api/products/${p.id}`);
    expect(again.body.stockQuantity ?? again.body.product?.stockQuantity).toBe(10);
  });

  it('does not refund an order that was already delivered', async () => {
    const admin = await createUser({ role: 'admin' });
    const p = await createProduct({ sellingPrice: 200 });
    const buyer = await createUser({ points: 1000 });
    await api('POST', '/api/orders/place', { cookie: buyer.cookie, body: { ...shipping, items: [{ id: p.id, quantity: 1 }] } });
    const order = await getLatestOrder();
    await api('PUT', `/api/orders/${order._id}`, { cookie: admin.cookie, body: { status: 'Delivered' } });

    await api('DELETE', `/api/orders/${order._id}`, { cookie: admin.cookie });
    expect((await getUser(buyer.email)).points).toBe(800);
  });
});
