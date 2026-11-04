import { describe, it, expect } from 'vitest';
import { api, baseUrl, createUser } from './helpers.js';

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(60)]);

async function post(cookie, fields = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries({ name: 'Bhulu', species: 'dog', age: '1 year', area: 'Mirpur', ...fields })) form.append(k, v);
  form.append('image', new Blob([jpeg], { type: 'image/jpeg' }), 'bhulu.jpg');
  const res = await fetch(baseUrl() + '/api/adoptions', { method: 'POST', headers: { Cookie: cookie }, body: form });
  return { status: res.status, body: await res.json() };
}

const ask = (id, cookie, phone = '01700000000') =>
  api('POST', `/api/adoptions/${id}/requests`, { body: { phone, message: 'We have a yard' }, cookie });

describe('adoption', () => {
  it('lets a volunteer post an animal but not a donor', async () => {
    const donor = await createUser();
    const volunteer = await createUser({ role: 'volunteer' });
    expect((await post(donor.cookie)).status).toBe(403);
    const made = await post(volunteer.cookie);
    expect(made.status).toBe(201);
    const list = await api('GET', '/api/adoptions');
    const card = list.body.find((a) => a._id === made.body._id);
    expect(card.name).toBe('Bhulu');
    expect(card.requests).toBeUndefined();
  });

  it('takes one request per person and keeps phone numbers off the public list', async () => {
    const volunteer = await createUser({ role: 'volunteer' });
    const { body } = await post(volunteer.cookie);
    const donor = await createUser();
    const [a, b] = await Promise.all([ask(body._id, donor.cookie), ask(body._id, donor.cookie)]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect((await ask(body._id, volunteer.cookie)).status).toBe(400);

    const list = await api('GET', '/api/adoptions', { cookie: donor.cookie });
    const card = list.body.find((x) => x._id === body._id);
    expect(card.waiting).toBe(1);
    expect(card.myRequest.status).toBe('waiting');
    expect(JSON.stringify(list.body)).not.toContain('01700000000');

    const mine = await api('GET', '/api/adoptions/mine', { cookie: volunteer.cookie });
    expect(mine.body.posted.find((x) => x._id === body._id).requests[0].phone).toBe('01700000000');
  });

  it('gives the animal one home and turns the other requests down', async () => {
    const volunteer = await createUser({ role: 'volunteer' });
    const { body } = await post(volunteer.cookie);
    const first = await createUser();
    const second = await createUser();
    await ask(body._id, first.cookie);
    await ask(body._id, second.cookie);
    const { body: mine } = await api('GET', '/api/adoptions/mine', { cookie: volunteer.cookie });
    const [r1, r2] = mine.posted.find((x) => x._id === body._id).requests;

    expect((await api('PATCH', `/api/adoptions/${body._id}/requests/${r1._id}`, { body: { action: 'accept' }, cookie: first.cookie })).status).toBe(403);
    const ok = await api('PATCH', `/api/adoptions/${body._id}/requests/${r1._id}`, { body: { action: 'accept' }, cookie: volunteer.cookie });
    expect(ok.body).toEqual({ status: 'adopted', request: 'accepted' });
    expect((await api('PATCH', `/api/adoptions/${body._id}/requests/${r2._id}`, { body: { action: 'accept' }, cookie: volunteer.cookie })).status).toBe(409);

    const { body: theirs } = await api('GET', '/api/adoptions/mine', { cookie: second.cookie });
    expect(theirs.asked.find((x) => x._id === body._id).status).toBe('declined');
    expect((await ask(body._id, (await createUser()).cookie)).status).toBe(409);
  });

  it('needs a phone number to ask', async () => {
    const volunteer = await createUser({ role: 'volunteer' });
    const { body } = await post(volunteer.cookie);
    const donor = await createUser();
    expect((await ask(body._id, donor.cookie, 'call me')).status).toBe(400);
  });
});
