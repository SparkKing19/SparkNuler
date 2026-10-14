const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ModerationConfig = require('../models/moderation');

const BOT_OWNERS = ['1266728371719508062', '1474216218792558735'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Add or remove multiple roles from a user')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add one or more roles to a user')
                .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
                .addStringOption(opt => opt.setName('roles').setDescription('Role mentions or IDs (for example, @Role1 @Role2, separated by spaces or commas)').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove one or more roles from a user')
                .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
                .addStringOption(opt => opt.setName('roles').setDescription('Role mentions or IDs (for example, @Role1 @Role2, separated by spaces or commas)').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
        ),

    async execute(interaction) {
        const config = await ModerationConfig.findOne({ guildId: interaction.guild.id });
        const isBotOwner = BOT_OWNERS.includes(interaction.user.id);
        const isOwner = interaction.user.id === interaction.guild.ownerId;
        const isExtraOwner = config?.extraOwners?.includes(interaction.user.id);
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const userGrantedPerms = config?.userModPerms?.get(interaction.user.id) || [];
        const hasPerm = isBotOwner || isOwner || isExtraOwner || isAdmin || userGrantedPerms.includes('role');

        if (!hasPerm) {
            return interaction.reply({ content: '❌ You do not have permission to execute `/role`.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const sub = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const rolesInput = interaction.options.getString('roles');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) return interaction.editReply('❌ The user is not in this server.');

        const roleIds = rolesInput.match(/\d{17,20}/g) || [];
        if (roleIds.length === 0) {
            return interaction.editReply('❌ No valid role mention or ID was provided.');
        }

        const botHighestRole = interaction.guild.members.me.roles.highest;
        const successRoles = [];
        const failedRoles = [];

        for (const id of roleIds) {
            const role = interaction.guild.roles.cache.get(id);
            if (!role) {
                failedRoles.push(`\`${id}\` (Not found)`);
                continue;
            }
            if (role.position >= botHighestRole.position) {
                failedRoles.push(`${role.name} (Higher than bot)`);
                continue;
            }

            try {
                if (sub === 'add') {
                    await member.roles.add(role, `${reason} \vert{} Moderator:${interaction.user.tag}`);
                } else {
                    await member.roles.remove(role, `${reason} \vert{} Moderator:${interaction.user.tag}`);
                }
                successRoles.push(`<@&${role.id}>`);
            } catch (e) {
                failedRoles.push(role.name);
            }
        }

        const logEmbed = new EmbedBuilder()
            .setColor(sub === 'add' ? '#2ECC71' : '#E67E22')
            .setTitle(`🛡️ Multiple Roles ${sub === 'add' ? 'Added' : 'Removed'}`)
            .addFields(
                { name: 'Target User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
                { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Success Roles', value: successRoles.length > 0 ? successRoles.join(' ') : 'None', inline: false }
            )
            .setTimestamp();

        if (failedRoles.length > 0) {
            logEmbed.addFields({ name: 'Failed Roles', value: failedRoles.join(', '), inline: false });
        }

        if (config?.modLogsChannelId) {
            const logsChannel = interaction.guild.channels.cache.get(config.modLogsChannelId);
            if (logsChannel) await logsChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }

        return interaction.editReply(
            `✅ Roles ${sub === 'add' ? 'added to' : 'removed from'} <@${member.id}>:\n` +
            `• **Success:** ${successRoles.length > 0 ? successRoles.join(' ') : 'None'}\n` +
            (failedRoles.length > 0 ? `• **Failed:** ${failedRoles.join(', ')}` : '')
        );
    }
};
