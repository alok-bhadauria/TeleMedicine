const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Rating', 'Suggestion', 'Idea', 'Complaint', 'Query'],
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
