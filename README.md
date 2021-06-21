# DynamoDB Mirgration Script
This script is used for migraing old Service Discovery DynamoDB to new Service Discovery DynamoDB which is created by kp-service-discovery.

It is required the DynamoDB table in same AWS region.

## How to migrate
Under nkp-pocky:

```
cd ./Utils/dynamodb-migration
npm i
node index.js --region eu-west-1 --sourceTable your_source_table --targetTable your_target_table 

```
If run successfuly:
```
AWS region: eu-west-1
DynamoDB source table name: your_source_table
DynamoDB target table name:your_target_table
Start to migrate...
Found 926 to migrate
Wrote 926 of 926 items to your_target_table
```

Arguments:
- region: aws region
- sourceTable: DynamoDB source table name
- targetTable: DynamoDB target table name
