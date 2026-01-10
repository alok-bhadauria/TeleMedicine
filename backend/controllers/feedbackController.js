const Feedback = require('../models/Feedback');

exports.submitFeedback = async (req, res) => {
    try {
        console.log("Feedback Submission:");
        console.log("User:", req.user);
        console.log("Body:", req.body);

        const { type, rating, message } = req.body;

        if (!req.user) {
            throw new Error("User not authenticated context missing");
        }

        if (!type || !message) {
            return res.status(400).json({ success: false, error: 'Type and message are required' });
        }

        const feedback = new Feedback({
            userId: req.user._id,
            type,
            rating: rating ? parseInt(rating) : undefined,
            message
        });

        await feedback.save();

        res.json({ success: true, message: 'Feedback submitted successfully' });
    } catch (err) {
        console.error('Feedback Error Details:', err);
        res.status(500).json({ success: false, error: 'Failed to submit feedback: ' + err.message });
    }
};
