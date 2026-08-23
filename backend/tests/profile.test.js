import { describe, it, expect } from 'vitest';
import { api, createUser, getUser } from './helpers.js';

describe('PUT /api/user/profile', () => {
  it('does not let a user change their own role', async () => {
    const donor = await createUser();
    await api('PUT', '/api/user/profile', {
      body: { name: 'Renamed', role: 'admin' },
      cookie: donor.cookie,
    });

    const after = await getUser(donor.email);
    expect(after.role).toBe('donor');
  });

  it('does not let a user give themselves points', async () => {
    const donor = await createUser({ points: 10 });
    await api('PUT', '/api/user/profile', {
      body: { points: 999999 },
      cookie: donor.cookie,
    });

    const after = await getUser(donor.email);
    expect(after.points).toBe(10);
  });

  it('updates the fields a user is allowed to change', async () => {
    const donor = await createUser();
    const res = await api('PUT', '/api/user/profile', {
      body: { name: 'New Name', location: 'Dhaka', bio: 'hello' },
      cookie: donor.cookie,
    });

    expect(res.status).toBe(200);
    const after = await getUser(donor.email);
    expect(after.name).toBe('New Name');
    expect(after.location).toBe('Dhaka');
    expect(after.bio).toBe('hello');
  });

  it('rejects an anonymous caller', async () => {
    const res = await api('PUT', '/api/user/profile', { body: { name: 'nobody' } });
    expect(res.status).toBe(401);
  });
});
