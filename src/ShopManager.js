const Db = require("rex.db");
Db.init("./economy");
const db = new Db.table("ecoshop");
const EcoError = require("./Error");

class ShopManager extends Array {

    constructor() {
        super();
    }

    /**
     * registerItem - Adds an Item to the Shop
     * @param {String} itemName Name of the Item
     * @param {Object} [itemInfo] About the Item
     * @param {Number} [itemInfo.cost] Cost of the item
     * @param {Number} [itemInfo.price] alias of cost
     * @param {Any} [itemInfo.any] anything related to item (optional)
     * @returns ShopManager
     */
    registerItem(itemName, itemInfo = {}) {
        if(typeof itemName !== "string") throw new EcoError("Item name must be a string.");
        if(typeof itemInfo !== "object") throw new EcoError("Item info(s) must be a string.");
        const name = itemName || itemInfo.name;
        if(!name) throw new EcoError("Item name was not provided.");
        const cost = itemInfo.cost || itemInfo.price;
        if(!cost || typeof cost !== "number") throw new EcoError("Item cost must be a number");
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
        if(!itemName) throw new EcoError("Item name was not provided.");
        if(typeof itemName !== "string") throw new EcoError("Item name must be a string.");
        return this.find(item => item.name == itemName);
    }

    /**
     * hasItem - Checks if an Item is in Shop
     * @param {String} itemName Name of the Item
     * @returns boolean
     */
    hasItem(itemName) {
        if(!itemName) throw new EcoError("Item name was not provided.");
        if(typeof itemName !== "string") throw new EcoError("Item name must be a string.");
        return !!(this.map(item => item.name).includes(itemName));
    }

    /**
     * updateItem - Checks if an Item is in Shop
     * @param {String} itemName Name of the Item
     * @param {newItemInfo} [newItemInfo] Item's new information
     * @param {Number} [newItemInfo.cost] Cost of the item
     * @param {Number} [newItemInfo.price] alias of cost
     * @param {Any} [newItemInfo.any] anything related to item (optional)
     * @returns ShopManager
     */
    updateItem(itemName, newItemInfo = {}) {
        if(typeof itemName !== "string") throw new EcoError("Item name must be a string.");
        if(typeof newItemInfo !== "object") throw new EcoError("Item info(s) must be a string.");
        const name = itemName || newItemInfo.name;
        if(!name) throw new EcoError("Item name was not provided.");
        let item = this.find(item => item.name == itemName);
        if(!item) throw new EcoError(`${itemName} was not found.`);
        const cost = newItemInfo.cost || newItemInfo.price;
        if(!cost || typeof cost !== "number") throw new EcoError("Item cost must be a number");
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
        if(!itemName) throw new EcoError("Item name was not provided.");
        if(typeof itemName !== "string") throw new EcoError("Item name must be a string.");
        let item = this.map(item => item.name).indexOf(itemName);
        if(!item) return false;
        this.splice(item, 1);
        return true;
    }
    
    /**
     * removeClones - Removes cloned items
     * @returns Array
     */
    removeClones() {
        if (this.length < 1) return [];
        return this.from(new Set(this));
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
     * @returns Array
     */
    get collection() {
        return db.get("collection") ? db.get("collection") : [];
    }
    
    /**
     * _save - Saves the item in database
     * @param {Array} i - Array to save. If this option isn't provided, it will save the ShopManager.
     * @returns Boolean
     */
    _save(i) {
        db.set("collection", i ? (Array.isArray(i) ? i : this ) : this);
        return true;
    }
    
    /**
     * _delete - Deletes everything from the collection
     * @returns Boolean
     */
    _delete() {
        db.delete("collection");
        return true;
    }

}

module.exports = ShopManager;
