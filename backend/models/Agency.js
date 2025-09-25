const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AgencySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
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
    expertise: [String],
    serviceRegion: String,
    alerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }]
}, { timestamps: true });

AgencySchema.index({ location: '2dsphere' });

AgencySchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('Agency', AgencySchema);