const EcoError = require("./Error");

class User {
    
    constructor(id, guild, database) {
        if (!id) throw new EcoError("No id provided");
        this.id = id;
        if (guild && typeof guild == "string") this.guild = guild;
        if (guild && typeof guild !== "string" && !database) this.db = guild;
        this.db = database;
    }

    /**
      * Balance of the user
      * @type Number
      * @returns {Balance}
      */
    get balance() {
        if (!this.db) throw new EcoError("Partial users may not have balance");
        if (this.guild) {
            let i = this.db.get(`money_${this.guild}_${this.id}`)
            return (i || 0);
        }
        return (this.db.get(`money_${this.id}`) || 0);
    }

    /**
      * create mention
      * @type String
      * @returns String
      */
    toString() {
        return `<@${this.id}>`;
    }

    /**
      * parses everything related to user
      * @returns data[]
      */
    parseAll() {
        if (!this.db) throw new EcoError("Partial users may not have balance.");
        let data = this.db.all().filter(i => i.ID.includes(this.id));
        return data ? (data.length ? data : []): [];
    }
}

module.exports = User;
