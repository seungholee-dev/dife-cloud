import { RemovalPolicy, Stack } from "aws-cdk-lib";
import {
	BlockPublicAccess,
	Bucket,
	BucketEncryption,
	RedirectProtocol,
} from "aws-cdk-lib/aws-s3";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface StorageStackProps {}

export class StorageStack extends Stack {
	constructor(scope: Construct, id: string, props: StorageStackProps) {
		super(scope, id, props);

		const bucket = new Bucket(this, "DifeBucket", {
			versioned: true,
			removalPolicy: RemovalPolicy.RETAIN,
			bucketName: "dife-bucket",
			encryption: BucketEncryption.S3_MANAGED,
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
		});

		new Bucket(this, "DifeLogsBucket", {
			versioned: true,
			removalPolicy: RemovalPolicy.RETAIN,
			bucketName: "dife-logs-bucket",
			encryption: BucketEncryption.S3_MANAGED,
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
		});

		// ACTION FOR QR: NEED QR A record
		// ACTION FOR QR: Needs ACM for Subdomain if not needed.
		new Bucket(this, "QRRedirectBucket", {
			bucketName: "qr.difeapp.com",
			websiteRedirect: {
				hostName: "www.naver.com",
				protocol: RedirectProtocol.HTTPS,
			},
			removalPolicy: RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});

		this.createParameter(
			"dife-bucket-name",
			bucket.bucketName,
			"S3 bucket name",
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
