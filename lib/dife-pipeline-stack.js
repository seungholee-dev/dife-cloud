const { Stack } = require("aws-cdk-lib");
const { Repository } = require("aws-cdk-lib/aws-ecr");

class PipelineStack extends Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        const repository = new Repository(this, "DifeECR", {
            repositoryName: "dife-ecr",
        });
    }
}
module.exports = { PipelineStack };
