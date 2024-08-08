import { Stack } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

interface PipelineStackProps {}

export class PipelineStack extends Stack {
	constructor(scope: Construct, id: string, props: PipelineStackProps) {
		super(scope, id, props);

		new Repository(this, "DifeECR", {
			repositoryName: "dife-ecr",
		});
	}
}
