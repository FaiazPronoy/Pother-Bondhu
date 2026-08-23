import userModel from "../models/userModel.js";


export const getUserData = async (req, res) => {
  const { userId } = req;
  try {
    if (!userId) {
      return res.json({ success: false });
    }

    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.json({ success: false });
    }
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        bio: user.bio,
        role: user.role,
        points: user.points,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

export const setUserData = async (req, res) => {
  const { userId } = req;
  const { name, location, bio } = req.body;

  // only name, location and bio are updatable here
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (location !== undefined) updates.location = location;
  if (bio !== undefined) updates.bio = bio;

  try {
    const updatedUser = await userModel.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

export const addPoints = async (req, res) => {
  try {
    const {userId} = req;
    const { bkashNumber, amount } = req.body;

    if (!bkashNumber || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // no real payment gateway yet, so cap it
    const points = Number(amount);
    if (!Number.isInteger(points) || points < 1 || points > 10000) {
      return res.status(400).json({ message: "Amount must be a whole number between 1 and 10000" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.points += points;
    await user.save();

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Failed to add points" });
  }
};


