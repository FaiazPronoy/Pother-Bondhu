import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';


export const register = async (req, res) => {
    const {name, email, password} = req.body

    if (!name || !email || !password){
        return res.json({success: false, message: "Missing Details"})
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
            subject: "Welcome to SavePaws: Animal Rescue Network",
            text: "Welcome to SavePaws: Animal Rescue Network. Your Account has been created."
        }

        // the account already exists at this point, so a mail failure must not
        // be reported as a failed signup - the user would retry and be told
        // their email is already taken
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
        const user = await userModel.findOne({email}) 
        if(!user){
            return res.json({success:false, message: "Invalid Email"})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            return res.json({success:false, message: "Invalid Password"})
        }

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


// In your authController.js
export const authStatus = async (req, res) => {
    const {userId} = req
    try {
        if (!userId) {
            return res.json({ success: false });
        }

        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.json({ success: false });
        }

        res.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};
