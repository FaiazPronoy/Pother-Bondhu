import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  message: { type: String, maxlength: 500, default: '' },
  phone: { type: String, maxlength: 20, default: '' },
  status: { type: String, enum: ['waiting', 'accepted', 'declined'], default: 'waiting' },
}, { timestamps: true });

const adoptionSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 40 },
  species: { type: String, enum: ['dog', 'cat'], required: true },
  age: { type: String, maxlength: 30, default: '' },
  sex: { type: String, enum: ['male', 'female', ''], default: '' },
  area: { type: String, maxlength: 60, default: '' },
  story: { type: String, maxlength: 600, default: '' },
  vaccinated: { type: Boolean, default: false },
  neutered: { type: Boolean, default: false },
  status: { type: String, enum: ['available', 'adopted'], default: 'available' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  imageUrl: { type: String, default: '' },
  data: { type: Buffer, select: false },
  contentType: { type: String, select: false },
  requests: [requestSchema],
}, { timestamps: true });

const Adoption = mongoose.models.Adoption || mongoose.model('Adoption', adoptionSchema);

export default Adoption;
