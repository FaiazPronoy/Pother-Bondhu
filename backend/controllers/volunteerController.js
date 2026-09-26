import mongoose from 'mongoose';
import userModel from '../models/userModel.js';
import RescueImage from '../models/imageModel.js';
import escapeRegex from '../utils/escapeRegex.js';

export const volunteers = async (req, res) => {
  try {
    const { location } = req.query;

    let query = { role: 'volunteer' };

    if (location) {
      query.location = { $regex: new RegExp(escapeRegex(location), 'i') };
    }

    const volunteers = await userModel.find(query)
      .select('-password -email')
      .sort({ points: -1 }); // Sort by points descending
      
    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch volunteers', error });
  }
};

export const getVolunteerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const volunteer = await userModel.findById(id)
      .select('-password -email');
    
    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    
    // Get volunteer's rescue images with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const [rescueImages, totalImages] = await Promise.all([
      RescueImage.find({ userId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RescueImage.countDocuments({ userId: id })
    ]);
    
    res.status(200).json({
      volunteer,
      rescueImages,
      totalImages,
      totalPages: Math.ceil(totalImages / limit),
      currentPage: page
    });
    
  } catch (error) {
    console.error('Error fetching volunteer profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// New controller to get top volunteers
export const getTopVolunteers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const topVolunteers = await userModel.find({ role: 'volunteer' })
      .sort({ points: -1 })
      .limit(limit)
      .select('name points imageUrl'); // Assuming you'll add profile images later
      
    res.status(200).json(topVolunteers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch top volunteers', error });
  }
};



export const donateToVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { bkashNumber, amount } = req.body;

    if (!bkashNumber || !amount) {
      return res.status(400).json({ message: 'Bkash number and amount are required.' });
    }

    const points = Number(amount);
    if (!Number.isInteger(points) || points < 1) {
      return res.status(400).json({ message: 'Amount must be a positive whole number.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Volunteer not found.' });
    }
    const volunteer = await userModel.findById(id).select('role');
    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ message: 'Volunteer not found.' });
    }
    if (volunteer._id.toString() === req.userId) {
      return res.status(400).json({ message: 'You cannot donate to yourself.' });
    }

    // take from the donor only if they still have it, then add with $inc, so
    // two donations landing together are both counted
    const taken = await userModel.updateOne(
      { _id: req.userId, points: { $gte: points } },
      { $inc: { points: -points } }
    );
    if (taken.modifiedCount !== 1) {
      return res.status(400).json({ message: 'Not enough PetPoints to donate.' });
    }
    const updated = await userModel.findByIdAndUpdate(id, { $inc: { points } }, { new: true }).select('points');

    res.status(200).json({ message: 'Donation successful', updatedPoints: updated.points });
  } catch (err) {
    console.error('Donate Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
