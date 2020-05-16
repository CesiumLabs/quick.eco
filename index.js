module.exports = {
    Manager: require("./src/EconomyManager"),
    ShopManager: require("./src/ShopManager"),
    version: require("./package.json").version,
    db: require("quick.db")
}