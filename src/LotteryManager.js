const db = require("quick.db");
const { EventEmitter } = require("events");

/**
 * LotteryManager - Simple LotteryManager class
 * This class can be used to create lottery system in your bot
 */
class LotteryManager extends EventEmitter {

    /**
      * @constructor
      * @param {Object} options - Lottery Options
      * @param [options.lotteryInterval] - Lottery Interval, time in minutes.
      * @param [options.checkInterval] - Lottery check interval, time in seconds
      */
    constructor(options = {}) {
        super();
        this._started = false;
        this.db = db;
        this.startedAt = 0;
        this.options = Object.assign({
            lotteryInterval: 60, // mins
            checkInterval: 60 // seconds
        }, options);
    }

    /**
      * starts the lotteryManager
      * @fires LotteryManager#ready
      */
    start() {
        this._started = true;
        this.startedAt = Date.now();
        this.emit('ready');
        if(!this.db.fetch('lastStarted') || this.db.fetch("lastStarted") == null) this.db.set('lastStarted', Date.now());
        return this._start();
    }
    
    /**
      * registers the user in lottery
      * @param {String} id - ID of a user, generally a Snowflake
      * @fires LotteryManager#entryCreate
      */
    registerUser(id) {
        if(!id) {
            let emitted = this.emit('error', `User ID was not provided.`);
            if(!emitted) throw new TypeError(`User ID was not provided.`);
        }
        let lotteryDB = this.db.fetch('lottery') || [];
        lotteryDB.push(id);
        this.db.set('lottery', lotteryDB);
        let emitted = this.emit('entryCreate', id);
        if(!emitted) return true;
    }

    /**
      * removes a user
      * @param {String} User id
      * @fires LotteryManager#entryDelete
      */
    removeUser(id) {
        if(!id) {
            let emitted = this.emit('error', `User ID was not provided.`);
            if(!emitted) throw new TypeError(`User ID was not provided.`);
        }
        let lotteryDB = this.db.fetch('lottery') || [];
        if (!lotteryDB.includes(id)) {
            let emitted = this.emit('error', `${id} is not enrolled.`);
            if(!emitted) throw new TypeError(`${id} is not enrolled.`);
        }
        lotteryDB.splice(lotteryDB.indexOf(id), 1);
        this.db.set('lottery', lotteryDB);
        let emitted = this.emit('entryDelete', id);
        if(!emitted) return true;
    }

    /**
      * get all registed users
      */
    get users() {
        return (this.db.fetch('lottery') || []);
    }


    /**
      * forcefully end the lottery
      * @returns Boolean
      */
    end() {
        if (!this._started) return false;
        let u = this.db.get("lottery");
        if (!u || u == null || u.length < 1) {
            let emitted = this.emit("error", "No user particilated");
            if (!emitted) throw new Error("No user participated");
            return;
        }
        let Winner = u[Math.floor(Math.random() * u.length)];
        this.emit("end", (Winner, u));
        this.db.all().forEach(d => this.db.delete(d.ID));
        this.db.set('lastEnded', Date.now());
        this._started = false;
        this.startedAt = 0;
        return true;
    }
    
    /**
      * @ignore
      * @private
      * Lottery Starter
      */
    _start() {
        if(!this._started) return false;
        const checkInterval = this.checkInterval * 1000;
        const lotteryInterval = this.lotteryInterval * 60 * 1000;
        setInterval(() => {
            let lastEnded = this.db.fetch('lastEnded') || this.startedAt;
            let lastStarted = this.db.fetch('lastStarted');
            if(!lastEnded && lastStarted) {
                lastEnded = lastStarted;
                this.emit("resume");
            }
            if((Date.now() - lastEnded) > lotteryInterval) {
                const lotteryDB = this.db.fetch('lottery') || [];
                if (lotteryDB.length < 1) return this.emit("error", "No user participated");
                let randomUser = lotteryDB[Math.floor(Math.random() * lotteryDB.length)];
                this.emit('end', (randomUser, lotteryDB));
                this.db.set('lastEnded', Date.now());
                this.db.all().forEach(i => this.db.delete(i.ID));
                this.start();
            }
        }, checkInterval);
    }

}

/**
  * Emitted whenever the LotteryManager becomes ready
  * @event LotteryManager#ready
  */

/**
  * Emitted whenever error occurs
  * @event LotteryManager#error
  * @param {Error} error
  */

/**
  * Emitted whenever lottery resumes
  * @event LotteryManager#resume
  */

/**
  * Emitted whenever a user is registered
  * @event LotteryManager#entryCreate
  * @param {User} user registered
  */

/**
  * Emitted whenever a user is removed from the lottery
  * @event LotteryManager#entryDelete
  * @param {User} removed user
  */

/**
  * Emitted whenever lottery ends
  * @event LotteryManager#end
  * @param {String} winner - Lottery Winner
  * @param {Array} entries - Array of the entries
  * @example lotrery.on("end", (winner, entries) => console.log(winner + " won the lottery. Total "+ entries.length + " participated!");
  */

module.exports = LotteryManager;
