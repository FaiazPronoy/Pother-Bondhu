import mongoose from "mongoose";
import Adoption from "../models/adoptionModel.js";
import { looksLikeImage } from "../utils/upload.js";

const text = (v, max) => String(v || '').trim().slice(0, max);
const yes = (v) => v === true || v === 'true' || v === 'on';

// what anyone can see; requests stay private to the poster and the person asking
const card = (a, viewer) => {
  const mine = viewer && a.requests.find((r) => r.user.toString() === viewer);
  return {
    _id: a._id, name: a.name, species: a.species, age: a.age, sex: a.sex, area: a.area, story: a.story,
    vaccinated: a.vaccinated, neutered: a.neutered, status: a.status, imageUrl: a.imageUrl, createdAt: a.createdAt,
    postedBy: a.postedBy ? { _id: a.postedBy._id, name: a.postedBy.name } : null,
    waiting: a.requests.filter((r) => r.status === 'waiting').length,
    myRequest: mine ? { status: mine.status } : null,
  };
};

export const listAdoptions = async (req, res) => {
  const all = await Adoption.find().populate('postedBy', 'name').sort({ createdAt: -1 }).lean();
  // available ones first, then the recent happy endings
  const open = all.filter((a) => a.status === 'available');
  const homed = all.filter((a) => a.status === 'adopted').slice(0, 6);
  res.json([...open, ...homed].map((a) => card(a, req.viewerId)));
};

export const servePhoto = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).end();
  const a = await Adoption.findById(req.params.id).select('+data +contentType');
  if (!a || !a.data) return res.status(404).end();
  res.set('Content-Type', a.contentType);
  res.set('Cache-Control', 'public, max-age=604800, immutable');
  res.set('X-Content-Type-Options', 'nosniff');
  res.send(a.data);
};

export const createAdoption = async (req, res) => {
  if (!['volunteer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: "Only volunteers can put an animal up for adoption" });
  }
  if (!req.file || !looksLikeImage(req.file.buffer)) {
    return res.status(400).json({ error: "Add a photo of the animal" });
  }
  const name = text(req.body.name, 40);
  const species = req.body.species;
  if (!name || !['dog', 'cat'].includes(species)) {
    return res.status(400).json({ error: "A name and dog or cat are needed" });
  }
  const _id = new mongoose.Types.ObjectId();
  await Adoption.create({
    _id, name, species,
    age: text(req.body.age, 30),
    sex: ['male', 'female'].includes(req.body.sex) ? req.body.sex : '',
    area: text(req.body.area, 60),
    story: text(req.body.story, 600),
    vaccinated: yes(req.body.vaccinated),
    neutered: yes(req.body.neutered),
    postedBy: req.userId,
    imageUrl: `/api/adoptions/${_id}/photo`,
    data: req.file.buffer, contentType: req.file.mimetype,
  });
  res.status(201).json({ _id });
};

export const askToAdopt = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Not found" });
  const phone = text(req.body.phone, 20);
  if (!/^\+?[0-9 ]{7,20}$/.test(phone)) return res.status(400).json({ error: "Add a phone number so the volunteer can call you" });

  // one atomic update, so two quick clicks cannot add two requests
  const updated = await Adoption.findOneAndUpdate(
    { _id: req.params.id, status: 'available', postedBy: { $ne: req.userId }, 'requests.user': { $ne: req.userId } },
    { $push: { requests: { user: req.userId, phone, message: text(req.body.message, 500) } } },
    { new: true }
  );
  if (updated) return res.status(201).json({ status: 'waiting' });

  const a = await Adoption.findById(req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  if (a.status !== 'available') return res.status(409).json({ error: "This one already has a home" });
  if (a.postedBy.toString() === req.userId) return res.status(400).json({ error: "You posted this one" });
  return res.status(409).json({ error: "You have already asked" });
};

// the poster's listings with everyone who asked, and the viewer's own requests
export const myAdoptions = async (req, res) => {
  const posted = await Adoption.find(req.user.role === 'admin' ? {} : { postedBy: req.userId })
    .populate('requests.user', 'name email').sort({ createdAt: -1 }).lean();
  const asked = await Adoption.find({ 'requests.user': req.userId }).populate('postedBy', 'name').lean();
  res.json({
    posted: posted.map((a) => ({
      _id: a._id, name: a.name, status: a.status, imageUrl: a.imageUrl,
      requests: a.requests.map((r) => ({
        _id: r._id, status: r.status, phone: r.phone, message: r.message, createdAt: r.createdAt,
        user: r.user ? { name: r.user.name, email: r.user.email } : null,
      })),
    })),
    asked: asked.map((a) => ({
      _id: a._id, name: a.name, imageUrl: a.imageUrl, postedBy: a.postedBy?.name || '',
      status: a.requests.find((r) => r.user.toString() === req.userId).status,
    })),
  });
};

export const answerRequest = async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ error: "Accept or decline" });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Not found" });
  const a = await Adoption.findById(req.params.id);
  const request = a?.requests.id(req.params.requestId);
  if (!request) return res.status(404).json({ error: "Not found" });
  if (a.postedBy.toString() !== req.userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only the volunteer who posted this can answer" });
  }
  if (a.status === 'adopted' || request.status !== 'waiting') {
    return res.status(409).json({ error: "This request was already answered" });
  }

  const rid = request._id;
  const update = action === 'decline'
    ? { $set: { 'requests.$[me].status': 'declined' } }
    // one home only: everyone else still waiting is told no in the same write
    : { $set: { status: 'adopted', 'requests.$[me].status': 'accepted', 'requests.$[other].status': 'declined' } };
  const filters = [{ 'me._id': rid }];
  if (action === 'accept') filters.push({ 'other._id': { $ne: rid }, 'other.status': 'waiting' });

  const done = await Adoption.findOneAndUpdate(
    { _id: a._id, status: 'available', requests: { $elemMatch: { _id: rid, status: 'waiting' } } },
    update,
    { arrayFilters: filters, new: true }
  );
  if (!done) return res.status(409).json({ error: "This request was already answered" });
  res.json({ status: done.status, request: done.requests.id(rid).status });
};
