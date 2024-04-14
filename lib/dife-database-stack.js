const {
    DatabaseInstance,
    DatabaseInstanceEngine,
    MysqlEngineVersion,
} = require("aws-cdk-lib/aws-rds");
const { Stack } = require("aws-cdk-lib");
const {
    InstanceType,
    InstanceClass,
    InstanceSize,
    SubnetType,
    MachineImage,
    Peer,
    Port,
    SecurityGroup,
    Instance,
} = require("aws-cdk-lib/aws-ec2");

class DatabaseStack extends Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        const vpc = props.vpc;

        const bastionSG = new SecurityGroup(this, "DifeBastionSG", {
            vpc,
            description: "Security Group for the bastion host",
            allowAllOutbound: true,
        });

        bastionSG.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(22),
            "Allow SSH access from anywhere"
        );

        const bastion = new Instance(this, "DifeBastionEC2", {
            instanceType: new InstanceType("t3.micro"),
            machineImage: MachineImage.latestAmazonLinux2(),
            securityGroup: bastionSG,
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PUBLIC,
            },
        });

        const rdsInstance = new DatabaseInstance(this, "DifeRDS", {
            engine: DatabaseInstanceEngine.mysql({
                version: MysqlEngineVersion.VER_8_0,
            }),
            instanceIdentifier: "dife-rds",
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_ISOLATED,
            },
            deletionProtection: true,
        });

        rdsInstance.connections.allowFrom(
            bastionSG,
            Port.tcp(3306),
            "Allow MySQL access from bastion host"
        );

        this.rdsInstance = rdsInstance;
    }
}
module.exports = { DatabaseStack };
