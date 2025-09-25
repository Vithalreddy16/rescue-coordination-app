const { validationResult } = require('express-validator');
const Issue = require('../models/Issue');
const Agency = require('../models/Agency');

exports.createIssue = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userName, userPhone, userEmail, longitude, latitude, description } = req.body;

    try {
        const newIssue = new Issue({
            userName,
            userPhone,
            userEmail,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            description
        });

        const issue = await newIssue.save();

        const nearbyAgencies = await Agency.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: issue.location.coordinates
                    },
                    $maxDistance: 20000 // 20km
                }
            }
        });

        if (nearbyAgencies.length === 0) {
            return res.json({ msg: 'Issue submitted, but no agencies were found nearby.' });
        }

        console.log(`Found ${nearbyAgencies.length} nearby agencies. Emitting alerts...`);
        nearbyAgencies.forEach(async (agency) => {
            agency.alerts.push(issue._id);
            await agency.save();
            req.io.to(agency._id.toString()).emit('newIssueAlert', issue);
        });

        res.status(201).json({ msg: 'Issue submitted. Nearby agencies have been alerted.', issue });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getMyIssues = async (req, res) => {
    try {
        const issues = await Issue.find({ acceptedBy: req.agency.id });
        res.json(issues);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};