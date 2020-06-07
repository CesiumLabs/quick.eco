/**
  * ms
  * Milliseconds parser
  * @param {Number} milliseconds Milliseconds to parse
  * @returns {Object} Time Time object
  */
function msParse(milliseconds) {
    const roundTowardsZero = milliseconds > 0 ? Math.floor : Math.ceil;
    return {
        days: roundTowardsZero(milliseconds / 86400000),
        hours: roundTowardsZero(milliseconds / 3600000) % 24,
        minutes: roundTowardsZero(milliseconds / 60000) % 60,
        seconds: roundTowardsZero(milliseconds / 1000) % 60,
        milliseconds: roundTowardsZero(milliseconds) % 1000,
        microseconds: roundTowardsZero(milliseconds * 1000) % 1000,
        nanoseconds: roundTowardsZero(milliseconds * 1e6) % 1000
    }
}

/**
  * Database
  * @returns {quick.db}
  */
function Database() {
    const db = require("rex.db");
    db.init("./json.sqlite");
    db.add = (key, val, ...ops) => {
        return db.math(key, "+", val, ...ops);
    }
    db.subtract = (key, val, ...ops) => {
        return db.math(key, "-", val, ...ops);
    }
    return db;
}

module.exports = {
    Manager: require("./src/EconomyManager"),
    GuildManager: require("./src/GuildManager"),
    ShopManager: require("./src/ShopManager"),
    LotteryManager: require("./src/LotteryManager"),
    version: require("./package.json").version,
    db: Database,
    ms: msParse
};
