const Agency = require('../models/Agency');
const Issue = require('../models/Issue');
const Collaboration = require('../models/Collaboration');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, text) => {
    const msg = { to, from: process.env.SENDER_EMAIL, subject, text };
    try {
        console.log("--- ATTEMPTING TO SEND EMAIL VIA SENDGRID ---");
        await sgMail.send(msg);
        console.log("--- EMAIL SENT SUCCESSFULLY VIA SENDGRID ---");
    } catch (error) {
        console.error("!!! SENDGRID ERROR !!!");
        if (error.response) {
            console.error(error.response.body);
        } else {
            console.error(error);
        }
        throw new Error('Failed to send notification email via SendGrid.');
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const agency = await Agency.findById(req.agency.id).select('-password');
        res.json(agency);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateMyProfile = async (req, res) => {
    const { name, phone, expertise, serviceRegion, longitude, latitude } = req.body;
    const profileFields = {};
    if (name) profileFields.name = name;
    if (phone) profileFields.phone = phone;
    if (expertise) profileFields.expertise = expertise.split(',').map(item => item.trim());
    if (serviceRegion) profileFields.serviceRegion = serviceRegion;
    if (longitude && latitude) {
        profileFields.location = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
    }
    try {
        let agency = await Agency.findByIdAndUpdate(
            req.agency.id,
            { $set: profileFields },
            { new: true, runValidators: true }
        ).select('-password');
        if (!agency) return res.status(404).json({ msg: 'Agency not found' });
        res.json(agency);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const agency = await Agency.findById(req.agency.id).populate('alerts');
        if (!agency) return res.status(404).json({ msg: 'Agency not found' });
        res.json(agency.alerts);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// In agencyController.js, modify the acceptIssue function

exports.acceptIssue = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        const agency = await Agency.findById(req.agency.id);
        // ... (all the existing checks and logic)
        
        issue.status = 'Accepted';
        issue.acceptedBy = req.agency.id;
        await issue.save();
        
        agency.alerts.pull(issue._id);
        await agency.save();

        // --- ADD THIS NEW LINE ---
        // Broadcast to all clients that this issue is now accepted
        req.io.emit('issueAcceptedUpdate', { issueId: issue._id });
        // --- END OF NEW LINE ---
        
        const emailText = `...`;
        await sendEmail(issue.userEmail, 'Your Rescue Request has been Accepted!', emailText);
        res.json({ msg: 'Issue accepted and user has been notified.' });
    } catch (err) {
        // ... (existing error handling)
    }
};

exports.getAllAgencies = async (req, res) => {
    try {
        const agencies = await Agency.find({ _id: { $ne: req.agency.id } }).select('name email phone');
        res.json(agencies);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.sendCollaborationRequest = async (req, res) => {
    const { requestedAgencyId, issueId, message } = req.body;
    try {
        const newCollaboration = new Collaboration({
            requestingAgency: req.agency.id,
            requestedAgency: requestedAgencyId,
            issue: issueId,
            message
        });
        await newCollaboration.save();
        res.status(201).json({ msg: 'Collaboration request sent.', collaboration: newCollaboration });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getCollaborationRequests = async (req, res) => {
    try {
        const requests = await Collaboration.find({ requestedAgency: req.agency.id, status: 'Pending' })
            .populate('requestingAgency', 'name email')
            .populate('issue', 'description');
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.respondToCollaborationRequest = async (req, res) => {
    const { requestId } = req.params;
    const { response } = req.body;
    if (!['Accepted', 'Rejected'].includes(response)) {
        return res.status(400).json({ msg: 'Invalid response value.' });
    }
    try {
        const request = await Collaboration.findById(requestId);
        if (!request || request.requestedAgency.toString() !== req.agency.id) {
            return res.status(401).json({ msg: 'Not authorized.' });
        }
        if (request.status !== 'Pending') {
            return res.status(400).json({ msg: 'Request already responded to.' });
        }
        request.status = response;
        await request.save();
        res.json({ msg: `Request ${response.toLowerCase()}.`, request });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
exports.rejectIssue = async (req, res) => {
    try {
        // Find the currently logged-in agency and pull the issue ID from its alerts array
        await Agency.findByIdAndUpdate(req.agency.id, {
            $pull: { alerts: req.params.id }
        });
        res.json({ msg: 'Issue alert dismissed.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};