import { StackProps } from "aws-cdk-lib";
import {
	CfnEIP,
	CfnEIPAssociation,
	CfnRoute,
	ISubnet,
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

interface NatStackProps extends StackProps {
	vpc: Vpc;
}

export class NatStack extends Stack {
	public readonly natSecurityGroup: SecurityGroup;

	constructor(scope: Construct, id: string, props: NatStackProps) {
		super(scope, id, props);

		const vpc = props.vpc;

		const natSG = new SecurityGroup(this, "DifeNATSG", {
			vpc,
			securityGroupName: "dife-nat-instance-sg",
			description: "Security Group for the NAT instance",
		});

		const natRole = new Role(this, "DifeNATRole", {
			roleName: "dife-nat-role",
			assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
			managedPolicies: [
				ManagedPolicy.fromAwsManagedPolicyName(
					"AmazonSSMManagedInstanceCore",
				),
			],
		});

		const natInstance = new Instance(this, "DifeNatInstance", {
			instanceName: "dife-nat-instance",
			role: natRole,
			instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.NANO),
			machineImage: MachineImage.latestAmazonLinux2(),
			securityGroup: natSG,
			sourceDestCheck: false,
			vpc,
			vpcSubnets: {
				subnetType: SubnetType.PUBLIC,
			},
		});

		natInstance.addUserData(
			"sudo yum install -y iptables-services",
			"sudo systemctl enable iptables",
			"sudo systemctl start iptables",
			'echo "net.ipv4.ip_forward=1" | sudo tee /etc/sysctl.d/custom-ip-forwarding.conf',
			"sudo sysctl -p /etc/sysctl.d/custom-ip-forwarding.conf",
			"sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE",
			"sudo iptables -F FORWARD",
			"sudo service iptables save",
		);

		const eIP = new CfnEIP(this, "NatInstanceEIP");

		const eIPAssociation = new CfnEIPAssociation(
			this,
			"NatEIPAssociation",
			{
				instanceId: natInstance.instanceId,
				allocationId: eIP.attrAllocationId,
			},
		);

		this.natSecurityGroup = natSG;

		vpc.selectSubnets({
			subnetType: SubnetType.PRIVATE_WITH_EGRESS,
		}).subnets.forEach((subnet: ISubnet, index: number) => {
			const routeTable = subnet.routeTable;
			const route = new CfnRoute(this, `NatRoute${index}`, {
				destinationCidrBlock: "0.0.0.0/0",
				routeTableId: routeTable.routeTableId,
				instanceId: natInstance.instanceId,
			});
			route.addDependency(eIPAssociation);
		});

		new CfnOutput(this, "SSMSessionStartCommand", {
			value: `aws ssm start-session --target ${natInstance.instanceId}`,
			description:
				"Run this command to start an SSM session to the NAT Instance",
		});
	}
}
