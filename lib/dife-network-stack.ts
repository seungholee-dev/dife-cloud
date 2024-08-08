import { Construct } from "constructs";
import { Vpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Stack } from "aws-cdk-lib";

interface NetworkStackProps {}

export class NetworkStack extends Stack {
	public readonly vpc: Vpc;

	constructor(scope: Construct, id: string, props: NetworkStackProps) {
		super(scope, id, props);

		const vpc = new Vpc(this, "DifeCloudVPC", {
			maxAzs: 2,
			natGateways: 0,
			subnetConfiguration: [
				{
					cidrMask: 24,
					name: "DifePublicSubnet",
					subnetType: SubnetType.PUBLIC,
				},
				{
					cidrMask: 24,
					name: "DifePrivateSubnet",
					subnetType: SubnetType.PRIVATE_ISOLATED,
				},
				{
					cidrMask: 24,
					name: "DifePrivateWithEgressSubnet",
					subnetType: SubnetType.PRIVATE_WITH_EGRESS,
				},
			],
			vpcName: "dife-vpc",
		});

		vpc.addFlowLog("FlowLog");
		this.vpc = vpc;
	}
}
