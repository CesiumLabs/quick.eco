const EcoError = require("./Error");
const db = require("rex.db");
db.init("./economy");

class Journal {
    
    constructor(root) {
        if (typeof root !== "string") throw new EcoError("Root name must be a string");
        let currentMonth = new Date().getMonth() + 1;
        this.db = db.table(`transactions_${currentMonth}`);
        this.months = [
             "January",
             "February",
             "March",
             "April",
             "May",
             "June",
             "July",
             "August",
             "September",
             "October",
             "November",
             "December"
       ];
       this.date = new Date();
    }

    static prepare(dr, cr, type) {
        if (!dr || !cr) throw new EcoError("Debit or Credit details missing in statement");
        if (!type) throw new EcoError("No type provided");
        if (typeof dr !== "object" || typeof cr !== "object") throw new EcoError("Invalid data type provided for debit or credit.");
        if (typeof type !== "string") throw new EcoError("Type of type must be a string");
        
        // todo: add entries
    }
    
}

module.exports = Journal;
