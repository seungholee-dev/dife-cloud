import "dotenv/config";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
	ARecord,
	PublicHostedZone,
	RecordTarget,
} from "aws-cdk-lib/aws-route53";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import {
	CachePolicy,
	Distribution,
	OriginRequestPolicy,
	ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import {
	LoadBalancerV2Origin,
	S3Origin,
} from "aws-cdk-lib/aws-cloudfront-origins";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { Bucket } from "aws-cdk-lib/aws-s3";

interface DomainStackProps extends StackProps {
	alb: ApplicationLoadBalancer;
}

export class DomainStack extends Stack {
	constructor(scope: Construct, id: string, props: DomainStackProps) {
		super(scope, id, props);

		const alb = props.alb;

		const DOMAIN_NAME: string = process.env.DOMAIN_NAME || "";

		// ACTION: NEED TO ADD THIS HOSTED ZONE's NS TO THE NAMESERVERS OF THE DOMAIN REGISTRAR(AWS)
		const hostedZone = new PublicHostedZone(this, "DifeHostedZone", {
			zoneName: DOMAIN_NAME,
		});

		// BEFORE RUNNING BELOW CODE, FOLLOW THESE STEPS:
		// ACTION: 1. CREATE A CERTIFICATE IN THE US-EAST-1 REGION EXCLUSIVELY FOR CLOUDFRONT (SEPARATE FROM THE ALB CERTIFICATE)
		// ACTION: 2. NEED TO MANUALLY GET CERTIFICATE_ARN(NEED MANUAL CREATION) AND SET AS ENV
		const CLOUDFRONT_CERTIFICATE_ARN: string =
			process.env.CLOUDFRONT_CERTIFICATE_ARN || "";

		const certificate = Certificate.fromCertificateArn(
			this,
			"DifeLandingPageCertificate",
			CLOUDFRONT_CERTIFICATE_ARN,
		);

		const bucket = new Bucket(this, "DifeLandingPageBucket", {
			websiteIndexDocument: "index.html",
			bucketName: "dife-landing-page-bucket",
			removalPolicy: RemovalPolicy.RETAIN,
			publicReadAccess: true,
			blockPublicAccess: {
				blockPublicAcls: false,
				blockPublicPolicy: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false,
			},
		});

		const albOrigin = new LoadBalancerV2Origin(alb);

		const distribution = new Distribution(
			this,
			"DifeLandingPageDistribution",
			{
				defaultBehavior: {
					origin: new S3Origin(bucket),
					viewerProtocolPolicy:
						ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				},
				additionalBehaviors: {
					"/api/*": {
						origin: albOrigin,
						viewerProtocolPolicy:
							ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
						originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
						allowedMethods: {
							methods: [
								"GET",
								"HEAD",
								"OPTIONS",
								"PUT",
								"POST",
								"PATCH",
								"DELETE",
							],
						},
					},
					"/ws": {
						origin: albOrigin,
						viewerProtocolPolicy:
							ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
						originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
						allowedMethods: {
							methods: ["HEAD", "GET"],
						},
						cachePolicy: CachePolicy.CACHING_DISABLED,
					},
					"/health": {
						origin: albOrigin,
						viewerProtocolPolicy:
							ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
						originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
						allowedMethods: {
							methods: ["HEAD", "GET"],
						},
					},
				},
				defaultRootObject: "index.html",
				domainNames: [DOMAIN_NAME],
				certificate,
			},
		);

		new ARecord(this, "DifeARecord", {
			zone: hostedZone,
			target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
		});
	}
}
