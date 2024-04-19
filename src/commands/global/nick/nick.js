const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nick')
        .setDescription('Sets a user\'s nickname')
        .addUserOption(option =>
            option
                .setName('user')
                .setRequired(true)
                .setDescription('The target user to set the nickname for')
        )
        .addStringOption(option =>
            option
                .setName('nick')
                .setRequired(true)
                .setDescription('The new nickname for the user')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    
    async execute(interaction) {
        // Retrieve the target user and the new nickname from the interaction options
        const user = interaction.options.getMember('user');
        const newNickname = interaction.options.getString('nick');
        
        // Retrieve the user's current nickname (or username if they have no nickname)
        const previousNickname = user.nickname || user.user.username;

        try {
            // Set the new nickname for the user
            await user.setNickname(newNickname);
            
            // Create a reply message with the user's previous and new nickname, mentioning the user by their ID
            await interaction.reply(`<@${user.user.id}> was nicknamed from "${previousNickname}" to "${newNickname}".`);
        } catch (error) {
            // Handle errors such as permission issues
            console.error('Error setting nickname:', error);
            
            // Reply with an error message to the user
            await interaction.reply('Failed to change the nickname. Please check my permissions and try again.');
        }
    },
};
