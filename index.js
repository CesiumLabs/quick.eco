module.exports = {
    Manager: require("./src/EconomyManager"),
    GuildManager: require("./src/GuildManager"),
    ShopManager: require("./src/ShopManager"),
    LotteryManager: require("./src/LotteryManager"),
    version: require("./package.json").version,
    db: require("quick.db")
};
