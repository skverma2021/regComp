// app.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path for the SQLite database file for Project A.
// When you simulate Regulating Agency X, you would use a different file path,
// e.g., 'data/agency_x_blockchain.db'
const DB_FILE = path.join(__dirname, 'data', 'project_a_blockchain.db');

// Ensure the 'data' directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Transaction record structure for reference:
/*
{
    "transactionId": "FDA_BAT_00123",
    "timestamp": "2024-05-15T08:30:00Z",
    "submitterId": "ManufacturerAlpha",
    "stationID": "S25",
    "SO2": 35,
    "NO2": 50,
    "PM10": 120,
    "PM2.5": 40
}
*/

// --- Database Connection and Initialization ---

let db;

/**
 * Initializes the database connection and creates the 'transactions' table if it doesn't exist.
 * @returns {Promise<sqlite3.Database>} A promise that resolves with the database object.
 */
function initDb() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_FILE, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log(`Connected to the SQLite database at ${DB_FILE}`);
                db.run(`CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id TEXT UNIQUE NOT NULL,
                    timestamp TEXT NOT NULL,
                    submitter_id TEXT NOT NULL,
                    station_id TEXT,
                    so2 REAL,
                    no2 REAL,
                    pm10 REAL,
                    pm2_5 REAL,
                    raw_data_json TEXT NOT NULL
                )`, (createErr) => {
                    if (createErr) {
                        console.error('Error creating table:', createErr.message);
                        reject(createErr);
                    } else {
                        console.log('Table "transactions" ensured to exist.');
                        resolve(db);
                    }
                });
            }
        });
    });
}

/**
 * Closes the database connection.
 * @returns {Promise<void>} A promise that resolves when the database is closed.
 */
function closeDb() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                    reject(err);
                } else {
                    console.log('Database connection closed.');
                    resolve();
                }
            });
        } else {
            resolve(); // No database open
        }
    });
}

// --- CRUD Operations ---

/**
 * Creates (Inserts) a new transaction record.
 * @param {Object} transactionData The transaction object to insert.
 * @returns {Promise<Object>} A promise that resolves with the inserted transaction data including its DB ID.
 */
function createTransaction(transactionData) {
    return new Promise((resolve, reject) => {
        const {
            transactionId,
            timestamp,
            submitterId,
            stationID,
            SO2,
            NO2,
            PM10,
            PM2_5
        } = transactionData;

        // Store the entire transaction object as a JSON string in 'raw_data_json'
        const rawDataJson = JSON.stringify(transactionData);

        const sql = `INSERT INTO transactions 
                     (transaction_id, timestamp, submitter_id, station_id, so2, no2, pm10, pm2_5, raw_data_json) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(sql, [
            transactionId,
            timestamp,
            submitterId,
            stationID,
            SO2,
            NO2,
            PM10,
            PM2_5,
            rawDataJson
        ], function(err) {
            if (err) {
                console.error('Error inserting transaction:', err.message);
                reject(err);
            } else {
                // 'this.lastID' gives the ID of the last inserted row
                console.log(`A row has been inserted with ID: ${this.lastID}`);
                resolve({ id: this.lastID, ...transactionData });
            }
        });
    });
}

/**
 * Reads (Retrieves) all transaction records.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of transaction objects.
 */
function readAllTransactions() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM transactions ORDER BY timestamp DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error reading transactions:', err.message);
                reject(err);
            } else {
                // Parse the raw_data_json back into an object if needed, or return raw rows
                const transactions = rows.map(row => ({
                    id: row.id,
                    transactionId: row.transaction_id,
                    timestamp: row.timestamp,
                    submitterId: row.submitter_id,
                    stationID: row.station_id,
                    SO2: row.so2,
                    NO2: row.no2,
                    PM10: row.pm10,
                    PM2_5: row.pm2_5,
                    // You can choose to return the full parsed object or just the individual fields
                    // fullData: JSON.parse(row.raw_data_json)
                }));
                resolve(transactions);
            }
        });
    });
}

/**
 * Reads (Retrieves) a single transaction by its transaction_id.
 * @param {string} transactionId The unique ID of the transaction to retrieve.
 * @returns {Promise<Object|null>} A promise that resolves with the transaction object or null if not found.
 */
function readTransactionById(transactionId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM transactions WHERE transaction_id = ?`;
        db.get(sql, [transactionId], (err, row) => {
            if (err) {
                console.error('Error reading transaction by ID:', err.message);
                reject(err);
            } else {
                if (row) {
                    resolve({
                        id: row.id,
                        transactionId: row.transaction_id,
                        timestamp: row.timestamp,
                        submitterId: row.submitter_id,
                        stationID: row.station_id,
                        SO2: row.so2,
                        NO2: row.no2,
                        PM10: row.pm10,
                        PM2_5: row.pm2_5,
                        // fullData: JSON.parse(row.raw_data_json)
                    });
                } else {
                    resolve(null); // Transaction not found
                }
            }
        });
    });
}

