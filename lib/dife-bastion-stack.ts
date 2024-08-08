import { StackProps } from "aws-cdk-lib";
import {
	Instance,
	InstanceClass,
	InstanceSize,
	Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Stack, CfnOutput } from "aws-cdk-lib";
import {
	InstanceType,
	SubnetType,
	MachineImage,
	SecurityGroup,
} from "aws-cdk-lib/aws-ec2";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

interface BastionStackProps extends StackProps {
	vpc: Vpc;
}

export class BastionStack extends Stack {
	public readonly bastionServerSecurityGroup: SecurityGroup;
	public readonly bastionServer: Instance;

	constructor(scope: Construct, id: string, props: BastionStackProps) {
		super(scope, id, props);

		const vpc = props.vpc;

		const bastionSG = new SecurityGroup(this, "DifeBastionSG", {
			vpc,
			securityGroupName: "dife-bastion-sg",
			description: "Security Group for the bastion host",
		});

		const bastionRole = new Role(this, "DifeBastionRole", {
			roleName: "dife-bastion-role",
			assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
			managedPolicies: [
				ManagedPolicy.fromAwsManagedPolicyName(
					"AmazonSSMManagedInstanceCore",
				),
				ManagedPolicy.fromAwsManagedPolicyName(
					"AmazonRDSDataFullAccess",
				),
			],
		});

		const bastionInstance = new Instance(this, "DifeBastionEC2", {
			instanceName: "dife-bastion",
			instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.NANO),
			machineImage: MachineImage.latestAmazonLinux2(),
			securityGroup: bastionSG,
			vpc,
			vpcSubnets: {
				subnetType: SubnetType.PUBLIC,
			},
			role: bastionRole,
		});

		this.bastionServerSecurityGroup = bastionSG;
		this.bastionServer = bastionInstance;

		new CfnOutput(this, "SSMSessionStartCommand", {
			value: `aws ssm start-session --target ${bastionInstance.instanceId}`,
			description:
				"Run this command to start an SSM session to the bastion host",
		});
		new CfnOutput(this, "SSMSessionRDSStartCommand", {
			value: `aws ssm start-session --target ${bastionInstance.instanceId} --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{"host": ["<YOUR_RDS_ENDPOINT>"], "portNumber":["3306"], "localPortNumber":["<YOUR_ANY_EMPTY_LOCAL_PORT>"]}'`,
			description:
				"Run this command to start an SSM session to the RDS through bastion host",
		});
	}
}
