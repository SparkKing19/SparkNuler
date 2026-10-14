const mongoose = require('mongoose');
const levelingSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    messagesPerLevel: { type: Number, default: 25, min: 1, max: 10000 },
    announceChannelId: { type: String, default: null },
    announceMessage: { type: String, default: 'Congratulations {user}! You reached level {level}.' },
    members: { type: Map, of: new mongoose.Schema({ messages: { type: Number, default: 0 }, level: { type: Number, default: 0 } }, { _id: false }), default: {} }
}, { timestamps: true });
module.exports = mongoose.model('Leveling', levelingSchema);
