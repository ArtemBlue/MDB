const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const banCommand = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Manage user bans')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addSubcommand(subcommand => subcommand
            .setName('user')
            .setDescription('Ban a user')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
            .addStringOption(option => option
                .setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(false))
        )
        .addSubcommand(subcommand => subcommand
            .setName('list')
            .setDescription('List all banned users')
        )
        .addSubcommand(subcommand => subcommand
            .setName('unban')
            .setDescription('Unban a user')
            .addStringOption(option => option
                .setName('user')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;

        if (subcommand === 'user') {
            const userToBan = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Load the guilds.json file
            const guildConfigPath = path.join(__dirname, '../../../persistentdata/guilds.json');
            const guildsData = JSON.parse(fs.readFileSync(guildConfigPath, 'utf-8'));

            // Get ban-proof roles for the guild
            const guildConfig = guildsData.guilds[guild.id];
            const banProofRoles = guildConfig ? guildConfig.banProofRoles : [];

            // Fetch the member and check their roles
            const member = await guild.members.fetch(userToBan.id);
            const hasBanProofRole = member.roles.cache.some(role => banProofRoles.includes(role.id));

            if (hasBanProofRole) {
                // User has a ban-proof role; ban is not allowed
                await interaction.reply({
                    content: `User ${userToBan.tag} has a ban-proof role and cannot be banned.`,
                    ephemeral: true
                });
            } else {
                // Proceed with the ban
                try {
                    await guild.members.ban(userToBan.id, { reason });
                    await interaction.reply({
                        content: `Banned ${userToBan.tag} for reason: ${reason}`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error(`Error banning user: ${error}`);
                    await interaction.reply({
                        content: `Failed to ban user: ${userToBan.tag}`,
                        ephemeral: true
                    });
                }
            }
        } else if (subcommand === 'list') {
            // Handle /ban list
            try {
                const bans = await guild.bans.fetch();
                const banCount = bans.size;

                if (banCount === 0) {
                    await interaction.reply({ content: 'There are 0 banned users.', ephemeral: true });
                } else {
                    const itemsPerPage = 5; // Number of banned users per page
                    let currentPage = 1;
                    const totalPages = Math.ceil(banCount / itemsPerPage);

                    // Function to create an embed for the current page
                    const createEmbed = (bans, pageNumber) => {
                        // Calculate the start and end index for the current page
                        const startIndex = (pageNumber - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;

                        // Extract the banned users for the current page
                        const currentBans = Array.from(bans.values()).slice(startIndex, endIndex);

                        // Format the list of banned users for the current page
                        const banList = currentBans.map(ban => `${ban.user.tag} (${ban.user.id}): ${ban.reason || 'No reason provided'}`).join('\n');

                        // Create an embed with the title including the number of banned users and the current page
                        return new EmbedBuilder()
                            .setTitle(`Banned Users: ${banCount} (Page ${pageNumber} of ${totalPages})`)
                            .setDescription(banList)
                            .setColor('#FF0000');
                    };

                    // Create an initial embed for the first page
                    let currentEmbed = createEmbed(bans, currentPage);

                    // Create navigation buttons
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setLabel('◀️')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === 1),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('▶️')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === totalPages)
                        );

                    // Send the initial reply with the embed and navigation buttons
                    const reply = await interaction.reply({ embeds: [currentEmbed], components: [row], ephemeral: true });

                    // Handle button interaction for pagination
                    const filter = i => i.user.id === interaction.user.id && ['prev', 'next'].includes(i.customId);
                    const collector = reply.createMessageComponentCollector({ filter, time: 30000 }); // Collect interactions for 30 seconds

                    collector.on('collect', async i => {
                        if (i.customId === 'prev') {
                            currentPage--;
                        } else if (i.customId === 'next') {
                            currentPage++;
                        }

                        // Update the current embed and navigation buttons
                        currentEmbed = createEmbed(bans, currentPage);
                        const newRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('prev')
                                    .setLabel('◀️')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(currentPage === 1),
                                new ButtonBuilder()
                                    .setCustomId('next')
                                    .setLabel('▶️')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(currentPage === totalPages)
                            );

                        // Edit the original reply to reflect the changes
                        await i.update({ embeds: [currentEmbed], components: [newRow] });
                    });

                    // After the collector ends, disable the buttons
                    collector.on('end', () => {
                        const disabledRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('prev')
                                    .setLabel('◀️')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('next')
                                    .setLabel('▶️')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            );

                        reply.edit({ components: [disabledRow] });
                    });
                }
            } catch (error) {
                console.error(`Error fetching banned users list: ${error}`);
                await interaction.reply({ content: 'Failed to fetch banned users list.', ephemeral: true });
            }

        } else if (subcommand === 'unban') {
            // Handle /ban unban <user>
            const userId = interaction.options.getString('user');

            try {
                await guild.members.unban(userId);
                await interaction.reply(`Unbanned user with ID: ${userId}`);
            } catch (error) {
                console.error(`Error unbanning user: ${error}`);
                await interaction.reply(`Failed to unban user with ID: ${userId}`);
            }
        }
    }
};

module.exports = {
    data: banCommand.data,
    execute: banCommand.execute,
};
