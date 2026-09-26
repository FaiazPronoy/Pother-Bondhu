import { describe, it, expect } from 'vitest';
import { api, baseUrl, createUser, createProduct, getUser } from './helpers.js';

const shipping = { name: 'Buyer', phone: '01700000000', address: '12 Test Road', shipping: 'standard' };
const order = (cookie, items, extra = {}) =>
  api('POST', '/api/orders/place', { cookie, body: { ...shipping, items, ...extra } });

describe('money and stock under load', () => {
  it('two orders at once cannot spend the same points twice', async () => {
    const p = await createProduct({ sellingPrice: 600, stockQuantity: 50 });
    const buyer = await createUser({ points: 1000 });

    const results = await Promise.all(
      Array.from({ length: 4 }, () => order(buyer.cookie, [{ id: p.id, quantity: 1 }]))
    );

    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect((await getUser(buyer.email)).points).toBe(400);
  });

  it('two buyers cannot both take the last one in stock', async () => {
    const p = await createProduct({ sellingPrice: 100, stockQuantity: 1 });
    const buyers = await Promise.all(Array.from({ length: 4 }, () => createUser({ points: 1000 })));

    const results = await Promise.all(buyers.map((b) => order(b.cookie, [{ id: p.id, quantity: 1 }])));

    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    const charged = await Promise.all(buyers.map((b) => getUser(b.email)));
    expect(charged.filter((u) => u.points === 900)).toHaveLength(1);
  });

  it('a failed line does not leave stock taken from the lines before it', async () => {
    const plenty = await createProduct({ sellingPrice: 100, stockQuantity: 10 });
    const scarce = await createProduct({ sellingPrice: 100, stockQuantity: 1 });
    const buyer = await createUser({ points: 5000 });

    const res = await order(buyer.cookie, [{ id: plenty.id, quantity: 2 }, { id: scarce.id, quantity: 2 }]);

    expect(res.status).toBe(400);
    expect((await getUser(buyer.email)).points).toBe(5000);
    const again = await order(buyer.cookie, [{ id: plenty.id, quantity: 10 }]);
    expect(again.status).toBe(200);
  });

  it('donations arriving together are all counted, and none overdraw', async () => {
    const volunteer = await createUser({ role: 'volunteer' });
    const target = await getUser(volunteer.email);
    const donors = await Promise.all(Array.from({ length: 4 }, () => createUser({ points: 300 })));
    const give = (d) => api('POST', `/api/volunteers/${target._id}/donate`, {
      cookie: d.cookie, body: { bkashNumber: '01700000000', amount: 200 },
    });

    // every donor gives twice at once: only one of each pair can be afforded
    await Promise.all(donors.flatMap((d) => [give(d), give(d)]));

    expect((await getUser(volunteer.email)).points).toBe(800);
    for (const d of donors) expect((await getUser(d.email)).points).toBe(100);
  });

  it('stores the donation on the order as a number', async () => {
    const p = await createProduct({ sellingPrice: 100 });
    const buyer = await createUser({ points: 1000 });
    await order(buyer.cookie, [{ id: p.id, quantity: 1 }], { donation: '50' });
    const { getLatestOrder } = await import('./helpers.js');
    expect((await getLatestOrder()).donation).toBe(50);
  });
});

