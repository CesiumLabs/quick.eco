let db = require("rex.db");
db.init("./economy");
let invalid = [0, -1, -0];
let invL = [-1, -0];

const User = require("./User");

class GuildEconomyManager {

    /**
     * @constructor
     * @example const eco = new Eco.GuildManager();
     */
    constructor(name="guildeconomy") {
        if (name && (typeof name !== "string")) throw new Error("Eco: Name must me a string");
        if (name) db = new db.table(name.replace(/ +/g, ""));
        /**
          * Internal Database Manager
          * @type {Object}
          */
        this.db = db;
        /**
          * Table Name
          * @type {String}
          */ 
        this.name = name.replace(/ +/g,"");
    }

    /**
     * addMoney - Adds money
     * @param {String} userid User ID
     * @param {String} guildid Guild ID
     * @param {Number} amount Amount to add
     * @returns { before, after, user, amount }
     */
    addMoney(userid, guildid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let oldbal = this.fetch(`money_${guildid}_${userid}`);
        this.db.math(`money_${guildid}_${userid}`, "+", amount);
        let newbal = this.fetch(`money_${guildid}_${userid}`);
        return { 
            before: oldbal,
            after: newbal,
            user: new User(userid, guildid, this.db),
            amount: amount
        };
    }

    /**
     * fetchMoney - Returns user's money
     * @param {String} userid user id
     * @param {String} guildid Guild ID
     * @returns { amount, user, position }
     */
    fetchMoney(userid, guildid) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        let every = this.leaderboard(guildid, { limit:19774488 });
        let one = every.filter(data => data.id === userid);
        one = one.length < 1 ? null : one;

