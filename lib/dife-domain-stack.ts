import "dotenv/config";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
	ARecord,
	PublicHostedZone,
	RecordTarget,
} from "aws-cdk-lib/aws-route53";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";

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

		new ARecord(this, "DifeARecord", {
			zone: hostedZone,
			target: RecordTarget.fromAlias(new LoadBalancerTarget(alb)),
		});
	}
}
