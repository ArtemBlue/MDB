const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Replies with your input!')
		.addStringOption(option =>
			option
				.setName('input')
				.setRequired(true)
				.setDescription('The input to echo back')),
	async execute(interaction) {
		// Reply
		const input = interaction.options.getString('input');

		await interaction.reply(`${input}`);
	},
};