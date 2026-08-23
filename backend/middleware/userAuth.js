import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenDecode.id) {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
    }

    // role comes from the database rather than the token, otherwise a token
    // issued before a role change would still carry the old role for 7 days
    const user = await userModel.findById(tokenDecode.id).select('email role');
    if (!user) {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
    }

    req.userId = user._id.toString();
    req.user = { id: req.userId, email: user.email, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
  }
};

export default userAuth;
