class FileDB {
    dbName = "FileDB";
    dbVersion = 1;
    db;
    constructor() {
        let request = window.indexedDB.open(this.dbName, this.dbVersion);
        request.onerror = (event) => {
            // Generic error handler for all errors targeted at this database's
            // requests!
            console.error(`Database error: ${event.target.errorCode}`);
        };
        request.onsuccess = (event) => {
            // Do something with request.result!
            this.db = event.target.result;
            this.db.onerror = (event) => {
                // Generic error handler for all errors targeted at this database's
                // requests!
                console.error(`Database error: ${event.target.errorCode}`);
            };
        };

        request.onupgradeneeded = (event) => {
            event.target.result.createObjectStore("directory", { keyPath: "use" });
        };
    }

    insert(dataList = []) {
        const transaction = this.db.transaction(["directory"], "readwrite");

        // Do something when all the data is added to the database.
        transaction.oncomplete = (event) => {
            console.log("All done!");
        };

        transaction.onerror = (event) => {
            // Don't forget to handle errors!
        };

        const objectStore = transaction.objectStore("directory");
        dataList.forEach((data) => {
            objectStore.add(data);
        });
    }

    insertOne(data = {}) {
        try {
            const transaction = this.db.transaction(["directory"], "readwrite");
            transaction.objectStore("directory").add(data);
        } catch (e) {
            console.warn(e);
        }
    }

    delete(key = '', callback = function () { }) {
        try {
            this.db
                .transaction(["directory"], "readwrite")
                .objectStore("directory")
                .delete(key)
                .onsuccess = (event) => {
                    // It's gone!
                    callback(event);
                };
        } catch (e) {
            console.warn(e);
            callback({});
        }
    }

    get(key = '', callback = function () { }) {
        try {
            this.db
                .transaction("directory")
                .objectStore("directory")
                .get(key).onsuccess = (event) => {
                    callback(event.target.result || {});
                };
        } catch (e) {
            console.warn(e);
            callback({});
        }
    }

    update(key, updataData = {}) {
        try {
            const objectStore = this.db
                .transaction(["directory"], "readwrite")
                .objectStore("directory");
            objectStore
                .get(key)
                .onsuccess = (event) => {
                    objectStore
                        .put({ ...event.target.result, ...updataData })
                        .onsuccess = (event) => {
                            // Success - the data is updated!
                        };
                };
        } catch (e) {
            console.warn(e);
        }
    }
}