import { describe, it, expect } from 'vitest';
import { api, createUser, createProduct } from './helpers.js';

describe('the saved cart', () => {
  it('comes back with the items that were saved', async () => {
    const p = await createProduct({ sellingPrice: 150 });
    const user = await createUser();

    await api('POST', '/api/user/cart', {
      cookie: user.cookie,
      body: { items: [{ id: p.id, quantity: 2, name: 'whatever', sellingPrice: 999 }] },
    });

    const res = await api('GET', '/api/user/cart', { cookie: user.cookie });
    expect(res.status).toBe(200);
    expect(res.body.cart).toHaveLength(1);
    expect(res.body.cart[0].id).toBe(p.id);
    expect(res.body.cart[0].quantity).toBe(2);
  });

  it('reads price and stock back from the product, not from what the client sent', async () => {
    const p = await createProduct({ sellingPrice: 150, stockQuantity: 7 });
    const user = await createUser();

    await api('POST', '/api/user/cart', {
      cookie: user.cookie,
      body: { items: [{ id: p.id, quantity: 1, sellingPrice: 1 }] },
    });

    const res = await api('GET', '/api/user/cart', { cookie: user.cookie });
    expect(res.body.cart[0].sellingPrice).toBe(150);
    expect(res.body.cart[0].stockQuantity).toBe(7);
  });

  it('is empty for a user who has not saved one', async () => {
    const user = await createUser();
    const res = await api('GET', '/api/user/cart', { cookie: user.cookie });
    expect(res.status).toBe(200);
    expect(res.body.cart).toEqual([]);
  });

  it('drops items whose product no longer exists', async () => {
    const user = await createUser();
    await api('POST', '/api/user/cart', {
      cookie: user.cookie,
      body: { items: [{ id: 'DELETED-PRODUCT-ID', quantity: 1 }] },
    });

    const res = await api('GET', '/api/user/cart', { cookie: user.cookie });
    expect(res.body.cart).toEqual([]);
  });

  it('replaces the previous cart rather than appending to it', async () => {
    const a = await createProduct();
    const b = await createProduct();
    const user = await createUser();

    await api('POST', '/api/user/cart', { cookie: user.cookie, body: { items: [{ id: a.id, quantity: 1 }] } });
    await api('POST', '/api/user/cart', { cookie: user.cookie, body: { items: [{ id: b.id, quantity: 3 }] } });

    const res = await api('GET', '/api/user/cart', { cookie: user.cookie });
    expect(res.body.cart).toHaveLength(1);
    expect(res.body.cart[0].id).toBe(b.id);
  });

  it('needs a logged-in user', async () => {
    const res = await api('GET', '/api/user/cart');
    expect(res.status).toBe(401);
  });
});
