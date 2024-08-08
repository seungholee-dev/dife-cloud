import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface StorageStackProps {}

export class StorageStack extends Stack {
	constructor(scope: Construct, id: string, props: StorageStackProps) {
		super(scope, id, props);

		const bucket = new Bucket(this, "DifeBucket", {
			removalPolicy: RemovalPolicy.RETAIN,
			bucketName: "dife-bucket",
		});

		new Bucket(this, "DifeLogsBucket", {
			removalPolicy: RemovalPolicy.RETAIN,
			bucketName: "dife-logs-bucket",
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
