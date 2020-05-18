const db = new (require("quick.db")).table("ecoshop");

class ShopManager extends Array {

    /**
     * @constructor
     * @example ```const shop = new Eco.ShopManager();```
     */
    constructor() {
        super();
    }

    /**
     * registerItem - Adds an Item to the Shop
     * @param {String} itemName Name of the Item
     * @param {Object} itemInfo About the Item
     * @returns ShopManager
     */
    registerItem(itemName, itemInfo = {}) {
        if(typeof itemName !== "string") throw new TypeError("Item name must be a string.");
        if(typeof itemInfo !== "object") throw new TypeError("Item info(s) must be a string.");
        const name = itemName || itemInfo.name;
        if(!name) throw new TypeError("Item name was not provided.");
        const cost = itemInfo.cost;
        if(!cost || typeof cost !== "number") throw new TypeError("Item cost must be a number");
        this.push({
            name, ...itemInfo
        }); // ...itemInfo because user can add excess info about the item
        return this;
    }

    /**
     * getItem - Fetches an Item from the Shop
     * @param {String} itemName Name of the Item
     * @returns object
     */
    getItem(itemName) {
        if(!itemName) throw new TypeError("Item name was not provided.");
        if(typeof itemName !== "string") throw new TypeError("Item name must be a string.");
        return this.find(item => item.name == itemName);
    }

    /**
     * hasItem - Checks if an Item is in Shop
     * @param {String} itemName Name of the Item
     * @returns boolean
     */
    hasItem(itemName) {
        if(!itemName) throw new TypeError("Item name was not provided.");
        if(typeof itemName !== "string") throw new TypeError("Item name must be a string.");
        return !!(this.map(item => item.name).includes(itemName));
    }

    /**
     * updateItem - Checks if an Item is in Shop
     * @param {String} itemName Name of the Item
     * @param {newItemInfo} newItemInfo Item's new information
     * @returns ShopManager
     */
    updateItem(itemName, newItemInfo = {}) {
        if(typeof itemName !== "string") throw new TypeError("Item name must be a string.");
        if(typeof newItemInfo !== "object") throw new TypeError("Item info(s) must be a string.");
        const name = itemName || newItemInfo.name;
        if(!name) throw new TypeError("Item name was not provided.");
        let item = this.find(item => item.name == itemName);
        if(!item) throw new TypeError(`${itemName} was not found.`);
        const cost = newItemInfo.cost;
        if(!cost || typeof cost !== "number") throw new TypeError("Item cost must be a number");
        item = {
            ...newItemInfo, name
        }; // name atlast to prevent sneaky ppl changing the name
        return this;
    }

    /**
     * deleteItem - Deletes an Item from the shop
     * @param {String} itemName Name of the Item
     * @returns Boolean
     */
    deleteItem(itemName) {
        if(!itemName) throw new TypeError("Item name was not provided.");
        if(typeof itemName !== "string") throw new TypeError("Item name must be a string.");
        let item = this.map(item => item.name).indexOf(itemName);
        if(!item) return false;
        this.splice(item, 1);
        return true;
    }

    /**
     * allItems - All the Items in the Shop
     * @returns ShopManager
     */
    allItems() {
        return this;
    }
    
    /**
     * all - alias to allItems
     * @returns ShopManager
     */
    all() {
        return this.allItems();
    }
    
    /**
     * collection - Saved data
     * @returns array
     */
    get collection() {
        return db.get("collection") ? db.get("collection") : [];
    }
    
    /**
     * _save - Saves the item in database
     * @returns Boolean
     */
    _save() {
        db.set("collection", this);
        return true;
    }

}

module.exports = ShopManager;
