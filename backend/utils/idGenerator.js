const User = require('../models/User');

const generateUserId = async (role) => {
    let prefix = '';

    switch (role) {
        case 'patient': prefix = 'PAT'; break;
        case 'doctor': prefix = 'DOC'; break;
        case 'admin': prefix = 'ADM'; break;
        default: prefix = 'USR';
    }

    // Find the latest user with this role to increment ID
    // Note: detailed implementation might need a counter collection for strict sequence,
    // but for now, we'll try random or timestamp based to ensure uniqueness if not strictly sequential.
    // Requirement says "randomly generated unique user id like PA101242"

    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digit random number
    const newId = `${prefix}${randomNum}`;

    // distinct check
    const exists = await User.findById(newId);
    if (exists) {
        return generateUserId(role); // Recursively try again if exists
    }

    return newId;
};

module.exports = generateUserId;
