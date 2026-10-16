require("dotenv").config();
const { Client, GatewayIntentBits, AttachmentBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { createFactCard } = require("./factCard");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const { GenerateFact } = require("./generateFact");
const fs = require('node:fs/promises');
const path = require('node:path');

const adapter = new JSONFile('db.json');
const db = new Low(adapter, { channels: {} });


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.once("clientReady", async () => {
    await db.read();
    db.data ||= { channels: {} };
    await fs.mkdir(path.join(__dirname, "images"), {
        recursive: true
    });
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "countfacts") return;
    if (interaction.options.getSubcommand() !== "setup") return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: "Only Power Hungry Mods (PHMs) can set up CountFacts",
            flags: MessageFlags.Ephemeral
        });
    }

    const channel = interaction.options.getChannel("channel");

    // Acknowledge the interaction before doing slow work.
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    try {
        await db.read();
        db.data ||= { channels: {} };

        const existingChannel = Object.entries(db.data.channels)
            .find(([, state]) => state.guildId === interaction.guildId);

        if (existingChannel) {
            const [existingChannelId] = existingChannel;

            return interaction.editReply({
                content: `CountFacts is already configured for <#${existingChannelId}> in this server.`
            });
        }

        const channelState = {
            guildId: interaction.guildId,
            count: 0,
            lastUserId: null,
            processing: false,
            nextNum: null,
        };

        db.data.channels[channel.id] = channelState;

        await GenerateNextFact(
            interaction.guild.name,
            interaction.guildId,
            channelState
        );

        await interaction.editReply({
            content: `CountFacts is now ready for <#${channel.id}>. Start with 1.`
        });

    } catch (error) {
        console.error("CountFacts setup failed:", error);

        delete db.data.channels[channel.id];
        await db.write();

        await interaction.editReply({
            content: "Something went wrong! Check the bot console for the error."
        }).catch(console.error);
    }
});



client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const channelId = message.channel.id;
    const channelState = db.data.channels[channelId];

    if (!channelState) return;

    //delete message if it belongs to the last user that messaged
    if ((message.author.id === channelState.lastUserId) || !/^\d+$/.test(message.content) || (Number(message.content) !== channelState.count + 1) || channelState.processing) {
        await message.delete();
        return;
    };

    channelState.count = Number(message.content);
    channelState.lastUserId = message.author.id;

    await db.write();
    
    try {
        
        if (channelState.nextNum === channelState.count) {
            channelState.processing = true;

            const image = path.join(__dirname, 'images', `fact_${message.guildId}.png`)
            const attachment = new AttachmentBuilder(image, { name: `cool_fact_${channelState.count}.png` });
            await message.channel.send({
                content: `**${message.member?.displayName || message.author?.globalName || message.author.username} Unlocked a Fact! 🎉**`,
                files: [attachment], 
            });

            channelState.processing = false;

            await GenerateNextFact(message.guild.name, message.guildId, channelState);
        };

        //this only happens if generate next fact fails so in that case try calling new facts for next time
        const off_set = 15;
        if (channelState.count > channelState.nextNum + off_set) {
            await GenerateNextFact(message.guild.name, message.guildId, channelState);
        };

    } catch (error) {
        console.log(error);
    } finally {
        channelState.processing = false;
    }
});



client.on("channelDelete", async (channel) => {
    const channelId = channel.id;

    if (db.data.channels[channelId]) {
        delete db.data.channels[channelId];
        await db.write();
    };
});

client.login(process.env.DISCORD_TOKEN);



const GenerateNextFact = async (serverName, serverId, channelState) => {
    const off_set = 15;
    let new_num = channelState.count + off_set;

    //randomly select nextNum
    while (Math.random() >= 1/10){
        new_num++
    };

    //generate fact for nextNum
    const fact = await GenerateFact(new_num);
    if (!fact.found) throw new Error("Gemini did not respond");

    //generate image
    const image = await createFactCard(new_num, fact.text, serverName);

    //store image in images folder
    const outputPath = path.join(__dirname, 'images', `fact_${serverId}.png`);
    await fs.writeFile(outputPath, image);

    //store nextNum in db
    channelState.nextNum = new_num;

    await db.write();
}; 


