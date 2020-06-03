let db = require("rex.db");
db.init("./economy");
let invalid = [0, -1, -0];
let invL = [-1, -0];

class EconomyManager {

    /**
     * @constructor
     * @example const eco = new Eco.Manager();
     */
    constructor(name) {
        if (name && (typeof name !== "string")) throw new Error("Eco: Name must me a string");
        if (name) db = new db.table(name.replace(/ +/g, ""));
        
        /**
          * Table name
          * @type {String}
          */
        this.name = name ? (typeof name === "string" ? name.replace(/ +/g, "") : null) : null;
       
        /**
          * internal data manager
          * @type {Object}
          */
        this.db = db;
    }

    /**
     * addMoney - Adds money
     * @param {String} userid User ID
     * @param {Number} amount Amount to add
     * @returns { before, after, user, amount }
     */
    addMoney(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let oldbal = this.fetch(`money_${userid}`);
        this.db.math(`money_${userid}`, "+", amount);
        let newbal = this.fetch(`money_${userid}`);
        return { before: oldbal, after: newbal, user: userid, amount: amount };
    }

    /**
     * fetchMoney - Returns user's money
     * @param {String} userid user id
     * @returns { amount, user, position }
     */
    fetchMoney(userid) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        let every = this.leaderboard({ limit: 0 });
        let one = every.filter(data => data.id === userid);
        one = one.length < 1 ? null : one;

