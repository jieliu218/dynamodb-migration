const chalk = require('chalk');
const AWS = require('aws-sdk');
const { getHexedKey } = require('./util');

const SETTINGS = extractSettings();

AWS.config.update({ region: SETTINGS.region });
const dynamoDB = new AWS.DynamoDB();
const dbClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

function extractSettings() {
    const settings = {};
    // AWS region
    if (process.argv.indexOf('--region') >= 0) {
        settings.region = process.argv[process.argv.indexOf('--region') + 1];
        console.info(chalk.green(`AWS region: ${settings.region}`));
    } else {
        console.info(chalk.red(`AWS region is not provided.`));
        process.exit(1);
    }
    // DynamoDB source table name
    if (process.argv.indexOf('--sourceTable') >= 0) {
        settings.sourceTable = process.argv[process.argv.indexOf('--sourceTable') + 1];
        console.info(chalk.green(`DynamoDB source table name: ${settings.sourceTable}`));
    } else {
        console.info(chalk.red(`DynamoDB source table name is not provided.`));
        process.exit(1);
    }
    // DynamoDB target table name
    if (process.argv.indexOf('--targetTable') >= 0) {
        settings.targetTable = process.argv[process.argv.indexOf('--targetTable') + 1];
        console.info(chalk.green(`DynamoDB target table name: ${settings.targetTable}`));
    } else {
        console.info(chalk.red(`DynamoDB target table name is not provided.`));
        process.exit(1);
    }

    return settings;
};

/**
 * Check if DynamoDB table is existing or not
 * @param {string} tableName 
 */
async function checkTable(tableName) {
    var params = {
        TableName: tableName
    };
    await dynamoDB.describeTable(params, function (err) {
        if (err) {
            console.info(chalk.red(`${tableName} is not found.`));
            process.exit(1);
        }
    }).promise();
}

/**
 * Read all items in source DynamoDB table recursively
 * @param {array} items DynamoDB items found for recursiveness
 * @param {string|boolean} ExclusiveStartKey Start key to find next page of records in DynamoDB
 * 
 * @returns {null|object}
 */
async function readAllItemsFromSourceTable(items = [], ExclusiveStartKey = '') {
    try {
        await checkTable(SETTINGS.sourceTable);
        const scanParameters = {
            TableName: SETTINGS.sourceTable,
        };
        if (ExclusiveStartKey) {
            scanParams.ExclusiveStartKey = ExclusiveStartKey;
        }
        const response = await dbClient.scan(scanParameters).promise();
        const _items = items.concat(response.Items);

        if (response.LastEvaluatedKey) {
            return readAllItemsFromSourceTable(items, response.LastEvaluatedKey);
        }

        if (!_items.length) {
            console.info(chalk.green(`Found ${_items.length} and stop migrating...`));
            process.exit(1);
        }
        console.info(chalk.green(`Found ${_items.length} to migrate`));
        return _items;
    } catch (error) {
        console.log(error);
    }
}

/**
 * Write single item to target table
 * @param {object} item 
 */
async function writeSingleItemToTable(item) {
    try {
        const params = {
            TableName: SETTINGS.targetTable,
            Item: item,
        };
        return await dbClient.put(params).promise();
    } catch (error) {
        console.log(error);
        console.info(chalk.red(`write item failed: ${JSON.stringify(item)}`));
    }

}

async function writeAllItemsFromSourceTable(items) {
    try {
        await checkTable(SETTINGS.targetTable);
        let successfulWrites = 0;
        await Promise.all(
            items.map(async item => {
                return new Promise(async resolve => {
                    await writeSingleItemToTable(item);
                    successfulWrites++;
                    resolve();
                })
            })
        );
        console.log(chalk.green(`Wrote ${successfulWrites} of ${items.length} items to ${SETTINGS.targetTable}`));
    } catch (error) {
        console.log(error);
    }
}

// Run the script
; (async function () {
    console.info(chalk.green(`Start to migrate...`));
    // Store all the data in memory to write later
    const sourceItems = await readAllItemsFromSourceTable();
    await writeAllItemsFromSourceTable(sourceItems);
    process.exit(1);
})()