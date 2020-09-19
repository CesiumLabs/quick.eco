const Manager = require("./Manager");
const Util = require("./Util");

class EconomyManager {

    /**
     * Creates quick.eco instance
     * @param {object} ops Manager options
     * @param {boolean} [ops.useDefaultManager=true] If it should use default manager
     * @param {string} [ops.storage] Storage path for default manager
     * @param {string} [ops.prefix] Prefix for the key
     * @param {boolean} [ops.noNegative=false] If it should not go below 0
     * @param {Manager} customManager Custom storage manager instance.
     */
    constructor(ops = { useDefaultManager: true, storage: "./quick.eco.json", prefix: "money", noNegative: false }, customManager) {

        /**
         * Options
         */
        this.options = {
            isDefault: ops && !!ops.useDefaultManager,
            storage: typeof ops.storage === "string" ? ops.storage : !!ops.storage,
            prefix: ops && ops.prefix || "money",
            noNegative: !!ops.noNegative
        };

        if (!this.options.isDefault && customManager) {
            if (!(customManager.prototype instanceof Manager)) throw new Error("CustomManager must be the instance of default manager!");
            this.db = new customManager();
        }
        else if (!this.options.isDefault && !customManager) throw new Error("Invalid manager!");

        if (this.options.isDefault) this.__makeManager();
    }

    /**
     * Sets moeny
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} money Money to set
     * @returns {Promise<number>}
     */
    async setMoney(userID, guildID, money) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("Invalid User ID!");
        if (typeof money !== "number") throw new Error(`"money" must be a number, received ${typeof money}!`);
        const key = EconomyManager.makeKey(userID, guildID, this.options.prefix);

