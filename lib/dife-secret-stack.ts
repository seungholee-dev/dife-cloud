import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface SecretStackProps {}

export class SecretStack extends Stack {
	constructor(scope: Construct, id: string, props: SecretStackProps) {
		super(scope, id, props);
		// ACTION: NEED TO ADD SECRET
		new Secret(this, "DifeGoogleAppSecret", {
			secretName: "difegmailsecret",
			removalPolicy: RemovalPolicy.RETAIN,
		});

		new Secret(this, "DifeJWTSecret", {
			secretName: "difejwtsecret",
			generateSecretString: {
				excludeCharacters: '"@/\\',
				passwordLength: 32,
				secretStringTemplate: JSON.stringify({}),
				generateStringKey: "jwtSecret",
			},
			removalPolicy: RemovalPolicy.RETAIN,
		});

		// ACTION: NEED TO ADD SECRET
		new Secret(this, "DifeDeepLSecret", {
			secretName: "difedeeplsecret",
			removalPolicy: RemovalPolicy.RETAIN,
		});

		// ACTION: NEED TO ADD SECRET
		this.createParameter("dife-gmail", "tmp(change this)", "Google email");
	}
	private createParameter(name: string, value: string, description: string) {
		new StringParameter(this, name, {
			parameterName: name,
			stringValue: value,
			description,
		}).applyRemovalPolicy(RemovalPolicy.RETAIN);
	}
}
