import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { CfnSubnetGroup, CfnCacheCluster } from "aws-cdk-lib/aws-elasticache";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface RedisStackProps extends StackProps {
	vpc: Vpc;
	ecsServiceSecurityGroup: SecurityGroup;
}

export class RedisStack extends Stack {
	constructor(scope: Construct, id: string, props: RedisStackProps) {
		super(scope, id, props);

		const vpc = props.vpc;
		const ecsServiceSecurityGroup = props.ecsServiceSecurityGroup;

		const securityGroup = new SecurityGroup(this, "RedisSecurityGroup", {
			vpc,
			securityGroupName: "dife-redis-sg",
			description: "Allow redis access",
			allowAllOutbound: true,
		});

		securityGroup.addIngressRule(
			ecsServiceSecurityGroup,
			Port.tcp(6379),
			"Allow redis access only from application servers",
		);

		const subnetGroup = new CfnSubnetGroup(this, "RedisSubnetGroup", {
			description: "Subnet group for Redis cluster",
			subnetIds: vpc.selectSubnets({
				subnetType: SubnetType.PRIVATE_ISOLATED,
			}).subnetIds,
		});

		const redisCluster = new CfnCacheCluster(this, "MyRedisCluster", {
			cacheNodeType: "cache.t3.micro",
			engine: "redis",
			numCacheNodes: 1,
			clusterName: "dife-redis-cluster",
			vpcSecurityGroupIds: [securityGroup.securityGroupId],
			cacheSubnetGroupName: subnetGroup.ref,
		});

		this.createParameter(
			"dife-redis-host",
			redisCluster.attrRedisEndpointAddress,
			"Redis host",
		);
		this.createParameter(
			"dife-redis-port",
			redisCluster.attrRedisEndpointPort,
			"Redis port",
		);
	}
	private createParameter(name: string, value: string, description: string) {
		new StringParameter(this, name, {
			parameterName: name,
			stringValue: value,
			description,
		}).applyRemovalPolicy(RemovalPolicy.DESTROY);
	}
}
