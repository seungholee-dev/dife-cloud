#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/dife-network-stack";
import { DatabaseStack } from "../lib/dife-database-stack";
import { StorageStack } from "../lib/dife-storage-stack";
import { ApplicationStack } from "../lib/dife-application-stack";
import { PipelineStack } from "../lib/dife-pipeline-stack";
import { RedisStack } from "../lib/dife-redis-stack";
import { BastionStack } from "../lib/dife-bastion-stack";
import { SecretStack } from "../lib/dife-secret-stack";
import { NatStack } from "../lib/dife-nat-stack";
import { DomainStack } from "../lib/dife-domain-stack";

const app = new cdk.App();

const networkingStack = new NetworkStack(app, "DifeNetworkStack", {});

const natStack = new NatStack(app, "DifeNatStack", {
	vpc: networkingStack.vpc,
});

const bastionStack = new BastionStack(app, "DifeBastionStack", {
	vpc: networkingStack.vpc,
});

const applicationStack = new ApplicationStack(app, "DifeApplicationStack", {
	vpc: networkingStack.vpc,
	natSecurityGroup: natStack.natSecurityGroup,
});

new DomainStack(app, "DifeDomainStack", {
	alb: applicationStack.alb,
});

new DatabaseStack(app, "DifeDatabaseStack", {
	vpc: networkingStack.vpc,
	bastionServerSecurityGroup: bastionStack.bastionServerSecurityGroup,
	ecsServiceSecurityGroup: applicationStack.ecsServiceSecurityGroup,
});

new StorageStack(app, "DifeStorageStack", {});

new PipelineStack(app, "DifePipelineStack", {});

new RedisStack(app, "DifeRedisStack", {
	vpc: networkingStack.vpc,
	ecsServiceSecurityGroup: applicationStack.ecsServiceSecurityGroup,
});

new SecretStack(app, "DifeSecretStack", {});
