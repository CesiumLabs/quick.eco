class User {
    
    constructor(id, guild, database) {
        this.id = id;
        this.db = database;
        if (guild && typeof guild == "string") this.guild = guild;
        else this.db = guild;
    }

    get balance() {
        if (this.guild) {
            let i = this.db.get(`money_${this.guild}_${this.id}`)
            return (i || 0);
        }
        return (this.db.get(`money_${this.id}`) || 0);
    }
}

module.exports = User;