        return one
            ? { amount: one[0].money, user: new User(one[0].id, guildid, this.db), position: every.indexOf(one[0]) + 1 }
            : { amount: 0, user: new User(userid, guildid, this.db), position: every.length + 1 };
    }

    /**
     * setMoney - Sets money
     * @param {String} userid user id
     * @param {String} guildid Guild ID
     * @param {Number} amount amount to set
     * @returns { before, after, user, amount }
     */
    setMoney(userid, guildid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invL.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let oldbal = this.fetch(`money_${guildid}_${userid}`);
        this.db.set(`money_${guildid}_${userid}`, amount);
        let newbal = this.fetch(`money_${guildid}_${userid}`);
        return { before: oldbal, after: newbal, user: new User(userid, guildid, this.db), amount: amount };
    }

    /**
     * deleteUser - Deletes a user from the database
     * @param {String} userid user id
     * @param {String} guildid Guild ID
     * @returns { before, after, user }
     */
    deleteUser(userid, guildid) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        let oldbal = this.fetch(`money_${guildid}_${userid}`);
        this.db.delete(`money_${guildid}_${userid}`);
        let newbal = this.fetch(`money_${guildid}_${userid}`);
        return { before: oldbal, after: newbal, user: new User(userid, guildid, this.db) };
    }

    /**
     * removeMoney - Subtracts money of a user
     * @param {String} userid User id
     * @param {String} guildid Guild ID
     * @param {Number} amount amount
     * @returns { before, after, user, amount }
     */
    removeMoney(userid, guildid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let oldbal = this.fetch(`money_${guildid}_${userid}`);
        if (oldbal - amount < 0) return { error: "New amount is negative." };
        this.db.math(`money_${guildid}_${userid}`, "-", amount);
        let newbal = this.fetch(`money_${guildid}_${userid}`);
        return { before: oldbal, after: newbal, user: new User(userid, guildid, this.db), amount: amount };
    }

    /**
     * daily - daily balance
     * @param {String} userid user id
     * @param {String} guildid Guild ID
     * @param {Number} amount amount 
     * @returns { onCooldown, newCooldown, claimedAt, timeout, before, after, user, amount, time }
     */
    daily(userid, guildid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let timeout = 86400000;
        let check = this.db.fetch(`dailycooldown_${guildid}_${userid}`);
        if (check !== null && timeout - (Date.now() - check) > 0) {
            let time = this.ms(timeout - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        let before = this.fetch(`money_${guildid}_${userid}`);
        let added = this.db.math(`money_${guildid}_${userid}`, "+", amount);
        let newcooldown = this.db.set(`dailycooldown_${guildid}_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: added, user: new User(userid, guildid, this.db), amount: amount, time: this.convertTime(timeout, newcooldown) };
    }

    /**
     * weekly - weekly balance
     * @param {String} userid user id
     * @param {String} guildid Guild ID
     * @param {Number} amount amount
     * @returns { onCooldown, newCooldown, claimedAt, timeout, before, after, user, amount, time }
     */
    weekly(userid, guildid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let timeout = 604800000;
        let check = this.db.fetch(`weeklycooldown_${guildid}_${userid}`);
        if (check !== null && timeout - (Date.now() - check) > 0) {
            let time = this.ms(timeout - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        let before = this.fetch(`money_${guildid}_${userid}`);
        let added = this.db.math(`money_${guildid}_${userid}`, "+", amount);
        let newcooldown = this.db.set(`weeklycooldown_${guildid}_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: added, user: new User(userid, guildid, this.db), amount: amount, time: this.convertTime(timeout, newcooldown) };
    }
    
    /**
     * Work - Work and earn
     * @param {String} userid User id
     * @param {String} guildid Guild ID
     * @param {Number} amount amount
     * @param {Object} options Options = { jobs: ["Doctor", "Singer"], cooldown: 2.7e+6 } 
     * @returns { onCooldown, newCooldown, claimedAt, timeout, before, after, user, amount, workedAs, time }
     */
    work(userid, guildid, amount, options={}) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let cooldown = options.cooldown || 2.7e+6;
        if (options.jobs && !Array.isArray(options.jobs)) throw new SyntaxError("Jobs must be an array!");
        let jobs = options.jobs || [
            "Doctor",
            "Pornstar",
            "Dishwasher",
            "Memer",
            "Shit eater",
            "YouTuber",
            "Developer",
            "Musician",
            "Professional sleeper",
            "Teacher",
            "Scientist",
            "Baby maker",
            "Twitch Streamer",
            "Twitch Pornstar",
            "StickAnimator",
            "Strict Math Teacher",
            "Tik Toker",
            "Miner", 
            "Bartender", 
            "Cashier", 
            "Cleaner", 
            "Drugdealer",
            "Assistant", 
            "Nurse",
            "Accountants", 
            "Security Guard", 
            "Sheriff", 
            "Lawyer",
            "Electrician", 
            "Singer", 
            "Dancer"
        ];
        let check = this.db.fetch(`workcooldown_${guildid}_${userid}`);
        if (check !== null && cooldown - (Date.now() - check) > 0) {
            let time = this.ms(cooldown - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        let workedAs = jobs[Math.floor(Math.random() * jobs.length)];
        let before = this.fetch(`money_${guildid}_${userid}`);
        let added = this.db.math(`money_${guildid}_${userid}`, "+", amount);
        let newcooldown = this.db.set(`workcooldown_${guildid}_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: cooldown, before: before, after: added, user: new User(userid, guildid, this.db), amount: amount, workedAs: workedAs, time: this.convertTime(cooldown, newcooldown) };
    }

    /**
     * beg - beg and earn
     * @param {String} userid user id
     * @param {String} guildid Guild ID
     * @param {Number} amount amount 
     * @param {Object} options options = { canLose: false, cooldown: 60000, customName: "beg" }
     * @returns { onCooldown, newCooldown, claimedAt, timeout, before, after, user, amount, workedAs, time, lost }
     */
    beg(userid, guildid, amount, options={}) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let lost = false;
        let luck1 = Math.floor(Math.random() * 5);
        let luck2 = Math.floor(Math.random() * 5);
        if (luck1 === luck2) lost = true;
        let timeout = options.cooldown ? (!isNaN(options.cooldown) ? parseInt(options.cooldown) : 60000) : 60000;
        let check = this.db.fetch(`${options.customName || "beg"}cooldown_${guildid}_${userid}`);
        if (check !== null && timeout - (Date.now() - check) > 0) {
            let time = this.ms(timeout - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        if (options.canLose && lost) {
            let before = this.fetch(`money_${guildid}_${userid}`);
            let newcooldown = this.db.set(`${options.customName || "beg"}cooldown_${guildid}_${userid}`, Date.now());
            return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: before, user: userid, amount: amount, time: this.convertTime(timeout, newcooldown), lost: true };
        }
        let before = this.fetch(`money_${guildid}_${userid}`);
        let added = this.db.math(`money_${guildid}_${userid}`, "+", amount);
        let newcooldown = this.db.set(`${options.customName || "beg"}cooldown_${guildid}_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: added, user: new User(userid, guildid, this.db), amount: amount, time: this.convertTime(timeout, newcooldown), lost: false };
    }

    /**
     * transfer - Transfer money from one user to another
     * @param {String} user1 first user id
     * @param {String} user2 Second user id
     * @param {String} guildid Guild ID
     * @param {Number} amount Amount
     * @returns { user1, user2, amount }
     */
    transfer(user1, user2, guildid, amount) {
        if (!user1) throw new TypeError("User id was not provided.");
        if (typeof user1 !== "string") throw new SyntaxError("User id must be a string.");
        if (!user2) throw new TypeError("User id was not provided.");
        if (typeof user2 !== "string") throw new SyntaxError("User id must be a string.");
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let check = this.fetch(`money_${guildid}_${user1}`);
        if (check < 1) return { error: "Money of first user is less than 1." };
        if (check < amount) return { error: "Money of first user is less than given amount." };
        if (check - amount < 0) return { error: "This user can't share that much amount of money." };
        let newM = this.db.math(`money_${guildid}_${user2}`, "+", amount);
        let newM2 = this.db.math(`money_${guildid}_${user1}`, "-", amount);
        return { user1: new User(user1, this.db), user2: new User(user2, this.db), amount: amount };
    }

    /**
     * leaderboard - leaderboard
     * @param {String} guildid Guild ID
     * @param {Object} options Options = { limit: 10, raw: false }
     * @returns Leaderboard[]
     */
    leaderboard(guildid, options = {}) {
        if (!guildid) throw new TypeError("Guild id was not provided.");
        if (typeof guildid !== "string") throw new SyntaxError("Guild id must be a string.");
        let limit = options.limit || 10;
        if (isNaN(limit)) throw new SyntaxError("Limit must be a number.");
        if (limit <= 0) throw new SyntaxError("Limit must be a number greater than 0.");
        let raw = options.raw || false;
        let lb = this.db.fetchAll().filter(data => data.ID.startsWith(`money_${guildid}`)).sort((a, b) => b.data - a.data);
        lb.length = parseInt(limit);
        if (raw === true) return lb;
        var final = [];
        var i = 0;
        for (i in lb) {

            let obj = {
                position: lb.indexOf(lb[i]) + 1,
                id: lb[i].ID.split('_')[2],
                money: lb[i].data
            };
            final.push(obj);
        };
        return final;
    }

    /**
      * database entries
      * @type {entries[]}
      */
    get entries() {
        return this.db.all();
    }

    /**
      * @ignore
      * @private
      */
    fetch(param) {
        return this.db.fetch(param) ? this.db.fetch(param) : 0;
    }

    /**
      * @ignore
      * @private
      */
    convertTime(cooldown, check) {
        let time = this.ms(cooldown - (Date.now() - check));
        return time;
    }

    /**
      * @ignore
      * @private
      */
    ms(milliseconds) {
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
}

module.exports = GuildEconomyManager;
