import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

// Five wrong passwords lock that email for fifteen minutes. Kept in memory,
// which is enough for one server; it resets when the server restarts.
const FAILS_ALLOWED = 5;
const LOCK_MS = 15 * 60 * 1000;
const failures = new Map();

const isLocked = (email) => {
    const f = failures.get(email);
    if (!f) return false;
    if (Date.now() - f.first > LOCK_MS) { failures.delete(email); return false; }
    return f.count >= FAILS_ALLOWED;
};
const noteFailure = (email) => {
    const f = failures.get(email);
    if (!f || Date.now() - f.first > LOCK_MS) failures.set(email, { count: 1, first: Date.now() });
    else f.count++;
};


export const register = async (req, res) => {
    const {name, email, password} = req.body

    if (!name || !email || !password){
        return res.json({success: false, message: "Missing Details"})
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.json({success: false, message: "That email does not look right"})
    }
    if (String(password).length < 8) {
        return res.json({success: false, message: "Use a password of at least 8 characters"})
    }

    try {

        const existingUser = await userModel.findOne({email})
        if(existingUser){
            return res.json({success: false, message: "User Already Exists"})
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({name, email, password: hashedPassword});
        await user.save();

        const token = jwt.sign({ id: user._id},process.env.JWT_SECRET,{ expiresIn: "7d" });
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', 
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        //Sending Welcome Email
        const mailOptions = {
            from : process.env.SENDER_EMAIL,
            to : email,
            subject: "Welcome to Pother Bondhu",
            text: "Welcome to Pother Bondhu. Your account is ready, and the strays of your area just got one more friend."
        }

        // account is already saved, don't fail the signup if the mail bounces
        try {
            await transporter.sendMail(mailOptions)
        } catch (mailError) {
            console.error('Welcome email failed to send:', mailError.message)
        }

        return res.json({success:true})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}


export const login = async (req, res) => {

    const {email, password} = req.body

    if(!email || !password){
        return res.json({success:false, message: 'Email and Password are required'})
    }

    try {
        const key = String(email).toLowerCase().trim()
        if (isLocked(key)) {
            return res.status(429).json({success:false, message: "Too many wrong tries. Please wait 15 minutes."})
        }

        // one message for both, so the form cannot be used to find out who has an account
        const user = await userModel.findOne({email})
        const isMatch = user ? await bcrypt.compare(password, user.password) : false

        if(!isMatch){
            noteFailure(key)
            return res.json({success:false, message: "Wrong email or password"})
        }
        failures.delete(key)

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );
          
          

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', 
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({
            success: true,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
          

    } catch (error) {
        return res.json({success:false, message: error.message})
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', 
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({success:true, message: 'Logged out'})
    } catch (error) {
        return res.json({success:false, message: error.message})
    }
}


export const isAuthenticated = async(req, res) => {
    try {
        return res.json({success:true})
    } catch (error) {
        return res.json({success:false, message: error.message})
    }
}


// Asked on every page load, signed in or not, so a visitor gets a plain
// "no" instead of a 401 that shows up as an error in the browser console.
export const authStatus = async (req, res) => {
    const { token } = req.cookies;
    try {
        if (!token) {
            return res.json({ success: false });
        }
        let userId;
        try {
            userId = jwt.verify(token, process.env.JWT_SECRET).id;
        } catch {
            return res.json({ success: false });
        }

        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.json({ success: false });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                points: user.points,
                location: user.location,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};
