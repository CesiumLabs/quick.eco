```js
const Discord = require("discord.js");
const client = new Discord.Client();
const { EconomyManager } = require("quick.eco")
const eco = new EconomyManager({
    adapter: 'sqlite'
});

client.on("ready", () => console.log('ready!'));

client.on("message", async (message) => {
    if (!message.guild || message.author.bot) return;

    if (message.content === "daily") {
        let add = await eco.daily(message.author.id, false, 500);
        if (add.cooldown) return message.reply(`You already claimed your daily coins. Come back after ${add.time.days} days, ${add.time.hours} hours, ${add.time.minutes} minutes & ${add.time.seconds} seconds.`);
        return message.reply(`you claimed ${add.amount} as your daily coins and now you have total ${add.money} coins.`);
    }

    if (message.content === "bal") {
        let money = await eco.fetchMoney(message.author.id);
        return message.channel.send(`${message.author} has ${money} coins.`);
    }

    if (message.content === "leaderboard") {
        let lb = await eco.leaderboard(false, 10);
        const embed = new Discord.MessageEmbed()
        .setAuthor("Leaderboard")
        .setColor("BLURPLE");
        lb.forEach(u => {
            embed.addField(`${u.position}. ${client.users.cache.get(u.user).tag}`, `Money: ${u.money} 💸`);
        });
        return message.channel.send(embed);
    }
});

client.login("XXXXXXXXXXXXXX");
```