# Quick.eco
Powerful economy framework for discord bots.

[![NPM](https://nodei.co/npm/quick.eco.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/quick.eco/)

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FINEX07%2Fquick.eco.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FINEX07%2Fquick.eco?ref=badge_shield)


### Installing

```sh
$ npm i quick.eco -s

// Add one of the following adapters [required]

$ npm i @quick.eco/sqlite

$ npm i @quick.eco/mongo

$ npm i @quick.eco/mysql 
```

# Adapter Usage

- **[SQLite](https://npmjs.com/package/@quick.eco/sqlite)**
- **[MongoDB](https://npmjs.com/package/@quick.eco/mongo)**
- **[MySQL](https://npmjs.com/package/@quick.eco/mysql)**

**[Join Our Discord Server](https://discord.gg/uqB8kxh)**

# Features
- Global Economy
- Per-guild Economy
- Built-in cooldown
- Flexible
- Randomizer
- Configurable
- Storage Adapters 
- & much more...

# Getting Started

```js
const { EconomyManager } = require("quick.eco");
const eco = new EconomyManager({
    adapter: '', // => sqlite, mongo or mysql
    adapterOptions: '' // => Options
});
```

# Example

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
        let add = eco.daily(message.author.id, false, 500);
        if (add.cooldown) return message.reply(`You already claimed your daily coins. Come back after ${add.time.days} days, ${add.time.hours} hours, ${add.time.minutes} minutes & ${add.time.seconds} seconds.`);
        return message.reply(`you claimed ${add.amount} as your daily coins and now you have total ${add.money} coins.`);
    }

    if (message.content === "bal") {
        let money = eco.fetchMoney(message.author.id);
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

# Links
- **[Discord](https://discord.gg/uqB8kxh)**
- **[Documentation](https://eco.js.org)**

## © Snowflake Studio ❄️ - 2020