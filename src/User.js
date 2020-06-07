class User {
    
    constructor(id, guild, database) {
        this.id = id;
        if (guild && typeof guild == "string") this.guild = guild;
        if (guild && typeof guild == "object" && !database) this.db = guild;
        else this.database = database;
    }

    static get balance() {
        if (this.guild) {
            let i = this.db.get(`money_${this.guild}_${this.id}`)
            return (i || 0);
        }
        return (this.db.get(`money_${this.id}`) || 0);
    }

    static toString() {
        return `<@${this.id}>`;
    }

    static parseAll() {
        let data = this.db.all().filter(i => i.ID.includes(this.id));
        return data ? (data.length ? data : []): [];
    }
}

module.exports = User;