        await this.db.write({
            ID: key,
            data: money
        });
        return money;
    }

    /**
     * Adds money
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} money amount
     */
    async addMoney(userID, guildID, money) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("Invalid User ID!");
        if (typeof money !== "number") throw new Error(`"money" must be a number, received ${typeof money}!`);
        const key = EconomyManager.makeKey(userID, guildID, this.options.prefix);

        const prev = await this.fetchMoney(userID, guildID);
        await this.db.write({
            ID: key,
            data: prev + money
        });
        return prev + money;
    }

    /**
     * Subtracts money
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} money amount
     */
    async subtractMoney(userID, guildID, money) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("Invalid User ID!");
        if (typeof money !== "number") throw new Error(`"money" must be a number, received ${typeof money}!`);
        const key = EconomyManager.makeKey(userID, guildID, this.options.prefix);

        const prev = await this.fetchMoney(userID, guildID);

        await this.db.write({
            ID: key,
            data: prev - money
        });

        return prev - money;
    }

    /**
     * Creates leaderboard object
     * @param {string} guildID Guild id
     * @param {number} limit data limit
     * @returns {Promise<any[]>}
     */
    async leaderboard(guildID, limit) {
        this.__checkManager();
        let data = (await this.all(limit)).filter(x => x.ID.startsWith(this.options.prefix));
        if (guildID) data = data.filter(x => x.ID.includes(guildID));

        let arr = [];
        data.sort((a, b) => b.data - a.data).forEach((item, index) => {
            const parsedKey = EconomyManager.parseKey(item.ID);

            const data = {
                position: index + 1,
                user: `${parsedKey.userID}`,
                guild: `${parsedKey.guildID || ""}`,
                money: isNaN(item.data) ? 0 : item.data
            };

            arr.push(data);
        });

        return arr;
    }

    /**
     * Returns everything from the database
     * @returns {Promise<any[]>}
     */
    async all(limit = 0) {
        this.__checkManager();
        const data = await this.db.read();
        if (limit < 1) return data || [];
        return data.slice(0, limit) || [];
    }

    /**
     * Daily reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     */
    async daily(userID, guildID, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = this.random(ops && ops.range && ops.range[0] || 100, ops && ops.range && ops.range[1] || 250);
        const key = EconomyManager.makeKey(userID, guildID, "daily");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.DAILY, cooldownRaw || 0);
        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.DAILY, cooldownRaw || 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);
        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount: amount, money: newAmount };
    }

    /**
     * Weekly reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     */
    async weekly(userID, guildID, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = this.random(ops && ops.range && ops.range[0] || 200, ops && ops.range && ops.range[1] || 750);
        const key = EconomyManager.makeKey(userID, guildID, "weekly");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.WEEKLY, cooldownRaw || 0);
        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.WEEKLY, cooldownRaw || 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);
        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount: newAmount };
    }

    /**
     * Monthly reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     */
    async monthly(userID, guildID, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = this.random(ops && ops.range && ops.range[0] || 1000, ops && ops.range && ops.range[1] || 5000);
        const key = EconomyManager.makeKey(userID, guildID, "monthly");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.MONTHLY, cooldownRaw || 0);
        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.MONTHLY, cooldownRaw || 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);
        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount: newAmount };
    }

    /**
     * Work reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     */
    async work(userID, guildID, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = this.random(ops && ops.range && ops.range[0] || 500, ops && ops.range && ops.range[1] || 1000);
        const key = EconomyManager.makeKey(userID, guildID, "work");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.WORK, cooldownRaw || 0);
        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.WORK, cooldownRaw || 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);
        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount: newAmount };
    }

    /**
     * Search reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     */
    async search(userID, guildID, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = this.random(ops && ops.range && ops.range[0] || 1, ops && ops.range && ops.range[1] || 70);
        const key = EconomyManager.makeKey(userID, guildID, "search");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.SEARCH, cooldownRaw || 0);
        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.SEARCH, cooldownRaw || 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);
        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount: newAmount };
    }

    /**
     * Custom reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     * @param {string} [ops.prefix] Data prefix
     */
    async custom(userID, guildID, amount, ops = { range: [], timeout: 0, prefix: "custom" }) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = this.random(ops && ops.range && ops.range[0] || 1, ops && ops.range && ops.range[1] || 70);
        const key = EconomyManager.makeKey(userID, guildID, ops.prefix || "custom");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.DAILY, cooldownRaw || 0);
        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.DAILY, cooldownRaw || 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);
        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount: newAmount };
    }

    /**
     * Beg reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     */
    async beg(userID, guildID, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = this.random(ops && ops.range[0] || 1, ops && ops.range[1] || 70);
        const key = EconomyManager.makeKey(userID, guildID, "beg");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.BEG, cooldownRaw || 0);
        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.BEG, cooldownRaw || 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);
        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount: newAmount };
    }

    /**
     * Returns random number
     * @param {number} from inclusive number
     * @param {number} to exclusive number
     */
    random(from, to) {
        if (typeof from !== "number" || typeof to !== "number") return 0;
        const amt = Math.floor(Math.random() * (to - from + 1)) + from;
        return amt;
    }

    /**
     * Fetches money
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @returns {Promise<number>}
     */
    async fetchMoney(userID, guildID) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("Invalid User ID!");
        const key = EconomyManager.makeKey(userID, guildID, this.options.prefix);

        const data = await this.db.read(key);
        const amt = data[0] ? data[0].data : 0;
        if (!amt || isNaN(amt)) {
            if (this.options.noNegative) await this.db.write({
                ID: key,
                data: 0
            });
            return 0;
        };

        if (this.options.noNegative && amt < 0) await this.db.write({
            ID: key,
            data: 0
        });
        
        return amt;
    }

    /**
     * Fetches something
     * @param {string} key key
     * @rpivate
     * @ignore
     */
    async _get(key) {
        this.__checkManager();
        if (typeof key !== "string") throw new Error("key must be a string!");
        const data = await this.db.read(key);
        if (!data[0]) return null;
        return data[0].data;
    }

    /**
     * Sets something
     * @param {string} key key
     * @param {number} data data
     * @rpivate
     * @ignore
     */
    async _set(key, data) {
        this.__checkManager();
        if (typeof key !== "string") throw new Error("key must be a string!");
        if (typeof data === "undefined") data = null;

        await this.db.write({
            ID: key,
            data: data
        });

        return true;
    }

    /**
     * Reset storage
     * @param {string} id Any matching id to remove
     */
    async reset(id) {
        this.__checkManager();
        if (id) {
            const all = await this.db.read();
            await this.db.write(all.filter(i => !i.ID.includes(id)));
        } else {
            this.db.initDatabase(true);
        }

        return true;
    }

    /**
     * Creates database manager
     * @private
     */
    __makeManager() {
        /**
         * Database manager
         * @type {Manager}
         */
        this.db = new Manager(this.options);
    }

    /**
     * Makes key
     * @param {string} user User id
     * @param {string} guild Guild id
     * @param {string} prefix Prefix
     */
    static makeKey(user, guild, prefix) {
        return `${prefix}_${guild ? guild + "_" : ""}${user}`;
    }

    /**
     * Parse key
     * @param {string} key Data key
     */
    static parseKey(key) {
        if (!key) throw new Error("Invalid key");
        const chunk = key.split("_");
        if (chunk.length >= 3) {
            const obj = {
                prefix: chunk[0],
                guildID: chunk[1],
                userID: chunk[2]
            };

            return obj;
        } else {
            const obj = {
                prefix: chunk[0],
                guildID: null,
                userID: chunk[1]
            };

            return obj;
        }
    }

    __checkManager() {
        if (!this.db) throw new Error("Manager is not ready yet!");
    }

}

module.exports = EconomyManager;