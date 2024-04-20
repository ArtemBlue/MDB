const { SlashCommandBuilder } = require('discord.js');

const infoCommand = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Display user or server information')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Display user information')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to get information about')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Display server information')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'user') {
            const targetUser = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.get(targetUser.id);

            if (!member) {
                await interaction.reply('User is not a member of this server.');
                return;
            }

            const roles = member.roles.cache.filter(role => role.name !== '@everyone').map(role => role.name).join(', ') || 'None';
            const userStatus = member.presence?.status || 'Offline'; // Fetch user's status
            const activity = member.presence?.activities[0] || null; // Fetch user's activity

            const embed = {
                color: member.displayHexColor ? parseInt(member.displayHexColor.replace('#', ''), 16) : 0x000000,
                author: {
                    name: `${targetUser.username}`,
                    icon_url: targetUser.displayAvatarURL({ dynamic: true }),
                },
                description: '__**User Information**__',
                fields: [
                    {
                        name: 'User:',
                        value: `${interaction.user}`,
                        inline: true,
                    },
                    {
                        name: 'Username:',
                        value: `${targetUser.username}`,
                        inline: true,
                    },
                    {
                        name: 'User ID:',
                        value: `${targetUser.id}`,
                        inline: true,
                    },
                    {
                        name: '**Status:**',
                        value: userStatus,
                        inline: true,
                    },
                    {
                        name: '**Activity:**',
                        value: activity ? activity.name : 'None',
                        inline: true,
                    },
                    {
                        name: '**Roles:**',
                        value: roles,
                    },
                    {
                        name: '**Permissions:**',
                        value: member.permissions.toArray().join(', ') || 'None',
                    },
                    {
                        name: '**Created On:**',
                        value: targetUser.createdAt.toUTCString(),
                    },
                    {
                        name: '**Joined On:**',
                        value: member.joinedAt.toUTCString(),
                    },
                ],
                thumbnail: {
                    url: targetUser.displayAvatarURL({ dynamic: true }),
                },
            };

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (subcommand === 'server') {
            const guild = interaction.guild;

            const embed = {
                color: guild.me?.displayHexColor ? parseInt(guild.me.displayHexColor.replace('#', ''), 16) : 0x000000,
                author: {
                    name: guild.name,
                    icon_url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
                },
                description: '__**Server Information**__',
                fields: [
                    {
                        name: '**Server Description:**',
                        value: guild.description || 'None',
                    },
                    {
                        name: '**Server Invite Link:**',
                        value: guild.vanityURLCode ? `https://discord.gg/${guild.vanityURLCode}` : 'None',
                    },
                    {
                        name: '**Server Boost Level:**',
                        value: guild.premiumTier ? guild.premiumTier.toString() : 'None',
                    },
                    {
                        name: '**Created On:**',
                        value: guild.createdAt.toUTCString(),
                    },
                    {
                        name: '**Server Member Count:**',
                        value: guild.memberCount.toString(),
                    },
                ],
                thumbnail: {
                    url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
                },
                image: guild.banner ? { url: `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=4096` } : null,
                url: guild.banner ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=4096` : null,
            };

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};

module.exports = {
    data: infoCommand.data,
    execute: infoCommand.execute,
};
