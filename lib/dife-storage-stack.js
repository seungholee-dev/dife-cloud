const { RemovalPolicy, Stack } = require("aws-cdk-lib");
const { Bucket } = require("aws-cdk-lib/aws-s3");

class StorageStack extends Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        const bucket = new Bucket(this, "DifeBucket", {
            removalPolicy: RemovalPolicy.RETAIN,
            bucketName: "dife-bucket",
        });
    }
}
module.exports = { StorageStack };
