class User {
    
    constructor(id, guild, database) {
        this.id = id;
        this.guild = guild;
        this.db = database;
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
