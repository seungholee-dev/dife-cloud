#!/usr/bin/env node

const cdk = require("aws-cdk-lib");
const { NetworkStack } = require("../lib/dife-network-stack");
const { DatabaseStack } = require("../lib/dife-database-stack");
const { StorageStack } = require("../lib/dife-storage-stack");

const app = new cdk.App();

const networkingStack = new NetworkStack(app, "DifeNetworkStack");

const databaseStack = new DatabaseStack(app, "DifeDatabaseStack", {
    vpc: networkingStack.vpc,
});

const storageStack = new StorageStack(app, "DifeStorageStack");
