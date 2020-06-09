/* 
Not actually Journal Entries but 
this code will keep record of each 
transactions as per the current month
*/
const User = require("./User");
const EcoError = require("./Error");
const db = require("rex.db");
db.init("./economy");

class Journal {
    
    constructor() {
        this.db = db.table(`transactions`);
        this.months = [
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
       this.date = new Date();
    }

    static prepare(user, amount, ...details) {
        if (!user || !amount) throw new EcoError("User or amount details missing in statement");
        if (!this._resolveUser(user)) throw new EcoError("Invalid user details.");
        if (typeof amount !== "number") throw new EcoError("Type of amount must be a number");
        return this.db.set(`stmt_${this.date.getFullYear()}_${this.months[this.date.getMonth()]}`, {
            id: this.db.all().filter(ent => ent.startsWith("stmt")).length + 1,
            author: user,
            amount: amount,
            entryAt: new Date(),
            data: ...details || {}
        });
    }

    static fetch(user) {

    }

    static clear() {
        return this.db.deleteAll();
    }

    static _resolveUser(user) {
        if (typeof user === "string") user = new User(user);
        if (!(user instanceof User)) return false;
        return true;
    }
    
}

module.exports = Journal;
