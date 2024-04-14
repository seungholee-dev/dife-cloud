#!/usr/bin/env node

const cdk = require("aws-cdk-lib");
const { NetworkStack } = require("../lib/dife-network-stack");
const { DatabaseStack } = require("../lib/dife-database-stack");
const { StorageStack } = require("../lib/dife-storage-stack");
const { ApplicationStack } = require("../lib/dife-application-stack");
const { PipelineStack } = require("../lib/dife-pipeline-stack");

const app = new cdk.App();

const networkingStack = new NetworkStack(app, "DifeNetworkStack");

const databaseStack = new DatabaseStack(app, "DifeDatabaseStack", {
    vpc: networkingStack.vpc,
});

const storageStack = new StorageStack(app, "DifeStorageStack");

const applicationStack = new ApplicationStack(app, "DifeApplicationStack", {
    vpc: networkingStack.vpc,
});

const pipelineStack = new PipelineStack(app, "DifePipelineStack");
