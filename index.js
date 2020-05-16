module.exports = {
    Manager: require("./src/EconomyManager"),
    GuildManager: require("./src/GuildManager"),
    ShopManager: require("./src/ShopManager"),
    version: require("./package.json").version,
    db: require("quick.db")
}