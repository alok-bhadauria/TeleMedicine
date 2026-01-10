const HealthTrack = require('../models/HealthTrack');

// Add Vitals Log
// Add Vitals Log
exports.addVital = async (req, res) => {
    try {
        const { heart_rate, bp_sys, bp_dia, weight } = req.body;
        const patientId = req.user.id;
        const promises = [];

        if (heart_rate) {
            promises.push(new HealthTrack({ patientId, type: 'heart_rate', value: heart_rate }).save());
        }

        if (weight) {
            promises.push(new HealthTrack({ patientId, type: 'weight', value: weight }).save());
        }

        if (bp_sys && bp_dia) {
            promises.push(new HealthTrack({ patientId, type: 'blood_pressure', value: `${bp_sys}/${bp_dia}` }).save());
        }

        await Promise.all(promises);

        req.flash('success_msg', 'Vitals logged successfully');
        res.redirect('/vitals');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to log vitals');
        res.redirect('/vitals');
    }
};

// Get Vitals History
exports.getVitals = async (req, res) => {
    try {
        const query = { patientId: req.user.id };
        const vitals = await HealthTrack.find(query).sort({ recordedAt: -1 });

        // Grouping Logic for Table
        const groupedMap = new Map();

        vitals.forEach(vital => {
            // Group by minute precision
            const dateObj = new Date(vital.recordedAt);
            const key = dateObj.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

            if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                    date: dateObj,
                    heart_rate: '-',
                    bp: '-',
                    weight: '-'
                });
            }

            const entry = groupedMap.get(key);
            if (vital.type === 'heart_rate') entry.heart_rate = vital.value;
            else if (vital.type === 'blood_pressure') entry.bp = vital.value;
            else if (vital.type === 'weight') entry.weight = vital.value;
        });

        const groupedVitals = Array.from(groupedMap.values());

        res.render('pages/vitals', {
            title: 'MediConnect | Health Vitals',
            user: req.user,
            vitals: vitals, // Raw data for charts
            groupedVitals: groupedVitals
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// API: Get Vitals Data (JSON) for Client-Side Charts
exports.getVitalsData = async (req, res) => {
    try {
        const query = { patientId: req.user.id };
        const vitals = await HealthTrack.find(query).sort({ recordedAt: 1 }); // Sort ascending for charts
        res.json(vitals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};
