import mongoose from "mongoose";
import RescueImage from "../models/imageModel.js";
import { looksLikeImage } from "../utils/upload.js";

export const STATUSES = ['urgent', 'vet', 'helping', 'resolved'];

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    if (!looksLikeImage(req.file.buffer)) {
      return res.status(400).json({ error: "That file is not a photo" });
    }

    const caption = String(req.body.caption || '').trim().slice(0, 500);
    const area = String(req.body.area || '').trim().slice(0, 60);
    const status = STATUSES.includes(req.body.status) ? req.body.status : 'urgent';
    const _id = new mongoose.Types.ObjectId();
    const imageUrl = `/api/upload/rescue/${_id}`;

    await RescueImage.create({
      _id, userId: req.userId, imageUrl, caption, area, status,
      data: req.file.buffer, contentType: req.file.mimetype,
    });

    res.status(201).json({ message: "Image uploaded successfully", imageUrl, caption, _id });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Server error during upload" });
  }
};

export const serveImage = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).end();
  const image = await RescueImage.findById(req.params.id).select('+data +contentType');
  if (!image || !image.data) return res.status(404).end();
  res.set('Content-Type', image.contentType);
  res.set('Cache-Control', 'public, max-age=604800, immutable');
  res.set('X-Content-Type-Options', 'nosniff');
  res.send(image.data);
};

// the latest rescue posts from everyone, urgent ones first
export const recentRescues = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 9, 24);
  const urgent = { status: { $in: ['urgent', null] } };
  const first = await RescueImage.find(urgent)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name location role')
    .lean();
  const rest = first.length < limit
    ? await RescueImage.find({ status: { $nin: ['urgent', null] } })
        .sort({ createdAt: -1 })
        .limit(limit - first.length)
        .populate('userId', 'name location role')
        .lean()
    : [];
  res.json([...first, ...rest].map((p) => ({
    _id: p._id, imageUrl: p.imageUrl, caption: p.caption, area: p.area, createdAt: p.createdAt,
    status: p.status || 'urgent',
    volunteer: p.userId ? { _id: p.userId._id, name: p.userId.name, location: p.userId.location, role: p.userId.role } : null,
  })));
};

// the person who posted it, or any volunteer, can move a rescue along
export const setRescueStatus = async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Pick a status from the list" });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Rescue post not found" });
  const post = await RescueImage.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Rescue post not found" });
  const own = post.userId.toString() === req.userId;
  if (!own && !['volunteer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: "Only the poster or a volunteer can change this" });
  }
  post.status = status;
  await post.save();
  res.json({ _id: post._id, status: post.status });
};
