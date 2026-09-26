import mongoose from "mongoose";
import RescueImage from "../models/imageModel.js";
import { looksLikeImage } from "../utils/upload.js";

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
    const _id = new mongoose.Types.ObjectId();
    const imageUrl = `/api/upload/rescue/${_id}`;

    await RescueImage.create({
      _id, userId: req.userId, imageUrl, caption, area,
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

// the latest rescue posts from everyone, for the home page feed
export const recentRescues = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 9, 24);
  const posts = await RescueImage.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name location')
    .lean();
  res.json(posts.map((p) => ({
    _id: p._id, imageUrl: p.imageUrl, caption: p.caption, area: p.area, createdAt: p.createdAt,
    volunteer: p.userId ? { _id: p.userId._id, name: p.userId.name, location: p.userId.location } : null,
  })));
};
