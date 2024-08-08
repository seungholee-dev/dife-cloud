import "dotenv/config";
import {
	Stack,
	Tags,
	CfnOutput,
	StackProps,
	RemovalPolicy,
	Duration,
} from "aws-cdk-lib";
import { AutoScalingGroup, UpdatePolicy } from "aws-cdk-lib/aws-autoscaling";
import {
	InstanceType,
	SecurityGroup,
	Peer,
	Port,
	InstanceClass,
	InstanceSize,
	SubnetType,
	Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
	Cluster,
	AsgCapacityProvider,
	Ec2TaskDefinition,
	ContainerImage,
	Ec2Service,
	EcsOptimizedImage,
	NetworkMode,
	ContainerDefinitionOptions,
	LogDriver,
	Secret as ECSSecretManager,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Role, ServicePrincipal, ManagedPolicy } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

interface ApplicationStackProps extends StackProps {
	vpc: Vpc;
}

export class ApplicationStack extends Stack {
	ecsServiceSecurityGroup: SecurityGroup;

	constructor(scope: Construct, id: string, props: ApplicationStackProps) {
		super(scope, id, props);

		const vpc = props.vpc;

		const cluster = new Cluster(this, "DifeCluster", {
			vpc,
			clusterName: "dife-cluster",
		});

		const ecsServiceSg = new SecurityGroup(this, "ecsServiceSg", {
			vpc,
			securityGroupName: "dife-ecs-service-sg",
			allowAllOutbound: true,
		});

		const instanceRole = new Role(this, "InstanceRole", {
			roleName: "api-server-ec2-role",
			assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
			managedPolicies: [
				ManagedPolicy.fromAwsManagedPolicyName(
					"service-role/AmazonEC2ContainerServiceforEC2Role",
				),
				ManagedPolicy.fromAwsManagedPolicyName(
					"AmazonSSMManagedInstanceCore",
				),
			],
		});

		const asg = new AutoScalingGroup(this, "DifeApplicationServer", {
			vpc,
			vpcSubnets: { subnetType: SubnetType.PUBLIC },
			role: instanceRole,
			autoScalingGroupName: "dife-asg",
			instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
			machineImage: EcsOptimizedImage.amazonLinux2(),
			minCapacity: 1,
			desiredCapacity: 1,
			maxCapacity: 2,
			updatePolicy: UpdatePolicy.rollingUpdate({
				maxBatchSize: 1,
			}),
			securityGroup: ecsServiceSg,
		});

		asg.scaleOnCpuUtilization("CpuScaling", {
			targetUtilizationPercent: 70,
		});

		Tags.of(asg).add("env", "prod");
		Tags.of(asg).add("Name", "dife-app-server");

		const capacityProvider = new AsgCapacityProvider(
			this,
			"DifeCapacityProvider",
			{
				capacityProviderName: "dife-capacity-provider",
				autoScalingGroup: asg,
				enableManagedTerminationProtection: false,
			},
		);

		cluster.addAsgCapacityProvider(capacityProvider);

		const taskRole = new Role(this, "TaskRole", {
			roleName: "dife-ecs-task-role",
			assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
			managedPolicies: [
				ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
			],
		});

		const executionRole = new Role(this, "ExecutionRole", {
			assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
			roleName: "dife-ecs-execution-role",
			managedPolicies: [
				ManagedPolicy.fromAwsManagedPolicyName(
					"service-role/AmazonECSTaskExecutionRolePolicy",
				),
				ManagedPolicy.fromAwsManagedPolicyName(
					"AmazonEC2ContainerRegistryReadOnly",
				),
			],
		});

		const taskDefinition = new Ec2TaskDefinition(this, "DifeAppTaskDef", {
			family: "dife-ecs-task-family",
			taskRole,
			executionRole,
			networkMode: NetworkMode.BRIDGE,
		});

		const ecrRepositoryUrl = process.env.ECR_REPOSITORY_URL ?? "";

		const ecsLogGroup = new LogGroup(this, "ECSLogGroup", {
			logGroupName: "/ecs/dife-app",
			removalPolicy: RemovalPolicy.DESTROY,
		});
		const jwtSecret = Secret.fromSecretNameV2(
			this,
			"DifeJWTSecret",
			"difejwtsecret",
		);
		const dbSecret = Secret.fromSecretNameV2(
			this,
			"DifeDBSecret",
			"difedbsecret",
		);
		const gmailAppPassword = Secret.fromSecretNameV2(
			this,
			"DifeGmailAppSecret",
			"difegmailsecret",
		);

		jwtSecret.grantRead(taskRole);
		dbSecret.grantRead(taskRole);
		gmailAppPassword.grantRead(taskRole);

		const redisHost = StringParameter.valueForStringParameter(
			this,
			"dife-redis-host",
		);
		const redisPort = StringParameter.valueForStringParameter(
			this,
			"dife-redis-port",
		);
		const gmail = StringParameter.valueForStringParameter(
			this,
			"dife-gmail",
		);
		const bucketName = StringParameter.valueForStringParameter(
			this,
			"dife-bucket-name",
		);

		const containerOptions: ContainerDefinitionOptions = {
			image: ContainerImage.fromRegistry(ecrRepositoryUrl),
			containerName: "dife-app-container",
			memoryReservationMiB: 1024,
			environment: {
				REDIS_HOST: redisHost,
				REDIS_PORT: redisPort,
				GOOGLE_EMAIL: gmail,
				AWS_S3_BUCKET_NAME: bucketName,
				AWS_REGION_CODE: this.region,
			},
			secrets: {
				JWT_SECRET: ECSSecretManager.fromSecretsManager(jwtSecret),
				DB_PASSWORD: ECSSecretManager.fromSecretsManager(
					dbSecret,
					"password",
				),
				DB_HOST: ECSSecretManager.fromSecretsManager(dbSecret, "host"),
				DB_NAME: ECSSecretManager.fromSecretsManager(
					dbSecret,
					"dbname",
				),
				DB_PORT: ECSSecretManager.fromSecretsManager(dbSecret, "port"),
				DB_USER: ECSSecretManager.fromSecretsManager(
					dbSecret,
					"username",
				),
				GOOGLE_APP_PASSWORD:
					ECSSecretManager.fromSecretsManager(gmailAppPassword),
			},
			portMappings: [{ containerPort: 8080, hostPort: 8080 }],
			logging: LogDriver.awsLogs({
				streamPrefix: "dife-app-container",
				logGroup: ecsLogGroup,
			}),
		};

		taskDefinition.addContainer("AppContainer", containerOptions);

		const ecsService = new Ec2Service(this, "DifeECSEC2Service", {
			serviceName: "dife-ecs-service",
			cluster,
			taskDefinition,
			circuitBreaker: { rollback: true },
			capacityProviderStrategies: [
				{
					capacityProvider: capacityProvider.capacityProviderName,
					weight: 1,
					base: 1,
				},
			],
		});

		const ecsScaling = ecsService.autoScaleTaskCount({
			minCapacity: 1,
			maxCapacity: 6,
		});

		ecsScaling.scaleOnCpuUtilization("CpuScaling", {
			targetUtilizationPercent: 80,
		});

		ecsScaling.scaleOnMemoryUtilization("MemoryScaling", {
			targetUtilizationPercent: 80,
		});

		const albSg = new SecurityGroup(this, "AlbSG", {
			vpc,
			securityGroupName: "dife-alb-sg",
			allowAllOutbound: true,
		});

		albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP access");

		const alb = new ApplicationLoadBalancer(this, "DifeALB", {
			vpc,
			loadBalancerName: "dife-alb",
			internetFacing: true,
			securityGroup: albSg,
			vpcSubnets: { subnetType: SubnetType.PUBLIC },
		});

		const listener = alb.addListener("Listener", {
			port: 80,
		});

		listener.addTargets("DifeECSTargets", {
			port: 80,
			targetGroupName: "dife-ecs-container-targets",
			targets: [
				ecsService.loadBalancerTarget({
					containerName: containerOptions.containerName ?? "",
					containerPort: 8080,
				}),
			],
			healthCheck: {
				path: "/health",
				interval: Duration.seconds(60),
			},
		});

		ecsServiceSg.addIngressRule(
			albSg,
			Port.tcp(8080),
			"Allow ALB access to ECS service",
		);

		Tags.of(cluster).add("env", "prod");

		this.ecsServiceSecurityGroup = ecsServiceSg;

		new CfnOutput(this, "ALBDNSName", {
			value: alb.loadBalancerDnsName,
			description: "ALB DNS Name",
		});
	}
}