/**
 * Updates an existing transaction record.
 * For a blockchain, *true updates are not usually done*. This is for demonstrating CRUD for the database,
 * but in a real blockchain, you'd record *new transactions* for changes or corrections,
 * not alter existing ones.
 * @param {string} transactionId The unique ID of the transaction to update.
 * @param {Object} newData The new data for the transaction (only fields to be updated).
 * @returns {Promise<number>} A promise that resolves with the number of rows updated.
 */
function updateTransaction(transactionId, newData) {
    return new Promise((resolve, reject) => {
        // Construct SET clause dynamically
        let setParts = [];
        let params = [];
        for (const key in newData) {
            if (Object.hasOwnProperty.call(newData, key)) {
                // Map camelCase keys to snake_case column names for SQL
                const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                setParts.push(`${columnName} = ?`);
                params.push(newData[key]);
            }
        }
        params.push(transactionId); // Add transactionId for WHERE clause

        // In a real blockchain, you'd likely update the raw_data_json as well,
        // but remember, this 'update' function goes against blockchain's immutability.
        // It's here for a pure SQL CRUD example.
        if (Object.keys(newData).length === 0) {
            return reject(new Error("No data provided for update."));
        }

        const sql = `UPDATE transactions SET ${setParts.join(', ')} WHERE transaction_id = ?`;

        db.run(sql, params, function(err) {
            if (err) {
                console.error('Error updating transaction:', err.message);
                reject(err);
            } else {
                console.log(`Rows updated: ${this.changes}`);
                resolve(this.changes); // Number of rows affected
            }
        });
    });
}

/**
 * Deletes a transaction record by its transaction_id.
 * For a blockchain, *records are generally not deleted*. This is for demonstrating CRUD for the database,
 * but in a real blockchain, you'd mark records as invalid or superseded, not remove them.
 * @param {string} transactionId The unique ID of the transaction to delete.
 * @returns {Promise<number>} A promise that resolves with the number of rows deleted.
 */
function deleteTransaction(transactionId) {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM transactions WHERE transaction_id = ?`;
        db.run(sql, [transactionId], function(err) {
            if (err) {
                console.error('Error deleting transaction:', err.message);
                reject(err);
            } else {
                console.log(`Rows deleted: ${this.changes}`);
                resolve(this.changes); // Number of rows affected
            }
        });
    });
}

// --- Main execution flow for demonstration ---
async function main() {
    try {
        await initDb();

        const transaction1 = {
            "transactionId": "AIR_001",
            "timestamp": "2024-05-15T08:30:00Z",
            "submitterId": "ManufacturerAlpha",
            "stationID": "S25",
            "SO2": 35,
            "NO2": 50,
            "PM10": 120,
            "PM2.5": 40
        };

        const transaction2 = {
            "transactionId": "AIR_002",
            "timestamp": "2024-05-15T09:00:00Z",
            "submitterId": "ManufacturerAlpha",
            "stationID": "S26",
            "SO2": 20,
            "NO2": 30,
            "PM10": 80,
            "PM2.5": 25
        };

        const transaction3 = {
            "transactionId": "AIR_003",
            "timestamp": "2024-05-15T09:30:00Z",
            "submitterId": "ManufacturerAlpha",
            "stationID": "S25",
            "SO2": 40,
            "NO2": 55,
            "PM10": 130,
            "PM2.5": 45
        };


        console.log('\n--- CREATE Transactions ---');
        const inserted1 = await createTransaction(transaction1);
        console.log('Inserted:', inserted1);
        const inserted2 = await createTransaction(transaction2);
        console.log('Inserted:', inserted2);
        const inserted3 = await createTransaction(transaction3);
        console.log('Inserted:', inserted3);

        console.log('\n--- READ All Transactions ---');
        let allTransactions = await readAllTransactions();
        console.log('All Transactions:', allTransactions);

        console.log('\n--- READ Specific Transaction (AIR_001) ---');
        let specificTransaction = await readTransactionById("AIR_001");
        console.log('Specific Transaction AIR_001:', specificTransaction);

        console.log('\n--- UPDATE Transaction (Simulating a data correction - though not typical in blockchain) ---');
        // Let's "correct" PM10 for AIR_001 to 115 (though in blockchain you'd add a new record)
        const updatedRows = await updateTransaction("AIR_001", { PM10: 115 });
        console.log(`Updated ${updatedRows} row(s) for AIR_001`);

        console.log('\n--- READ All Transactions After Update ---');
        allTransactions = await readAllTransactions();
        console.log('All Transactions (after update):', allTransactions);

        console.log('\n--- DELETE Transaction (Simulating removal - though not typical in blockchain) ---');
        const deletedRows = await deleteTransaction("AIR_002");
        console.log(`Deleted ${deletedRows} row(s) for AIR_002`);

        console.log('\n--- READ All Transactions After Delete ---');
        allTransactions = await readAllTransactions();
        console.log('All Transactions (after delete):', allTransactions);


    } catch (error) {
        console.error('An error occurred during operations:', error);
    } finally {
        await closeDb();
    }
}

main();