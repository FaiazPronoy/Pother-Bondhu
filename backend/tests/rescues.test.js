import { describe, it, expect } from 'vitest';
import { MongoClient } from 'mongodb';
import { inject } from 'vitest';
import { api, createUser } from './helpers.js';

async function addRescue(fields) {
  const client = await MongoClient.connect(inject('mongoUri'));
  try {
    const user = await client.db().collection('users').findOne({});
    const doc = { userId: user._id, imageUrl: '/x', caption: 'test', area: 'Mirpur', createdAt: new Date(), updatedAt: new Date(), ...fields };
    const { insertedId } = await client.db().collection('rescueimages').insertOne(doc);
    return insertedId.toString();
  } finally {
    await client.close();
  }
}

describe('rescue status', () => {
  it('puts urgent posts first and reads an old post with no status as urgent', async () => {
    await createUser();
    const old = await addRescue({ caption: 'old one' });
    await addRescue({ status: 'resolved', createdAt: new Date(Date.now() + 60000) });
    const res = await api('GET', '/api/upload/rescue?limit=24');
    expect(res.status).toBe(200);
    const statuses = res.body.map((p) => p.status);
    expect(statuses.indexOf('resolved')).toBeGreaterThan(statuses.lastIndexOf('urgent'));
    expect(res.body.find((p) => p._id === old).status).toBe('urgent');
  });

  it('can be changed by a volunteer but not by another donor', async () => {
    await createUser();
    const id = await addRescue({ status: 'urgent' });
    const donor = await createUser();
    const volunteer = await createUser({ role: 'volunteer' });
    expect((await api('PATCH', `/api/upload/rescue/${id}/status`, { body: { status: 'helping' }, cookie: donor.cookie })).status).toBe(403);
    const ok = await api('PATCH', `/api/upload/rescue/${id}/status`, { body: { status: 'helping' }, cookie: volunteer.cookie });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('helping');
  });

  it('refuses a status that is not on the list', async () => {
    const id = await addRescue({ status: 'urgent' });
    const volunteer = await createUser({ role: 'volunteer' });
    expect((await api('PATCH', `/api/upload/rescue/${id}/status`, { body: { status: 'lost' }, cookie: volunteer.cookie })).status).toBe(400);
  });
});
