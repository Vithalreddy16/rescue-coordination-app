const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Resolved'],
        default: 'Pending'
    },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', default: null }
}, { timestamps: true });

IssueSchema.index({ location: '2dsphere' }); // Crucial for geospatial queries

module.exports = mongoose.model('Issue', IssueSchema);