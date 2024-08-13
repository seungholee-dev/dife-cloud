import {
	DatabaseInstance,
	DatabaseInstanceEngine,
	MysqlEngineVersion,
	Credentials,
	SubnetGroup,
} from "aws-cdk-lib/aws-rds";
import { Stack, RemovalPolicy, Duration, StackProps } from "aws-cdk-lib";
import {
	InstanceType,
	InstanceClass,
	InstanceSize,
	SubnetType,
	Port,
	Vpc,
	SecurityGroup,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

interface DatabaseStackProps extends StackProps {
	vpc: Vpc;
	bastionServerSecurityGroup: SecurityGroup;
	ecsServiceSecurityGroup: SecurityGroup;
}

export class DatabaseStack extends Stack {
	public readonly rdsInstance: DatabaseInstance;

	constructor(scope: Construct, id: string, props: DatabaseStackProps) {
		super(scope, id, props);

		const vpc = props.vpc;
		const bastionServerSecurityGroup = props.bastionServerSecurityGroup;
		const ecsServiceSecurityGroup = props.ecsServiceSecurityGroup;

		const dbUsername = "admin";

		const dbSecret = new Secret(this, "DifeDBSecret", {
			secretName: "difedbsecret",
			generateSecretString: {
				secretStringTemplate: JSON.stringify({
					username: dbUsername,
				}),
				includeSpace: false,
				excludePunctuation: true,
				generateStringKey: "password",
			},
			removalPolicy: RemovalPolicy.DESTROY,
		});

		const rdsSecurityGroup = new SecurityGroup(this, "DifeRDSSG", {
			vpc,
			securityGroupName: "dife-rds-sg",
			description: "Security Group for the RDS instance",
			allowAllOutbound: true,
		});

		const rdsSubnetGroup = new SubnetGroup(this, "DifeRDSSubnetGroup", {
			vpc,
			description: "Subnet group for RDS instance",
			vpcSubnets: {
				subnetType: SubnetType.PRIVATE_ISOLATED,
			},
		});

		const databaseName = "dife_prod";

		const rdsInstance = new DatabaseInstance(this, "DifeRDS", {
			engine: DatabaseInstanceEngine.mysql({
				version: MysqlEngineVersion.VER_8_0,
			}),
			databaseName,
			removalPolicy: RemovalPolicy.SNAPSHOT,
			instanceIdentifier: "dife-rds",
			instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
			securityGroups: [rdsSecurityGroup],
			allocatedStorage: 20,
			vpc,
			vpcSubnets: {
				subnetType: SubnetType.PRIVATE_ISOLATED,
			},
			backupRetention: Duration.days(7),
			credentials: Credentials.fromSecret(dbSecret),
			subnetGroup: rdsSubnetGroup,
			deletionProtection: true,
			maxAllocatedStorage: 40,
		});

		rdsSecurityGroup.addIngressRule(
			bastionServerSecurityGroup,
			Port.tcp(3306),
			"Allow MySQL access from bastion host",
		);

		rdsSecurityGroup.addIngressRule(
			ecsServiceSecurityGroup,
			Port.tcp(3306),
			"allow mysql access from ecs tasks",
		);

		this.rdsInstance = rdsInstance;
	}
}
