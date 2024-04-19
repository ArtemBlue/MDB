const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const messageCommand = {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('Manage messages in the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('purge')
                .setDescription('Purge messages.')
                .addIntegerOption(option =>
                    option.setName('messages')
                        .setDescription('Number of messages to purge.')
                        .setRequired(false)
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Purge messages from a specific user.')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('contains')
                        .setDescription('Purge messages containing specific words.')
                        .setRequired(false)
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Purge messages from a specific channel.')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pin')
                .setDescription('Pin a message.')
                .addStringOption(option =>
                    option.setName('messageid')
                        .setDescription('The ID of the message to pin.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unpin')
                .setDescription('Unpin a message.')
                .addStringOption(option =>
                    option.setName('messageid')
                        .setDescription('The ID of the message to unpin.')
                        .setRequired(true)
                )
        ),
        async execute(interaction) {
            try {
                const subcommand = interaction.options.getSubcommand();
                
                if (subcommand === 'purge') {
                    const messagesCount = interaction.options.getInteger('messages') || 5;
                    const user = interaction.options.getUser('user');
                    const contains = interaction.options.getString('contains');
                    const channel = interaction.options.getChannel('channel') || interaction.channel;
    
                    // Fetch messages from the channel
                    let messages = await channel.messages.fetch({
                        limit: Math.min(messagesCount, 100), // Discord limits fetch to 100 messages at a time
                    });
    
                    // Filter messages based on user and contains options
                    if (user) {
                        messages = messages.filter(msg => msg.author.id === user.id);
                    }
                    if (contains) {
                        messages = messages.filter(msg => msg.content.includes(contains));
                    }
    
                    // Filter messages to delete only those under 14 days old
                    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
                    messages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
    
                    // Bulk delete the filtered messages
                    const deletedMessages = await channel.bulkDelete(messages, true);
    
                    // Respond to the user
                    await interaction.reply({ content: `Purged ${deletedMessages.size} messages.`, ephemeral: true });
    
                } else if (subcommand === 'pin') {
                    // Handle the pin subcommand
                    const messageId = interaction.options.getString('messageid');
    
                    // Fetch the message and pin it
                    const message = await interaction.channel.messages.fetch(messageId);
                    await message.pin();
                    
                    // Respond to the user
                    await interaction.reply({ content: `Pinned message with ID: ${messageId}`, ephemeral: true });
    
                } else if (subcommand === 'unpin') {
                    // Handle the unpin subcommand
                    const messageId = interaction.options.getString('messageid');
    
                    // Fetch the message and unpin it
                    const message = await interaction.channel.messages.fetch(messageId);
                    await message.unpin();
                    
                    // Respond to the user
                    await interaction.reply({ content: `Unpinned message with ID: ${messageId}`, ephemeral: true });
                }
            } catch (error) {
                console.error('Error executing message command:', error);
                await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
            }
        },
    };
    
    module.exports = {
        data: messageCommand.data,
        execute: messageCommand.execute,
    };
