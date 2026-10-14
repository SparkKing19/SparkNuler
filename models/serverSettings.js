const mongoose = require('mongoose');

const serverSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    mode: { type: String, enum: ['NORMAL', 'PREMIUM'], default: 'NORMAL' },
    deniedFeatures: { type: [String], default: [] },
    customLogoUrl: { type: String, default: null },
    features: {
        welcome: { type: Boolean, default: true },
        ticket: { type: Boolean, default: true },
        onboarding: { type: Boolean, default: true },
        stats: { type: Boolean, default: true },
        store: { type: Boolean, default: true },
        moderation: { type: Boolean, default: true },
        autoresponse: { type: Boolean, default: true },
        voicegen: { type: Boolean, default: true },
        apply: { type: Boolean, default: true },
        youtube: { type: Boolean, default: true },
        invite: { type: Boolean, default: true },
        goodbye: { type: Boolean, default: true },
        giveaway: { type: Boolean, default: true },
        music: { type: Boolean, default: true },
        antinuke: { type: Boolean, default: true },
        leveling: { type: Boolean, default: true },
        nitroemoji: { type: Boolean, default: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('ServerSettings', serverSettingsSchema);
