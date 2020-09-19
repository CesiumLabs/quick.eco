# quick.eco
Powerful economy framework for discord bots.

[![NPM](https://nodei.co/npm/quick.eco.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/quick.eco/)

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FINEX07%2Fquick.eco.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FINEX07%2Fquick.eco?ref=badge_shield)


# Installing

```sh
npm i --save quick.eco
```

**[Join Our Discord Server](https://discord.gg/uqB8kxh)**

# Features
- Global Economy
- Per-guild Economy
- Built-in cooldown
- Randomizer
- Configurable
- Custom storage/database
- & much more...

# Getting Started

```js
const { EconomyManager } = require("quick.eco");
const eco = new EconomyManager();
```

# Quick Example

```js
const Discord = require("discord.js");
const client = new Discord.Client();
const { EconomyManager } = require("quick.eco")
const eco = new EconomyManager();

client.on("ready", () => {
    console.log("I'm alive!");
});

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
        const embed = new Discord.RichEmbed()
        .setAuthor("Leaderboard")
        .setColor("BLURPLE");
        lb.forEach(u => {
            embed.addField(`${u.position}. ${client.users.get(u.user).tag}`, `Money: ${u.money} 💸`);
        });
        return message.channel.send(embed);
    }
});

client.login("XXXXXXXXXXXXXX");
```

> By default, `quick.eco` uses `JSON` file to store data. You can use custom database like this:

# Custom storage
## Using Custom File

```js
const eco = new Eco.EconomyManager({ storage: "./customFile.json" });
```

## Using Custom Manager
> **Note:** Your custom manager must extend `Eco.Manager`.

```js
const Eco = require("quick.eco");
const { Database } = require("quickmongo");
const db = new Database("mongodb://localhost/quickeco");

class CustomManager extends Eco.Manager {

    initDatabase(force = false) {
        return new Promise((resolve) => {
            // to wipe out data
            if (force) {
                db.deleteAll();
                resolve(true);
            } else {
                // don't forget to return something
                resolve(true);
            }
        });
    }

    write(rdata) {
        return new Promise(async (resolve, reject) => {
            if (!rdata || typeof rdata !== "object") return reject(new Error("Invalid data"));
            let { ID, data } = rdata;
            if (!ID || typeof ID !== "string") return reject("Invalid data id!");
            if (typeof data === "undefined") data = null;

            let prev = await this.read();

            // remove existing
            prev = prev.filter(rs => rs.ID !== ID);

            // set data
            prev.push({
                ID: ID,
                data: data
            });
            prev.forEach(x => db.set(x.ID, x.data));
            resolve(prev);
        });
    }

    read(id) {
        return new Promise(async (resolve) => {
            let json = await db.all();
            if (!!id && typeof id === "string") return resolve(json.filter(x => x.ID === id) || null);
            return resolve(json);
        });
    }

}

// make sure to do everything after db#ready event.
db.once("ready", () => {
    const eco = new Eco.EconomyManager({
        useDefaultManager: false
    }, CustomManager);

    eco.daily("123456789").then(console.log);
});
```

# Join our discord
- **[discord.gg/uqB8kxh](https://discord.gg/uqB8kxh)**.

## © Snowflake Studio ❄️ - 2020
