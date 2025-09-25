const mongoose = require('mongoose');

const CollaborationSchema = new mongoose.Schema({
    requestingAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
    requestedAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Collaboration', CollaborationSchema);