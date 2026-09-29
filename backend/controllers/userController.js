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
  const { name, location, bio, role } = req.body;

  // only name, location, bio, and switching between donor and volunteer
  const updates = {};
  if (name !== undefined) updates.name = String(name).trim().slice(0, 60);
  if (location !== undefined) updates.location = String(location).slice(0, 60);
  if (bio !== undefined) updates.bio = String(bio).slice(0, 500);

  try {
    if (role === 'donor' || role === 'volunteer') {
      const current = await userModel.findById(userId).select('role');
      if (current && current.role !== 'admin') updates.role = role;
    }
    if (updates.name === '') {
      return res.status(400).json({ error: "Name cannot be empty" });
    }

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

    // $inc so two top-ups at once both count, and only the points go back:
    // the whole document would include the password hash
    const user = await userModel.findByIdAndUpdate(userId, { $inc: { points } }, { new: true }).select("points");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: { points: user.points } });
  } catch (error) {
    res.status(500).json({ message: "Failed to add points" });
  }
};


