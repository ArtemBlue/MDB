const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('beep')
		.setDescription('Boop!'),
	async execute(interaction) {
		// Boop!
		await interaction.reply('Boop!');
	},
};