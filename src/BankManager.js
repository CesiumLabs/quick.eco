const User = require("./User");
const Manager = require("./EconomyManager");
const GuildManager = require("./GuildManager");
const ACCOUNTS = {
    CA: "Current Account",
    SA: "Saving Account",
    FDA: "Fixed Deposit Account",
    RDA: "Recurring Deposit Account"
};
const DUE = 604800000;

class BankManager {
    
    /**
      * @constructor
      * Bank Manager
      * @params {Database} database Economy Manager Database
      */
    constructor(database) {
        if (!database) throw new Error("No database provided");
        if (!(database instanceof Manager) || !(database instanceof GuildManager)) throw new Error("Database must be Manager or GuildManager");
        this.db = database;
    }

    /**
      * creates new bank account. If the user has bank account, it will return existing one.
      * @params {User} user User id or Eco.User
      * @params {Options} ops Account Options
      * @params [ops.type] type Account Type
      * @params [ops.bal] balance Account Balance
      * @returns {Bank}
      */
    static createAccount(user, ops={ type, bal=0 }) {
        if (!user) throw new Error(`User expected!`);
        if (typeof user == "string") user = new User(user, undefined, this.db);
        if (!(user instanceof User)) throw new Error("Invalid User");
        if (this.account(user.id)) return this.account(user.id);
        if (!ops.type || typeof (ops.type) !== "string") throw new Error("Invalid Account Type");
        switch(type) {
            case "CA":
                let ca = {
                    type: ACCOUNTS["CA"],
                    account_holder: user,
                    created_at: new Date(),
                    created_timestamp: Date.now(),
                    account_number: Buffer(`${Date.now()}_${user.id}`).toString("base64"),
                    loan: 0,
                    balance: isNaN(ops.bal) ? 0 : ops.bal
                };
                this.db.db.set(`bank_${user.id}`,ca);
                break;
            case "SA":
                let sa = {
                    type: ACCOUNTS["SA"],
                    account_holder: user,
                    created_at: new Date(),
                    created_timestamp: Date.now(),
                    account_number: Buffer(`${Date.now()}_${user.id}`).toString("base64"),
                    loan: 0,
                    balance: isNaN(ops.bal) ? 0 : ops.bal
                };
                this.db.db.set(`bank_${user.id}`,sa);
                break;
            case "FDA":
                let fda = {
                    type: ACCOUNTS["FDA"],
                    account_holder: user,
                    created_at: new Date(),
                    created_timestamp: Date.now(),
                    account_number: Buffer(`${Date.now()}_${user.id}`).toString("base64"),
                    loan: 0,
                    balance: isNaN(ops.bal) ? 0 : ops.bal
                };
                this.db.db.set(`bank_${user.id}`,fda);
                break;
            case "RDA":
                let rda = {
                    type: ACCOUNTS["RDA"],
                    account_holder: user,
                    created_at: new Date(),
                    created_timestamp: Date.now(),
                    account_number: Buffer(`${Date.now()}_${user.id}`).toString("base64"),
                    loan: 0,
                    balance: isNaN(ops.bal) ? 0 : ops.bal
                };
                this.db.db.set(`bank_${user.id}`,rda);
                break;
            default:
                throw new Error("Account type must be one of CA, SA, FDA or RDA");
        }
        
    }

    /**
      * bank deposit
      * @params {Data} user User id or Eco.User
      * @params {Data} guild Guild id (optional)
      * @params {Data} amount Amount to deposit
      * @returns {Account}
      */
    static deposit({ user, guild, amount }) {
        let account = this.account(user);
        if (!account) throw new Error("This user doesn't have a bank account");
        if (!amount || isNaN(amount)) throw new Error("Invalid amount");
        let holder = account.account_holder.id;
        if (guild) this.db.removeMoney(user.id, guild, amount);
        else this.db.removeMoney(user.id, amount);
        if(0 > account.loan) this.db.db.math(`bank_${holder}.loan`, "+", amount);
        this.db.db.math(`bank_${holder}.balance`, "+", amount);
        return this.account(user);
    }

    /**
      * withdraw
      * @params {Data} user User id or Eco.User
      * @params {Data} guild Guild id (optional)
      * @params {Data} amount Amount to deposit
      * @returns {Account}
      */
    static withdraw({ user, guild, amount }) {
        let account = this.account(user);
        if (!account) throw new Error("This user doesn't have a bank account");
        if (!amount || isNaN(amount)) throw new Error("Invalid amount");
        let holder = account.account_holder.id;
        if (guild) this.db.addMoney(user.id, guild, amount);
        else this.db.addMoney(user.id, amount);
        if(0 > (account.balance - amount)) {
            this.db.db.math(`bank_${holder}.loan`, "-", amount);
            this.db.db.set(`bank_${holder}.balance`, 0);
        }
        this.db.db.math(`bank_${holder}.balance`, "-", amount);
        return this.account(user);
    }

    /**
      * bank balance
      * @params {User} user User id or Eco.User
      * @returns {Amount}
      */
    static balance(user) {
        if (!user) throw new Error("Invalid User");
        let account = this.account(user);
        if (!account) throw new Error("This user doesn't have a bank account!");
        return account.balance;
    }

    /**
      * bank account
      * @params {User} user User id or Eco.User
      * @returns {Account}
      */
    static account(user) {
        if (!user || !(user instanceof User)) throw new Error("Invalid User");
        if (user instanceof User) user = user.id;
        if (this.db.db.get(`bank_${user}`) == null) return false;
        return this.db.db.get(`bank_${user}`);
    }

    /**
      * All bank Accounts
      * @returns {Bank[]}
      */
    static get accounts() {
        return this.db.db.all().filter(i => i.ID startsWith("bank_"));
    }

    /**
      * delete account
      * @params {User} user User id or Eco.user
      * @rerurns {Boolean}
      */
    static deleteAccount(user) {
        if (!user || !(user instanceof User)) throw new Error("Invalid User");
        if (user instanceof User) user = user.id;
        return this.db.db.delete(`bank_${user}`);
    }

    static _isLoan(user) {
        let account = this.account(user);
        return !!(account.loan < 0);
    }

    /*static _claim(user) {
        let data = this.account(user);
        if (data.loan > 0) return false;
        let dueOver = this.db.convertTime(DUE,data.loanSince);
        if (dueOver < 0) this.db.setMoney(data.account_holder
    }*/

}

module.exports = BankManager;
