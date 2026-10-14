const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Leveling = require('../models/leveling');
const { isFeatureEnabled } = require('../utils/featureCheck');
const BOT_OWNERS = ['1266728371719508062', '1474216218792558735'];

module.exports = (client) => {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.guild) return;
        if (interaction.isButton() && interaction.customId === 'open_leveling_modal') {
            if (!(BOT_OWNERS.includes(interaction.user.id) || interaction.user.id === interaction.guild.ownerId || interaction.memberPermissions?.has(PermissionFlagsBits.Administrator))) {
                return interaction.reply({ content: 'Only the server owner or an administrator can configure leveling.', ephemeral: true });
            }
            if (!(await isFeatureEnabled(interaction.guild.id, 'leveling'))) return interaction.reply({ content: 'The Leveling feature is disabled for this server by the bot owner.', ephemeral: true });
            const config = await Leveling.findOne({ guildId: interaction.guild.id }) || {};
            const modal = new ModalBuilder().setCustomId('leveling_config_modal').setTitle('Leveling Configuration');
            const count = new TextInputBuilder().setCustomId('level_messages_count').setLabel('Messages required per level').setStyle(TextInputStyle.Short).setPlaceholder('25').setValue(String(config.messagesPerLevel || 25)).setRequired(true);
            const channel = new TextInputBuilder().setCustomId('level_announce_channel').setLabel('Announcement channel ID (optional)').setStyle(TextInputStyle.Short).setPlaceholder('Leave blank to announce in the message channel').setValue(config.announceChannelId || '').setRequired(false);
            const template = new TextInputBuilder().setCustomId('level_announce_text').setLabel('Announcement text').setStyle(TextInputStyle.Paragraph).setPlaceholder('Congratulations {user}! You reached level {level}.').setValue(config.announceMessage || 'Congratulations {user}! You reached level {level}.').setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(count), new ActionRowBuilder().addComponents(channel), new ActionRowBuilder().addComponents(template));
            return interaction.showModal(modal);
        }
        if (interaction.isModalSubmit() && interaction.customId === 'leveling_config_modal') {
            if (!(BOT_OWNERS.includes(interaction.user.id) || interaction.user.id === interaction.guild.ownerId || interaction.memberPermissions?.has(PermissionFlagsBits.Administrator))) {
                return interaction.reply({ content: 'Only the server owner or an administrator can configure leveling.', ephemeral: true });
            }
            if (!(await isFeatureEnabled(interaction.guild.id, 'leveling'))) return interaction.reply({ content: 'The Leveling feature is disabled for this server by the bot owner.', ephemeral: true });
            const raw = interaction.fields.getTextInputValue('level_messages_count').trim();
            const messagesPerLevel = Number(raw);
            if (!Number.isInteger(messagesPerLevel) || messagesPerLevel < 1 || messagesPerLevel > 10000) return interaction.reply({ content: 'Enter a whole number from 1 to 10,000.', ephemeral: true });
            const announceChannelId = interaction.fields.getTextInputValue('level_announce_channel').trim() || null;
            const announceMessage = interaction.fields.getTextInputValue('level_announce_text').trim();
            await Leveling.findOneAndUpdate({ guildId: interaction.guild.id }, { messagesPerLevel, announceChannelId, announceMessage, enabled: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
            return interaction.reply({ content: `Leveling is configured. Members gain one level every **${messagesPerLevel} messages**.`, ephemeral: true });
        }
    });

    client.on('messageCreate', async (message) => {
        if (!message.guild || message.author.bot || !(await isFeatureEnabled(message.guild.id, 'leveling'))) return;
        const config = await Leveling.findOne({ guildId: message.guild.id });
        if (!config || !config.enabled) return;
        const memberData = config.members.get(message.author.id) || { messages: 0, level: 0 };
        memberData.messages += 1;
        const nextLevel = Math.floor(memberData.messages / Math.max(1, config.messagesPerLevel || 25));
        if (nextLevel <= memberData.level) {
            config.members.set(message.author.id, memberData);
            await config.save();
            return;
        }
        memberData.level = nextLevel;
        config.members.set(message.author.id, memberData);
        await config.save();
        const channel = config.announceChannelId ? message.guild.channels.cache.get(config.announceChannelId) : message.channel;
        if (channel?.isTextBased()) {
            const text = (config.announceMessage || 'Congratulations {user}! You reached level {level}.')
                .replace(/\{user\}/gi, `<@${message.author.id}>`)
                .replace(/\{username\}/gi, message.author.username)
                .replace(/\{level\}/gi, String(nextLevel))
                .replace(/\{server\}/gi, message.guild.name);
            await channel.send({ content: text }).catch(() => {});
        }
    });

    client.on('messageCreate', async (message) => {
        if (!message.guild || message.author.bot || !message.content.startsWith('%')) return;
        const [cmd, ...args] = message.content.slice(1).trim().split(/\s+/);
        if (cmd?.toLowerCase() !== 'rank' && cmd?.toLowerCase() !== 'level') return;
        if (!(await isFeatureEnabled(message.guild.id, 'leveling'))) return message.reply('The Leveling feature is disabled for this server.');
        const target = message.mentions.users.first() || message.author;
        const config = await Leveling.findOne({ guildId: message.guild.id });
        const data = config?.members.get(target.id) || { messages: 0, level: 0 };
        const needed = Math.max(1, config?.messagesPerLevel || 25);
        const embed = new EmbedBuilder().setColor('#5865F2').setTitle(`${target.username}'s Level`).setThumbnail(target.displayAvatarURL()).addFields(
            { name: 'Level', value: String(data.level || 0), inline: true },
            { name: 'Messages', value: String(data.messages || 0), inline: true },
            { name: 'Next Level', value: `${Math.max(0, needed - ((data.messages || 0) % needed))} messages`, inline: true }
        );
        return message.reply({ embeds: [embed] });
    });
};
