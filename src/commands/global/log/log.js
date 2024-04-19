// Import required modules
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const logCommand = {
    data: new SlashCommandBuilder()
        .setName('log')
        .setDescription('Display command logs with filtering and pagination options.')
        .addUserOption(option => option
            .setName('user')
            .setDescription('Filter logs by user.')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('earlierthan')
            .setDescription('Filter logs earlier than a specific time (e.g., 1d, 7d, 30d, 180d, 1y).')
            .addChoices(
                { name: '1 day', value: '1d' },
                { name: '7 days', value: '7d' },
                { name: '30 days', value: '30d' },
                { name: '180 days', value: '180d' },
                { name: '1 year', value: '1y' }
            )
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('olderthan')
            .setDescription('Filter logs older than a specific time (e.g., 1d, 7d, 30d, 180d, 1y).')
            .addChoices(
                { name: '1 day', value: '1d' },
                { name: '7 days', value: '7d' },
                { name: '30 days', value: '30d' },
                { name: '180 days', value: '180d' },
                { name: '1 year', value: '1y' }
            )
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
            const earlierThanOption = interaction.options.getString('earlierthan');
            const olderThanOption = interaction.options.getString('olderthan');
            
            // Apply filtering
            let filteredLogs = logLines;

            // Filter logs by user
            if (userOption) {
                const userId = userOption.id;
                filteredLogs = filteredLogs.filter(line => line.includes(`User: ${userOption.tag}`) || line.includes(`(${userId})`));
            }

            // Filter logs based on time ranges
            const parseTimeRange = (range) => {
                const quantity = parseInt(range);
                const unit = range.endsWith('d') ? 'days' : range.endsWith('y') ? 'years' : null;
                return { quantity, unit };
            };

            if (earlierThanOption) {
                const { quantity, unit } = parseTimeRange(earlierThanOption);
                const targetDate = moment().subtract(quantity, unit);
                filteredLogs = filteredLogs.filter(line => moment(line.split('|')[0]).isBefore(targetDate));
            }

            if (olderThanOption) {
                const { quantity, unit } = parseTimeRange(olderThanOption);
                const targetDate = moment().subtract(quantity, unit);
                filteredLogs = filteredLogs.filter(line => moment(line.split('|')[0]).isAfter(targetDate));
            }

            if (filteredLogs.length === 0) {
                await interaction.reply({ content: 'No logs found for the specified filters.', ephemeral: true });
                return;
            }

            // Pagination setup
            const itemsPerPage = 10; // Number of logs per page
            let currentPage = 1;
            const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

            // Function to create an embed for the current page
            const createEmbed = (logs, pageNumber) => {
                // Calculate the start and end index for the current page
                const startIndex = (pageNumber - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;

                // Extract the logs for the current page
                const currentLogs = logs.slice(startIndex, endIndex).join('\n');

                // Create an embed with the title including the number of logs and the current page
                return new EmbedBuilder()
                    .setTitle(`Command Logs - Page ${pageNumber} of ${totalPages}`)
                    .setDescription(currentLogs)
                    .setColor('#00FF00')
                    .setFooter({ text: `Requested by ${interaction.user.tag}` });
            };

            // Create the initial embed and navigation buttons
            let currentEmbed = createEmbed(filteredLogs, currentPage);

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
                currentEmbed = createEmbed(filteredLogs, currentPage);
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
