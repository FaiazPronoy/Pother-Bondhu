import { describe, it, expect } from 'vitest';
import { api, createUser, createProduct, getUser, getLatestOrder } from './helpers.js';

const shipping = { name: 'Buyer', phone: '01700000000', address: '12 Test Road', shipping: 'standard' };

describe('placing an order', () => {
  it('charges for every item in the cart, not just the last one', async () => {
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

  it('stores the cost and product id on each line so profit can be worked out', async () => {
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
