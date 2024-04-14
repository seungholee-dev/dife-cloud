const { Vpc, SubnetType } = require("aws-cdk-lib/aws-ec2");
const { Stack } = require("aws-cdk-lib");

class NetworkStack extends Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        const vpc = new Vpc(this, "DifeCloudVPC", {
            maxAzs: 2,
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
            ],
            vpcName: "dife-vpc",
        });

        this.vpc = vpc;
    }
}
module.exports = { NetworkStack };
