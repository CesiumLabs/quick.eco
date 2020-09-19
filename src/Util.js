class Util {

    /**
     * This class can not be instantiated
     */
    constructor() {
        throw new Error(`The ${this.constructor.name} class may not be instantiated!`);
    }

    /**
     * Milliseconds Parser
     * @param {number} ms Time in milliseconds to parse
     */
    static ms(ms) {
        if (typeof ms !== "number") throw new Error(`Expected milliseconds to be a number, received ${typeof ms}!`);

        const apply = ms > 0 ? Math.floor : Math.ceil;
        return {
            days: apply(ms / 86400000),
            hours: apply(ms / 3600000) % 24,
            minutes: apply(ms / 60000) % 60,
            seconds: apply(ms / 1000) % 60,
            milliseconds: apply(ms) % 1000,
            microseconds: apply(ms * 1000) % 1000,
            nanoseconds: apply(ms * 1e6) % 1000
        }
    }

    /**
     * Returns cooldown time object
     * @param {number} cooldownTime Cooldown timeout
     * @param {number} collectedTime Collected timestamp
     */
    static getCooldown(cooldownTime, collectedTime) {
        if (cooldownTime instanceof Date) cooldownTime = cooldownTime.getTime();
        if (collectedTime instanceof Date) collectedTime = collectedTime.getTime();
        if (typeof cooldownTime !== "number") throw new Error(`Expected cooldownTime to be a number, received ${typeof cooldownTime}!`);
        if (typeof collectedTime !== "number") throw new Error(`Expected collectedTime to be a number, received ${typeof collectedTime}!`);

        if (collectedTime !== null && cooldownTime - (Date.now() - collectedTime) > 0) return Util.ms(cooldownTime - (Date.now() - collectedTime));
        return Util.ms(0);
    }

    /**
     * Checks for cooldown
     * @param {number} cooldownTime Cooldown timeout
     * @param {number} collectedTime Timestamp when last item was collected
     */
    static onCooldown(cooldownTime, collectedTime) {
        if (cooldownTime instanceof Date) cooldownTime = cooldownTime.getTime();
        if (collectedTime instanceof Date) collectedTime = collectedTime.getTime();
        if (typeof cooldownTime !== "number") throw new Error(`Expected cooldownTime to be a number, received ${typeof cooldownTime}!`);
        if (typeof collectedTime !== "number") throw new Error(`Expected collectedTime to be a number, received ${typeof collectedTime}!`);

        if (collectedTime !== null && cooldownTime - (Date.now() - collectedTime) > 0) return true;
        return false;
    }

    /**
     * Default Cooldown table
     */
    static get COOLDOWN() {
        return {
            DAILY: 86400000,
            WEEKLY: 604800000,
            WORK: 2700000,
            BEG: 60000,
            MONTHLY: 2628000000,
            SEARCH: 300000
        };
    }

}

module.exports = Util;