const { Stack, Tags } = require("aws-cdk-lib");
const {
    Instance,
    InstanceType,
    MachineImage,
    SecurityGroup,
    Peer,
    Port,
    SubnetType,
    UserData,
} = require("aws-cdk-lib/aws-ec2");

class ApplicationStack extends Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        const vpc = props.vpc;

        const securityGroup = new SecurityGroup(this, "ApiSG", {
            vpc,
            description: "Allow ssh access to ec2 instances from anywhere",
            allowAllOutbound: true,
        });

        securityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(8080),
            "Allow 8080 access"
        );

        securityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(22),
            "Allow SSH access"
        );

        const userData = UserData.forLinux();

        userData.addCommands(
            "sudo yum update -y",
            "sudo amazon-linux-extras install docker -y",
            "sudo service docker start",
            "sudo usermod -a -G docker ec2-user",
            'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"',
            "unzip awscliv2.zip",
            "sudo ./aws/install",
            "sudo systemctl enable docker"
        );

        const instance = new Instance(this, "DifeApplicationInstance", {
            instanceName: "DifeApplicationEC2",
            vpc,
            instanceType: new InstanceType("t3.micro"),
            machineImage: MachineImage.latestAmazonLinux2(),
            securityGroup,
            userData,
            vpcSubnets: {
                subnetType: SubnetType.PUBLIC,
            },
        });

        Tags.of(instance).add("env", "prod");
    }
}

module.exports = { ApplicationStack };
