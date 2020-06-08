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
function Database(name="./json") {
    const db = require("rex.db");
    db.init(name);

    db.add = (key, val, ...ops) => {
        return db.math(key, "+", val, ...ops);
    }

    db.subtract = (key, val, ...ops) => {
        return db.math(key, "-", val, ...ops);
    }

    db.startsWith = (key, ops={}) => {
        let sortBy = require("lodash/sortBy");
        let arb = db.all().filter(i => i.ID.startsWith(key));
        if (ops.sort && typeof ops.sort === 'string') {
            if (ops.sort.startsWith('.')) ops.sort = ops.sort.slice(1);
            ops.sort = ops.sort.split('.');
            arb = sortBy(arb, ops.sort).reverse();
        }
        return arb;
    }
    return db;
}

module.exports = {
    Bank: require("./src/BankManager"),
    GuildManager: require("./src/GuildManager"),
    LotteryManager: require("./src/LotteryManager"),
    Manager: require("./src/EconomyManager"),
    ShopManager: require("./src/ShopManager"),
    User: require("./src/User"),
    version: require("./package.json").version,
    db: Database,
    ms: msParse
};