describe('accounts', () => {
  it('sign in does not say whether an email is registered', async () => {
    const user = await createUser();
    const unknown = await api('POST', '/api/auth/login', {
      body: { email: 'nobody-here@test.local', password: 'whatever123' },
    });
    const wrong = await api('POST', '/api/auth/login', { body: { email: user.email, password: 'wrong-password' } });
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it('the status check says who is signed in, their role and balance', async () => {
    const user = await createUser({ role: 'volunteer', points: 70 });
    const res = await api('GET', '/api/auth/status', { cookie: user.cookie });
    expect(res.body.user).toMatchObject({ role: 'volunteer', points: 70 });
  });

  it('a donor can become a volunteer from their profile', async () => {
    const user = await createUser();
    await api('PUT', '/api/user/profile', { cookie: user.cookie, body: { role: 'volunteer' } });
    expect((await getUser(user.email)).role).toBe('volunteer');
  });

  it('but still cannot make themselves an admin', async () => {
    const user = await createUser();
    await api('PUT', '/api/user/profile', { cookie: user.cookie, body: { role: 'admin' } });
    expect((await getUser(user.email)).role).toBe('donor');
  });
});

describe('teams and volunteers', () => {
  it('a malformed volunteer id is a 404, not a server error', async () => {
    const res = await api('GET', '/api/volunteers/not-an-id');
    expect(res.status).toBe(404);
  });

  it('a team needs a name', async () => {
    const v = await createUser({ role: 'volunteer' });
    const res = await api('POST', '/api/teams', { cookie: v.cookie, body: { teamName: '  ', location: 'Mirpur' } });
    expect(res.status).toBe(400);
  });

  it('only volunteers can start a team', async () => {
    const donor = await createUser();
    const res = await api('POST', '/api/teams', { cookie: donor.cookie, body: { teamName: 'Paws of Mirpur', location: 'Mirpur' } });
    expect(res.status).toBe(403);
  });

  it('invitations only go to volunteers, and not to yourself', async () => {
    const lead = await createUser({ role: 'volunteer' });
    const donor = await createUser();
    const team = await api('POST', '/api/teams', { cookie: lead.cookie, body: { teamName: 'Badda Rescue', location: 'Badda' } });
    const leadDoc = await getUser(lead.email);
    const donorDoc = await getUser(donor.email);

    const res = await api('POST', '/api/invites/send', {
      cookie: lead.cookie, body: { teamId: team.body._id, volunteerIds: [String(donorDoc._id), String(leadDoc._id)] },
    });
    expect(res.status).toBe(400);
  });

  it('an invitation answer has to be accepted or rejected', async () => {
    const lead = await createUser({ role: 'volunteer' });
    const other = await createUser({ role: 'volunteer' });
    const team = await api('POST', '/api/teams', { cookie: lead.cookie, body: { teamName: 'Uttara Paws', location: 'Uttara' } });
    const otherDoc = await getUser(other.email);
    const sent = await api('POST', '/api/invites/send', {
      cookie: lead.cookie, body: { teamId: team.body._id, volunteerIds: [String(otherDoc._id)] },
    });
    const res = await api('PATCH', `/api/invites/${sent.body[0]._id}/respond`, { cookie: other.cookie, body: { status: 'banana' } });
    expect(res.status).toBe(400);
  });
});

// the smallest valid PNG: one transparent pixel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const postPhoto = async (cookie, bytes, type, caption = 'Found near Mirpur 10') => {
  const form = new FormData();
  form.append('image', new Blob([bytes], { type }), 'photo.png');
  form.append('caption', caption);
  const res = await fetch(baseUrl() + '/api/upload/rescue', { method: 'POST', headers: { Cookie: cookie }, body: form });
  return { status: res.status, body: await res.json().catch(() => null) };
};

describe('rescue photos', () => {
  it('are kept in the database and served back', async () => {
    const v = await createUser({ role: 'volunteer' });
    const up = await postPhoto(v.cookie, PNG, 'image/png');
    expect(up.status).toBe(201);

    const img = await fetch(baseUrl() + up.body.imageUrl);
    expect(img.headers.get('content-type')).toBe('image/png');
    expect(Buffer.from(await img.arrayBuffer()).equals(PNG)).toBe(true);
  });

  it('show up in the public feed with who posted them', async () => {
    const v = await createUser({ role: 'volunteer' });
    await postPhoto(v.cookie, PNG, 'image/png', 'A kitten under the Banani bridge');
    const feed = await api('GET', '/api/upload/rescue');
    expect(feed.body[0].caption).toBe('A kitten under the Banani bridge');
    expect(feed.body[0].volunteer.name).toBeTruthy();
    expect(feed.body[0].data).toBeUndefined();
  });

  it('a file that only claims to be a photo is refused', async () => {
    const v = await createUser({ role: 'volunteer' });
    const up = await postPhoto(v.cookie, Buffer.from('<script>alert(1)</script> pretending'), 'image/png');
    expect(up.status).toBe(400);
  });

  it('need a signed in user', async () => {
    const up = await postPhoto('', PNG, 'image/png');
    expect(up.status).toBe(401);
  });
});

describe('signing in', () => {
  it('locks an email after five wrong passwords', async () => {
    const user = await createUser();
    for (let i = 0; i < 5; i++) {
      await api('POST', '/api/auth/login', { body: { email: user.email, password: 'wrong-password' } });
    }
    const right = await api('POST', '/api/auth/login', { body: { email: user.email, password: user.password } });
    expect(right.status).toBe(429);
  });

  it('refuses a short password at sign up', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { name: 'Rafi', email: `rafi${Date.now()}@test.local`, password: 'abc' },
    });
    expect(res.body.success).toBe(false);
  });
});
