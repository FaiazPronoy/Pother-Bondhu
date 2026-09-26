import userModel from '../models/userModel.js';
import Team from '../models/teamModel.js';
import RescueImage from '../models/imageModel.js';
import Order from '../models/Order.js';

// the numbers on the landing page, counted from the database rather than typed in
export const publicStats = async (req, res) => {
  try {
    const [rescues, volunteers, teams, donated] = await Promise.all([
      RescueImage.countDocuments(),
      userModel.countDocuments({ role: 'volunteer' }),
      Team.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$donation' } } }]),
    ]);
    res.json({ rescues, volunteers, teams, donated: donated[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Could not count' });
  }
};
