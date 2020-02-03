const db = require("quick.db");
let invalid = [0, -1, -0];

class EconomyManager {

    /**
     * @constructor
     * @example ```const eco = new Eco.Manager();```
     */
    constructor() {
        console.log(`
        ┏╋━━━━━━◥◣◆◢◤━━━━━━━╋┓
          [quick.eco] - Loaded!
        ┗╋━━━━━━◢◤◆◥◣━━━━━━━╋┛
        `);
    }

    /**
     * addMoney - Adds money
     * @param {String} userid User ID
     * @param {Number} amount Amount to add
     * @returns Object
     */
    async addMoney(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let oldbal = fetch(`money_${userid}`);
        db.add(`money_${userid}`, amount);
        let newbal = fetch(`money_${userid}`);
        return { before: oldbal, after: newbal, user: userid, amount: amount };
    }

    /**
     * fetchMoney - Returns user's money
     * @param {String} userid user id
     * @returns Object
     */
    async fetchMoney(userid) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        return { amount: fetch(`money_${userid}`), user: userid };
    }

    /**
     * setMoney - Sets money
     * @param {String} userid user id
     * @param {Number} amount amount to set
     * @returns Object
     */
    async setMoney(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let oldbal = fetch(`money_${userid}`);
        db.set(`money_${userid}`, amount);
        let newbal = fetch(`money_${userid}`);
        return { before: oldbal, after: newbal, user: userid, amount: amount };
    }

    /**
     * deleteUser - Deletes a user from the database
     * @param {String} userid user id
     * @returns Object
     */
    async deleteUser(userid) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        let oldbal = fetch(`money_${userid}`);
        db.delete(`money_${userid}`);
        let newbal = fetch(`money_${userid}`);
        return { before: oldbal, after: newbal, user: userid };
    }

    /**
     * removeMoney - Subtracts money of a user
     * @param {String} userid User id
     * @param {Number} amount amount
     * @returns Object
     */
    async removeMoney(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let oldbal = fetch(`money_${userid}`);
        if (oldbal - amount < 0) return { error: "New amount is negative." };
        db.subtract(`money_${userid}`, amount);
        let newbal = fetch(`money_${userid}`);
        return { before: oldbal, after: newbal, user: userid, amount: amount };
    }

    /**
     * daily - daily balance
     * @param {String} userid user id
     * @param {Number} amount amount 
     * @returns Object
     */
    async daily(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let timeout = 86400000;
        let check = db.fetch(`dailycooldown_${userid}`);
        if (check !== null && timeout - (Date.now() - check) > 0) {
            let time = ms(timeout - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        let before = fetch(`money_${userid}`);
        let added = db.add(`money_${userid}`, amount);
        let newcooldown = db.set(`dailycooldown_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: added, user: userid, amount: amount, time: convertTime(timeout, newcooldown) };
    }

    /**
     * weekly - weekly balance
     * @param {String} userid user id
     * @param {Number} amount amount
     * @returns Object
     */
    async weekly(userid, amount) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let timeout = 604800000;
        let check = db.fetch(`weeklycooldown_${userid}`);
        if (check !== null && timeout - (Date.now() - check) > 0) {
            let time = ms(timeout - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        let before = fetch(`money_${userid}`);
        let added = db.add(`money_${userid}`, amount);
        let newcooldown = db.set(`weeklycooldown_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: added, user: userid, amount: amount, time: convertTime(timeout, newcooldown) };
    }
    
    /**
     * Work - Work and earn
     * @param {String} userid User id
     * @param {Number} amount amount
     * @param {Object} options Options = { jobs: ["Doctor", "Singer"], cooldown: 2.7e+6 } 
     * @returns Object
     */
    async work(userid, amount, options={}) {
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
        let check = db.fetch(`workcooldown_${userid}`);
        if (check !== null && cooldown - (Date.now() - check) > 0) {
            let time = ms(cooldown - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        let workedAs = jobs[Math.floor(Math.random() * jobs.length)];
        let before = fetch(`money_${userid}`);
        let added = db.add(`money_${userid}`, amount);
        let newcooldown = db.set(`workcooldown_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: cooldown, before: before, after: added, user: userid, amount: amount, workedAs: workedAs, time: convertTime(cooldown, newcooldown) };
    }

    /**
     * beg - beg and earn
     * @param {String} userid user id
     * @param {Number} amount amount 
     * @param {Object} options options = { canLose: false }
     * @returns Object
     */
    async beg(userid, amount, options={}) {
        if (!userid) throw new TypeError("User id was not provided.");
        if (typeof userid !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let lost = false;
        let luck1 = Math.floor(Math.random() * 5);
        let luck2 = Math.floor(Math.random() * 5);
        if (luck1 === luck2) lost = true;
        let timeout = 60000;
        let check = db.fetch(`begcooldown_${userid}`);
        if (check !== null && timeout - (Date.now() - check) > 0) {
            let time = ms(timeout - (Date.now() - check));
            return { onCooldown: true, time: time, user: userid };
        }
        if (options.canLose && lost) {
            let before = fetch(`money_${userid}`);
            let newcooldown = db.set(`begcooldown_${userid}`, Date.now());
            return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: before, user: userid, amount: amount, time: convertTime(timeout, newcooldown), lost: true };
        }
        let before = fetch(`money_${userid}`);
        let added = db.add(`money_${userid}`, amount);
        let newcooldown = db.set(`begcooldown_${userid}`, Date.now());
        return { onCooldown: false, newCooldown: true, claimedAt: newcooldown, timeout: timeout, before: before, after: added, user: userid, amount: amount, time: convertTime(timeout, newcooldown), lost: false };
    }

    /**
     * transfer - Transfer money from one user to another
     * @param {String} user1 first user id
     * @param {String} user2 Second user id
     * @param {Number} amount Amount
     * @returns Object
     */
    async transfer(user1, user2, amount) {
        if (!user1) throw new TypeError("User id was not provided.");
        if (typeof user1 !== "string") throw new SyntaxError("User id must be a string.");
        if (!user2) throw new TypeError("User id was not provided.");
        if (typeof user2 !== "string") throw new SyntaxError("User id must be a string.");
        if (!amount) throw new TypeError("Amount was not provided.");
        if (isNaN(amount)) throw new SyntaxError("Amount must be a number.");
        if (invalid.includes(Math.sign(amount))) throw new TypeError("Amount can't be negative or zero.");
        let check = fetch(`money_${user1}`);
        if (check < 1) return { error: "Money of first user is less than 1." };
        if (check < amount) return { error: "Money of first user is less than given amount." };
        if (check - amount < 0) return { error: "This user can't share that much amount of money." };
        let newM = db.add(`money_${user2}`, amount);
        let newM2 = db.subtract(`money_${user1}`, amount);
        return { user1: { id: user1, money: newM2 }, user2: { id: user2, money: newM }, amount: amount };
    }

    /**
     * leaderboard - leaderboard
     * @param {Object} options Options = { limit: 10, raw: false }
     * @returns Array
     */
    async leaderboard(options = {}) {
        let limit = options.limit || 10;
        if (isNaN(limit)) throw new SyntaxError("Limit must be a number.");
        if (limit <= 0) throw new SyntaxError("Limit must be a number greater than 0.");
        let raw = options.raw || false;
        let lb = db.all().filter(data => data.ID.startsWith(`money`)).sort((a, b) => b.data - a.data);
        lb.length = parseInt(limit);
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

}

function fetch(param) {
    let check = db.fetch(param);
    if (check < 0) db.set(param, 0);
    return db.fetch(param) ? db.fetch(param) : 0;
}

function convertTime(cooldown, check) {
    let time = ms(cooldown - (Date.now() - check));
    return time;
}

function ms(milliseconds) {
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

module.exports = EconomyManager;
