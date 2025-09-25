const Agency = require('../models/Agency');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// @desc    Register a new agency
exports.registerAgency = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, longitude, latitude } = req.body;

    try {
        let agency = await Agency.findOne({ email });
        if (agency) {
            return res.status(400).json({ msg: 'Agency with this email already exists' });
        }

        agency = new Agency({
            name,
            email,
            password, // The hashing middleware will handle this
            phone,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            }
        });

        await agency.save();

        // Create JWT
        const payload = { agency: { id: agency.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Login agency & get token
exports.loginAgency = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        let agency = await Agency.findOne({ email });
        if (!agency) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, agency.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        
        // Create JWT
        const payload = { agency: { id: agency.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    // New, better code
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error. Please try again later.' });
  }
};