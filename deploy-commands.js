require("dotenv").config();
const { REST, Routes, SlashCommandBuilder, ChannelType } = require("discord.js");

const command = new SlashCommandBuilder()
    .setName("countfacts")
    .setDescription("Configure CountFacts")
    .addSubcommand(subcommand =>
        subcommand
            .setName("setup")
            .setDescription("Choose the counting channel")
            .addChannelOption(option =>
                option
                    .setName("channel")
                    .setDescription("The channel where counting will happen")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
    )
    .setDefaultMemberPermissions("0");

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("Registering CountFacts commands...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [command.toJSON()] }
        );

        console.log("Commands registered successfully.");
    } catch (error) {
        console.error(error);
    }
})();