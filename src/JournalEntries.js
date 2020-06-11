/* 
Not actual Journal Entries but 
this code will keep record of each 
transactions as per the current month
*/
const User = require("./User");
const EcoError = require("./Error");
const DB = require("rex.db");
DB.init("./economy");
const db = new DB.table(`transactions`);
const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

class Journal {
    
    constructor() {
        throw new Error(`Class ${this.constructor.name} may not be instantiated!`);
    }

    static prepare(user, amount, ...details) {
        if (!user || !amount) throw new EcoError("User or amount details missing in statement");
        if (!this._resolveUser(user)) throw new EcoError("Invalid user details.");
        if (typeof amount !== "number") throw new EcoError("Type of amount must be a number");
        const entries = db.all().filter(ent => ent.startsWith("stmt")).length + 1;
        return db.set(`stmt_${new Date().getFullYear()}_${months[new Date().getMonth()]}_${ID}`, {
            id: entries,
            author: new User(user),
            amount: amount,
            month: this.months[new Date().getMonth()],
            entryAt: new Date(),
            data: ...details || {}
        });
    }

    static all() {
       return db.all().filter(i => i.ID.startsWith("stmt_"));
    }

    static filter(...args) {
        return db.all().filter(...args);
    }

    static fetchEntries(user) {
        if (!this._resolveUser(user)) throw new Error("Invalid User");
        let statements = db.all().filter(i => i.ID.startsWith("stmt_") && i.data.author.id === user).reverse();
        return statements;
    }

    static clear() {
        return db.deleteAll();
    }

    static _resolveUser(user) {
        if (typeof user === "string") user = new User(user);
        if (!(user instanceof User)) return false;
        return true;
    }
    
}

module.exports = Journal;
