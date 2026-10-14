const ServerSettings = require('../models/serverSettings');

// NORMAL is the default tier. PREMIUM unlocks all modules unless the bot owner denies one.
const NORMAL_FEATURES = new Set([
    'welcome', 'ticket', 'onboarding', 'stats', 'moderation',
    'autoresponse', 'voicegen', 'goodbye', 'giveaway'
]);

async function getGuildSettings(guildId) {
    if (!guildId) return null;
    return ServerSettings.findOne({ guildId }).lean();
}

async function isFeatureEnabled(guildId, featureName) {
    if (!guildId) return true;
    const settings = await getGuildSettings(guildId);
    const mode = settings?.mode || 'NORMAL';
    // Explicit owner denial always wins, in both modes.
    if (settings?.deniedFeatures?.includes(featureName)) return false;
    if (settings?.features && settings.features[featureName] === false) return false;
    if (mode !== 'PREMIUM' && !NORMAL_FEATURES.has(featureName)) return false;
    return true;
}

module.exports = { isFeatureEnabled, getGuildSettings, NORMAL_FEATURES };
