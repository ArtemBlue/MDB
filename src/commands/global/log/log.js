const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const logCommand = {
    data: new SlashCommandBuilder()
        .setName('log')
        .setDescription('Display command logs with filtering and pagination options.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ViewAuditLog)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Filter logs by user.')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName('olderthan')
                .setDescription('Filter logs older than a specific number of days (e.g., 5).')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName('youngerthan')
                .setDescription('Filter logs younger than a specific number of days (e.g., 30).')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('contains')
                .setDescription('Filter logs containing specific words.')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const guildId = interaction.guildId;
            const logFilePath = path.join(__dirname, '../../../persistentdata', `${guildId}_cmdlogs.log`);

            if (!fs.existsSync(logFilePath)) {
                await interaction.reply({ content: 'No log data available for this server.', ephemeral: true });
                return;
            }

            const logData = fs.readFileSync(logFilePath, 'utf-8');
            let logLines = logData.trim().split('\n');
            logLines = logLines.reverse(); // Reverse the order of log lines

            const userOption = interaction.options.getUser('user');
            const olderThanOption = interaction.options.getInteger('olderthan');
            const youngerThanOption = interaction.options.getInteger('youngerthan');
            const containsOption = interaction.options.getString('contains');

            // Apply filtering
            let filteredLogs = logLines;

            // Filter logs by user
            if (userOption) {
                const userId = userOption.id;
                filteredLogs = filteredLogs.filter(line => line.includes(`User: ${userOption.tag}`) || line.includes(`(${userId})`));
            }

            // Parse the olderthan and youngerthan options
            const parseDays = (days) => moment().subtract(days, 'days').toISOString();

            // Filter logs based on older than option
            let targetOlderThanDate = null;
            if (olderThanOption !== null) {
                targetOlderThanDate = parseDays(olderThanOption);
            }

            // Filter logs based on younger than option
            let targetYoungerThanDate = null;
            if (youngerThanOption !== null) {
                targetYoungerThanDate = parseDays(youngerThanOption);
            }

            // Apply the date range filters
            filteredLogs = filteredLogs.filter(line => {
                const logDate = line.split('|')[0];
                
                let olderThanCheck = true;
                if (targetOlderThanDate) {
                    olderThanCheck = logDate < targetOlderThanDate;
                }

                let youngerThanCheck = true;
                if (targetYoungerThanDate) {
                    youngerThanCheck = logDate > targetYoungerThanDate;
                }
                
                return olderThanCheck && youngerThanCheck;
            });

            // Apply the contains filter
            if (containsOption) {
                filteredLogs = filteredLogs.filter(line => line.includes(containsOption));
            }

            if (filteredLogs.length === 0) {
                await interaction.reply({ content: 'No logs found for the specified filters.', ephemeral: true });
                return;
            }

            // Pagination setup
            const itemsPerPage = 10; // Number of logs per page
            let currentPage = 1;
            const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

            // Calculate the total number of logs
            const totalLogs = filteredLogs.length;

            // Function to create an embed for the current page
            const createEmbed = (logs, pageNumber, totalLogs) => {
                // Calculate the start and end index for the current page
                const startIndex = (pageNumber - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;

                // Extract the logs for the current page
                const currentLogs = logs.slice(startIndex, endIndex)
                    .map((log, index) => `${startIndex + index + 1}: ${log}`)
                    .join('\n');

                // Create an embed with the title including the number of logs and the current page
                return new EmbedBuilder()
                    .setTitle(`Command Logs (${totalLogs} Commands) - Page ${pageNumber} of ${totalPages}`)
                    .setDescription(currentLogs)
                    .setColor('#00FF00')
                    .setFooter({ text: `Requested by ${interaction.user.tag}` });
            };

            // Create the initial embed and navigation buttons
            let currentEmbed = createEmbed(filteredLogs, currentPage, totalLogs);

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
            const collector = reply.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async i => {
                if (i.customId === 'prev') {
                    currentPage--;
                } else if (i.customId === 'next') {
                    currentPage++;
                }

                // Update the current embed and navigation buttons
                currentEmbed = createEmbed(filteredLogs, currentPage, totalLogs);
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
        } catch (error) {
            console.error(`Error executing log command: ${error}`);
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ content: 'An error occurred while processing the log command.', ephemeral: true });
            }
        }
    },
};

module.exports = {
    data: logCommand.data,
    execute: logCommand.execute,
};
