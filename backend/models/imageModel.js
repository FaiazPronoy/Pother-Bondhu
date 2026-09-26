import mongoose from "mongoose";

const rescueImageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  imageUrl: { type: String, required: true },
  caption: { type: String, maxlength: [500, 'Caption cannot exceed 500 characters'] },
  area: { type: String, maxlength: 60, default: '' },
  // the photo itself; left out of queries unless asked for
  data: { type: Buffer, select: false },
  contentType: { type: String, select: false },
}, { timestamps: true });

const RescueImage = mongoose.models.RescueImage || mongoose.model('RescueImage', rescueImageSchema);

export default RescueImage;
