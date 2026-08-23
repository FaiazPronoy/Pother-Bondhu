// backend/models/TeamModel.js
import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
  { message: { type: String, required: true } },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const TeamSchema = new mongoose.Schema({
  id: { type: String, index: true },          // optional custom/public id
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  area: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  category: { type: String, enum: ['Rescue','Medical','Other'], default: 'Rescue', index: true },
  description: String,
  activities: [ActivitySchema],
}, {
  timestamps: true,
  collation: { locale: 'en', strength: 2 },
  collection: 'teams',     // 👈 force collection name; avoids mismatches
});

TeamSchema.index({ name: 'text', slug: 'text', area: 'text', category: 'text' });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);

