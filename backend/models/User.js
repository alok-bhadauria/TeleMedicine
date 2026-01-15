const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ReviewSchema = new mongoose.Schema({
    patientId: { type: String, ref: 'User' },
    rating: Number,
    comment: String,
    date: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
    _id: { type: String }, // Custom ID: PATxxxxxx, DOCxxxxxx, ADMxxxxxx
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    mobileNumber: { type: String },
    profilePic: { type: String, default: '/images/default-profile.png' },
    googleId: { type: String },

    // Doctor Specific
    speciality: { type: String },
    qualification: { type: String },
    experience: { type: Number }, // Years
    charges: { type: Number },
    clinicLocation: { // For storing map coordinates
        lat: { type: Number },
        lng: { type: Number }
    },
    availability: [{
        day: { type: String }, // e.g., "Monday"
        slots: [{ type: String }] // e.g., ["10:00 AM", "10:30 AM"]
    }],
    bio: { type: String },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'suspended'], default: 'pending' },
    isBlocked: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviews: [ReviewSchema],
    qualificationImages: [{ type: String }], // Array of Cloudinary URLs
    meetingRequestStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },

    // Patient Specific
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String },
    address: { type: String },
    emergencyContact: { type: String },

    createdAt: { type: Date, default: Date.now }
});

// Password Hash Middleware
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Match Password Method
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
