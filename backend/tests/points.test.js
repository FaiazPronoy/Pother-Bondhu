import { describe, it, expect } from 'vitest';
import { api, createUser, getUser } from './helpers.js';

describe('donating to a volunteer', () => {
  it('rejects an anonymous caller', async () => {
    const volunteer = await createUser({ role: 'volunteer' });
    const target = await getUser(volunteer.email);

    const res = await api('POST', `/api/volunteers/${target._id}/donate`, {
      body: { bkashNumber: '01700000000', amount: 100000 },
    });

    expect(res.status).toBe(401);
    const after = await getUser(volunteer.email);
    expect(after.points).toBe(0);
  });

  it('moves points from the donor instead of creating them', async () => {
    const volunteer = await createUser({ role: 'volunteer', points: 10 });
    const donor = await createUser({ points: 500 });
    const target = await getUser(volunteer.email);

    const res = await api('POST', `/api/volunteers/${target._id}/donate`, {
      cookie: donor.cookie,
      body: { bkashNumber: '01700000000', amount: 200 },
    });

    expect(res.status).toBe(200);
    expect((await getUser(volunteer.email)).points).toBe(210);
    expect((await getUser(donor.email)).points).toBe(300);
  });

  it('refuses when the donor cannot afford it', async () => {
    const volunteer = await createUser({ role: 'volunteer' });
    const donor = await createUser({ points: 5 });
    const target = await getUser(volunteer.email);

    const res = await api('POST', `/api/volunteers/${target._id}/donate`, {
      cookie: donor.cookie,
      body: { bkashNumber: '01700000000', amount: 200 },
    });

    expect(res.status).toBe(400);
    expect((await getUser(volunteer.email)).points).toBe(0);
  });

  it('rejects a negative amount', async () => {
    const volunteer = await createUser({ role: 'volunteer', points: 100 });
    const donor = await createUser({ points: 500 });
    const target = await getUser(volunteer.email);

    const res = await api('POST', `/api/volunteers/${target._id}/donate`, {
      cookie: donor.cookie,
      body: { bkashNumber: '01700000000', amount: -50 },
    });

    expect(res.status).toBe(400);
    expect((await getUser(volunteer.email)).points).toBe(100);
  });
});

describe('topping up points', () => {
  it('rejects a negative amount', async () => {
    const donor = await createUser({ points: 100 });
    const res = await api('PUT', '/api/user/add-points', {
      cookie: donor.cookie,
      body: { bkashNumber: '01700000000', amount: -500 },
    });

    expect(res.status).toBe(400);
    expect((await getUser(donor.email)).points).toBe(100);
  });

  it('rejects an amount above the cap', async () => {
    const donor = await createUser({ points: 0 });
    const res = await api('PUT', '/api/user/add-points', {
      cookie: donor.cookie,
      body: { bkashNumber: '01700000000', amount: 10000000 },
    });

    expect(res.status).toBe(400);
    expect((await getUser(donor.email)).points).toBe(0);
  });

  it('credits a normal amount', async () => {
    const donor = await createUser({ points: 100 });
    const res = await api('PUT', '/api/user/add-points', {
      cookie: donor.cookie,
      body: { bkashNumber: '01700000000', amount: 500 },
    });

    expect(res.status).toBe(200);
    expect((await getUser(donor.email)).points).toBe(600);
  });
});
