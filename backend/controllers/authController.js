import User from '../models/User.js';
import { generateToken } from '../utils/jwtToken.js';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
  try {
    const { email,name, password } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);


    // Create new user
    const user = new User({ email,name, password: password_hash });
    await user.save();

    // Generate JWT
    const token = generateToken(user);

    res.status(201).json({ 
      token,
      user: { 
        id: user._id, 
        name: user.name,
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid Email or Password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Email or Password' });
    }

    // Generate JWT
    const token = generateToken(user);

    res.json({ 
      token,
      user: { 
        id: user._id, 
        name: user.name,
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};


export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // 1. Basic validation
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide current password and new password.' });
    }

    if (newPassword.length < 4) {
        return res.status(400).json({ message: 'New password must be at least 4 characters long.' });
    }

    try {
        // req.user will come from your authentication middleware (e.g., JWT verification)
        // It should contain the ID of the authenticated user
        const user = await User.findById(req.user._id).select('+password'); // Select password field explicitly

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 2. Compare current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        // 3. Check if new password is the same as current password
        if (newPassword === currentPassword) {
            return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
        }

        // 4. Hash the new password and save
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt); // Hash with a salt round of 10
        await user.save();

        res.status(200).json({ message: 'Password changed successfully!' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error. Could not change password.' });
    }
};