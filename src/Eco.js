const Util = require('./Util');
const VALID_ADAPTERS = {
    sqlite: '@quick.eco/sqlite',
    mongo: '@quick.eco/mongo',
    mysql: '@quick.eco/mysql'
}

class EconomyManager {
    
    /**
     * Economy manager
     * @param {object} options Options
     * @param {"sqlite"|"mongo"|"mysql"} options.adapter Adapter
     * @param {object} [options.adapterOptions={}] Adapter Options
     * @param {string} [options.prefix="money"] Prefix
     * @param {boolean} [options.noNegative=false] If it should not go below 0
     */
    constructor(options = { adapterOptions: {}, prefix: 'money', noNegative: false }) {

        /**
         * If it should not go below 0
         * @type {boolean}
         */
        this.noNegative = options.noNegative;

        /**
         * Prefix
         * @type {string}
         */
        this.prefix = options.prefix

        /**
         * Adapter
         * @type {object}
         */
        this.adapter = {
            name: typeof options.adapter === 'string' ? options.adapter : undefined,
            options: options.adapterOptions
        };

        /**
         * Database Manager
         * @type {any}
         */
        this.db;

        if (this.adapter.name && Object.keys(VALID_ADAPTERS).includes(this.adapter.name)) this.__makeAdapter()
        else throw new Error(`Invalid Adapter: ${this.adapter.name}`)

    }

    __makeAdapter() {
        try {
            const adapter = require(VALID_ADAPTERS[this.adapter.name]);

            switch (this.adapter.name) {
                case 'mongo':
                    if (this.adapter.name === 'mongo' && !this.adapter.options.uri) throw new Error('Mongo URI Not provided');

                    this.db = new adapter(this.adapter.options.uri, this.adapter.options);

                    break;
                default:

                    this.db = new adapter(this.adapter.options);

                    break;
            }

        } catch (err) {
            throw new Error(`Could not find ${VALID_ADAPTERS[this.adapter.name]}`);
        }
    }

    /**
     * Adds money
     * @param {string} userID User id
     * @param {string} [guildID=false] Guild id
     * @param {number} money amount
     * @returns {Promise<number>}
     */
    async addMoney(userID, guildID = false, money) {

        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("Invalid User ID!");
        if (typeof money !== "number") throw new Error(`"money" must be a number, received ${typeof money}!`);

        const key = Util.makeKey(userID, guildID, this.prefix);
        const prev = await this.fetchMoney(userID, guildID);

        await this.db.write({ ID: key, data: prev + money });
        return prev + money;
    }

    /**
     * Subtracts money
     * @param {string} userID User id
     * @param {string} [guildID=false] Guild id
     * @param {number} money amount
     * @returns {Promise<number>}
     */
    async subtractMoney(userID, guildID = false, money) {

        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("Invalid User ID!");
        if (typeof money !== "number") throw new Error(`"money" must be a number, received ${typeof money}!`);

        const key = Util.makeKey(userID, guildID, this.prefix);
        const prev = await this.fetchMoney(userID, guildID);

        await this.db.write({ ID: key, data: prev - money });

        return prev - money;
    }

    /**
     * Sets money
     * @param {string} userID User id
     * @param {string} [guildID=false] Guild id
     * @param {number} money amount
     * @returns {Promise<number>}
     */
    async setMoney(userID, guildID = false, money) {
        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("Invalid User ID!");
        if (typeof money !== "number") throw new Error(`"money" must be a number, received ${typeof money}!`);

        const key = Util.makeKey(userID, guildID, this.prefix);

        await this.db.write({ ID: key, data: money });
        return money;
    }

    /**
     * Deletes a user
     * @param {string} userID User id
     * @param {string} [guildID=false] Guild id
     * @returns {Promise<boolean>}
     */
    async delete(userID, guildID = false) {
        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("Invalid User ID!");

        const key = Util.makeKey(userID, guildID, this.prefix);

        await this.db.delete(key);
        return true;
    }

    /**
     * Deletes all the data from a specific guild
     * @param {string} guildID Guild ID
     * @returns {Promise<boolean>}
     */
    async deleteAllFromGuild(guildID) {
        if (!guildID || typeof guildID !== 'string') throw new Error('Invalid Guild ID');

        let all = await this.all();

        all = all.filter(r => r.ID.includes(guildID));

        if (all[0]) {
            let i = 0, len = all.length;

            while (i < len) {
                this.db.delete(all[i].ID);
                i++;
            };

            return true;
        } else return;
    }

    /**
     * Deletes all the data from a specific user
     * @param {string} userID User ID
     * @returns {Promise<boolean>}
     */
    async deleteAllFromUser(userID) {
        if (!userID || typeof userID !== 'string') throw new Error('Invalid User ID');

        let all = await this.all();

        all = all.filter(r => r.ID.includes(userID));

        if (all[0]) {
            let i = 0, len = all.length;

            while (i < len) {
                this.db.delete(all[i].ID);
                i++;
            };

            return true;
        } else return;
    }

    /**
     * @typedef {object} Leaderboard
     * @property {number} position User position
     * @property {string} user The user
     * @property {string} guild Guild id (optional)
     * @property {number} money Money
     */