        return one ? { amount: one[0].money, user: one[0].id, position: every.indexOf(one[0]) + 1 } : { amount: 0, user: userid, position: null };
    }

    /**
     * setMoney - Sets money
     * @param {String} userid user id
     * @param {Number} amount amount to set
     * @returns { before, after, user, amount }
     */
    setMoney(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invL.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let oldbal = this.fetch(`money_${userid}`);
        this.db.set(`money_${userid}`, amount);
        let newbal = this.fetch(`money_${userid}`);
        return { before: oldbal, after: newbal, user: userid, amount: amount };
    }

    /**
     * deleteUser - Deletes a user from the database
     * @param {String} userid user id
     * @returns { before, after, user }
     */
    deleteUser(userid) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        let oldbal = this.fetch(`money_${userid}`);
        this.db.delete(`money_${userid}`);
        let newbal = this.fetch(`money_${userid}`);
        return { before: oldbal, after: newbal, user: userid };
    }

    /**
     * removeMoney - Subtracts money of a user
     * @param {String} userid User id
     * @param {Number} amount amount
     * @returns { befpre, after, user, amount }
     */
    removeMoney(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let oldbal = this.fetch(`money_${userid}`);
        if (oldbal - amount < 0) return { error: "New amount is negative." };
        this.db.math(`money_${userid}`, "-", amount);
        let newbal = this.fetch(`money_${userid}`);
        return { before: oldbal, after: newbal, user: userid, amount: amount };
    }

    /**
     * daily - daily balance
     * @param {String} userid user id
     * @param {Number} amount amount 
     * @returns { onCooldown, newCooldown, claimedAt, timeout, before, after, user, amount, time }
     */
    daily(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let timeout = 86400000;
        let check = this.db.fetch(`dailycooldown_${userid}`);
        if (check !== null && timeout - (Date.now() - check) > 0) {
            let time = this.ms(timeout - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        let before = this.fetch(`money_${userid}`);
        let added = this.db.math(`money_${userid}`, "+", amount);
        let newcooldown = this.db.set(`dailycooldown_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: added, user: userid, amount: amount, time: this.convertTime(timeout, newcooldown) };
    }

    /**
     * weekly - weekly balance
     * @param {String} userid user id
     * @param {Number} amount amount
     * @returns { onCooldown, newCooldown, claimedAt, timeout, before, after, user, amount, time }
     */
    weekly(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let timeout = 604800000;
        let check = this.db.fetch(`weeklycooldown_${userid}`);
        if (check !== null && timeout - (Date.now() - check) > 0) {
            let time = this.ms(timeout - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        let before = this.fetch(`money_${userid}`);
        let added = this.db.math(`money_${userid}`, "+", amount);
        let newcooldown = this.db.set(`weeklycooldown_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: added, user: userid, amount: amount, time: this.convertTime(timeout, newcooldown) };
    }
    
    /**
     * Work - Work and earn
     * @param {String} userid User id
     * @param {Number} amount amount
     * @param {Object} options Options = { jobs: ["Doctor", "Singer"], cooldown: 2.7e+6 }
     * @returns { onCooldown, newCooldown, claimedAt, timeout, before, after, user, amount, workedAs, time }
     */
    work(userid, amount, options={}) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
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
        let check = this.db.fetch(`workcooldown_${userid}`);
        if (check !== null && cooldown - (Date.now() - check) > 0) {
            let time = this.ms(cooldown - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        let workedAs = jobs[Math.floor(Math.random() * jobs.length)];
        let before = this.fetch(`money_${userid}`);
        let added = this.db.math(`money_${userid}`, "+", amount);
        let newcooldown = this.db.set(`workcooldown_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: cooldown, before: before, after: added, user: userid, amount: amount, workedAs: workedAs, time: this.convertTime(cooldown, newcooldown) };
    }

    /**
     * beg - beg and earn
     * @param {String} userid user id
     * @param {Number} amount amount 
     * @param {Object} options options = { canLose: false, cooldown: 60000, customName: "beg" }
     * @returns return { onCooldown, newCooldown, claimedAt, timeout, before, after, user, amount, time, lost }
     */
    beg(userid, amount, options={}) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let lost = false;
        let luck1 = Math.floor(Math.random() * 5);
        let luck2 = Math.floor(Math.random() * 5);
        if (luck1 === luck2) lost = true;
        let timeout = options.cooldown ? (!isNaN(options.cooldown) ? parseInt(options.cooldown) : 60000) : 60000;
        let check = this.db.fetch(`${options.customName || "beg"}cooldown_${userid}`);
        if (check !== null && timeout - (Date.now() - check) > 0) {
            let time = this.ms(timeout - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        if (options.canLose && lost) {
            let before = this.fetch(`money_${userid}`);
            let newcooldown = this.db.set(`${options.customName || "beg"}cooldown_${userid}`, Date.now());
            return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: before, user: userid, amount: amount, time: this.convertTime(timeout, newcooldown), lost: true };
        }
        let before = this.fetch(`money_${userid}`);
        let added = this.db.math(`money_${userid}`, "+", amount);
        let newcooldown = this.db.set(`${options.customName || "beg"}cooldown_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: added, user: userid, amount: amount, time: this.convertTime(timeout, newcooldown), lost: false };
    }

    /**
     * transfer - Transfer money from one user to another
     * @param {String} user1 first user id
     * @param {String} user2 Second user id
     * @param {Number} amount Amount
     * @returns { user1: { id, money }, user2: { id, money }, amount }
     */
    transfer(user1, user2, amount) {
        if (!user1) throw new TypeError("User id was not provided.");
        if (typeof user1 !== "string") throw new SyntaxError("User id must be a string.");
        if (!user2) throw new TypeError("User id was not provided.");
        if (typeof user2 !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let check = this.fetch(`money_${user1}`);
        if (check < 1) return { error: "Money of first user is less than 1." };
        if (check < amount) return { error: "Money of first user is less than given amount." };
        if (check - amount < 0) return { error: "This user can't share that much amount of money." };
        let newM = this.db.math(`money_${user2}`, "+", amount);
        let newM2 = this.db.math(`money_${user1}`, "-", amount);
        return { user1: { id: user1, money: newM2 }, user2: { id: user2, money: newM }, amount: amount };
    }

    /**
     * leaderboard - leaderboard
     * @param {Object} options Options = { limit: 10, raw: false }
     * @returns leaderboard[]
     */
    leaderboard(options = {}) {
        let limit = options.limit || 10;
        if (isNaN(limit)) throw new SyntaxError("Limit must be a number.");
        let raw = options.raw || false;
        let lb = this.db.fetchAll().filter(data => data.ID.startsWith(`money`)).sort((a, b) => b.data - a.data);
        if (!(parseInt(limit) <= 0)) lb.length = parseInt(limit);
        if (raw === true) return lb;
        var final = [];
        var i = 0;
        for (i in lb) {

            let obj = {
                position: lb.indexOf(lb[i]) + 1,
                id: lb[i].ID.split('_')[1],
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

module.exports = EconomyManager;