    /**
     * Creates leaderboard object
     * @param {string} guildID Guild id
     * @param {number} limit data limit
     * @returns {Promise<Leaderboard[]>}
     */
    async leaderboard(guildID = false, limit) {

        this.__checkManager();

        let data = (await this.all(limit)).filter(x => x.ID.startsWith(this.prefix));

        if (guildID) data = data.filter(x => x.ID.includes(guildID));

        let arr = [];

        data.sort((a, b) => b.data - a.data).forEach((item, index) => {
            const parsedKey = Util.parseKey(item.ID);

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
     * @returns {Promise<object[]>}
     */
    async all(limit = 0) {
        this.__checkManager();
        const data = await this.db.readAll();
        if (limit < 1) return data || [];
        return data.slice(0, limit) || [];
    }

    /**
     * @typedef {object} RewardData
     * @property {boolean} cooldown If the user is on cooldown
     * @property {MS?} time Cooldown time
     * @property {number|undefined} amount The amount
     * @property {number|undefined} money Total balance
     */

    /**
     * Daily reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     * @returns {Promise<RewardData>}
     */
    async daily(userID, guildID = false, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = Util.random(ops.range[0] || 100, ops.range[1] || 250);

        const key = Util.makeKey(userID, guildID, "daily");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.DAILY, cooldownRaw ? cooldownRaw.data : 0);

        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.DAILY, cooldownRaw ? cooldownRaw.data : 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);

        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount, money: newAmount };
    }

    /**
     * Weekly reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     * @returns {Promise<RewardData>}
     */
    async weekly(userID, guildID = false, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = Util.random(ops.range[0] || 200, ops.range[1] || 750);

        const key = Util.makeKey(userID, guildID, "weekly");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.WEEKLY, cooldownRaw ? cooldownRaw.data : 0);

        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.WEEKLY, cooldownRaw ? cooldownRaw.data : 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);

        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount, money: newAmount };
    }

    /**
     * Monthly reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     * @returns {Promise<RewardData>}
     */
    async monthly(userID, guildID = false, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = Util.random(ops.range[0] || 1000, ops.range[1] || 5000);

        const key = Util.makeKey(userID, guildID, "monthly");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.MONTHLY, cooldownRaw ? cooldownRaw.data : 0);

        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.MONTHLY, cooldownRaw ? cooldownRaw.data : 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);
        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount, money: newAmount };
    }

    /**
     * @typedef {object} JobData
     * @property {boolean} cooldown If the user is on cooldown
     * @property {MS?} time Cooldown time
     * @property {number|undefined} amount The amount
     */

    /**
     * Work reward
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @param {number} amount Custom Amount
     * @param {object} ops Options
     * @param {number[]} [ops.range] Amount range
     * @param {number} [ops.timeout] Timeout
     * @returns {Promise<JobData>}
     */
    async work(userID, guildID = false, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = Util.random(ops.range[0] || 500, ops.range[1] || 1000);

        const key = Util.makeKey(userID, guildID, "work");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.WORK, cooldownRaw ? cooldownRaw.data : 0);

        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.WORK, cooldownRaw ? cooldownRaw.data : 0) };

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
     * @returns {Promise<JobData>}
     */
    async search(userID, guildID = false, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = Util.random(ops.range[0] || 1, ops.range[1] || 70);

        const key = Util.makeKey(userID, guildID, "search");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.SEARCH, cooldownRaw ? cooldownRaw.data : 0);
        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.SEARCH, cooldownRaw ? cooldownRaw.data : 0) };

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
     * @returns {Promise<JobData>}
     */
    async custom(userID, guildID = false, amount, ops = { range: [], timeout: 0, prefix: "custom" }) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = Util.random(ops.range[0] || 1, ops.range[1] || 70);

        const key = Util.makeKey(userID, guildID, ops.prefix || "custom");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.DAILY, cooldownRaw ? cooldownRaw.data : 0);

        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.DAILY, cooldownRaw ? cooldownRaw.data : 0) };

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
     * @returns {Promise<JobData>}
     */
    async beg(userID, guildID = false, amount, ops = { range: [], timeout: 0 }) {
        this.__checkManager();

        if (!userID || typeof userID !== "string") throw new Error("User id was not provided!");
        if (!amount) amount = Util.random(ops && ops.range[0] || 1, ops && ops.range[1] || 70);

        const key = Util.makeKey(userID, guildID, "beg");
        const cooldownRaw = await this._get(key);
        const cooldown = Util.onCooldown(ops.timeout || Util.COOLDOWN.BEG, cooldownRaw ? cooldownRaw.data : 0);

        if (cooldown) return { cooldown: true, time: Util.getCooldown(ops.timeout || Util.COOLDOWN.BEG, cooldownRaw ? cooldownRaw.data : 0) };

        const newAmount = await this.addMoney(userID, guildID, amount);
        await this._set(key, Date.now());

        return { cooldown: false, time: null, amount: newAmount };
    }



    /**
     * Fetches money
     * @param {string} userID User id
     * @param {string} guildID Guild id
     * @returns {Promise<number>}
     */
    async fetchMoney(userID, guildID = false) {
        this.__checkManager();
        if (!userID || typeof userID !== "string") throw new Error("Invalid User ID!");

        const key = Util.makeKey(userID, guildID, this.prefix);

        const userData = await this.db.read(key);

        if (!userData || isNaN(userData.data)) {
            if (this.noNegative) await this.db.write({
                ID: key,
                data: 0
            });
            return 0;
        };

        if (this.noNegative && amt < 0) await this.db.write({
            ID: key,
            data: 0
        });

        return userData.data;
    }

    async _get(key) {
        this.__checkManager();
        if (typeof key !== "string") throw new Error("key must be a string!");
        const data = await this.db.read(key);
        if (!data) return null;
        return data;
    }

    async _set(key, data) {
        this.__checkManager();

        if (typeof key !== "string") throw new Error("key must be a string!");
        if (typeof data === "undefined") data = 0;

        await this.db.write({ ID: key, data });

        return true;
    }

    /**
     * Resets database
     * @returns {Promise<boolean>}
     */
    async reset() {
        this.__checkManager();

        this.db.deleteAll();

        return true;
    }


    __checkManager() {
        if (!this.db) throw new Error("Manager is not ready yet!");
    }

};

module.exports = EconomyManager;