---
title: 'Supabase incident on February 12, 2026'
description: 'A detailed account of the February 12 outage in us-east-2, what caused it, and the steps we are taking to prevent it from happening again.'
author: paul_copplestone
imgSocial: 2026-02-12-supabase-incident/og.png
imgThumb: 2026-02-12-supabase-incident/thumb.png
categories:
  - product
date: '2026-02-13'
---

On February 12, 2026, at 21:12 UTC, Supabase experienced a major outage affecting all services in the `us-east-2` (Ohio) region. The outage lasted 3 hours and 42 minutes, with full service recovery at 00:54 UTC on February 13.

During this period, customers with projects in `us-east-2` were unable to access their Postgres databases, Auth, Data APIs, Edge Functions, Storage, Realtime, and any other Supabase service in that region.

I am sorry for the impact this caused. We know you depend on Supabase to be reliable. We let you down. This post is a transparent account of what happened, how it happened, and the concrete steps we are taking to make sure it does not happen again.

## Summary

We deployed a new internal monitoring service on February 12th that inadvertently enabled AWS's VPC Block Public Access feature at the regional level in `us-east-2`. This blocked all internet gateway traffic across every VPC in the region.

We resolved the outage by rolling back the deployment, which removed the regional block and restored normal network connectivity. This was not caused by an external attack or an AWS service disruption. It was a configuration error stemming from insufficient guardrails in our infrastructure deployment pipeline.

## Who was affected

All Supabase customers with projects hosted in the `us-east-2` region were affected. This includes dashboard operations, database connections, Auth, Storage, Realtime, Authentication, and any other service that relied upon the project’s database. Connections via VPC peering and private networking were not affected, as these do not traverse internet gateways.

## What is VPC Block Public Access, and why was it so destructive?

AWS [VPC Block Public Access](https://docs.aws.amazon.com/vpc/latest/userguide/security-vpc-bpa.html) (BPA) is a security feature designed for compliance-sensitive environments where organizations need to guarantee that no resource can accidentally be exposed to the internet. When enabled, it blocks all traffic flowing through all internet gateways in a region, unless specific subnets are explicitly excluded.

When the new monitoring service was deployed to a pre-existing account, it used a shared construct that created a BPA in `block-bidirectional` mode, blocking all external traffic for production VPCs within the account.

Traffic to external VPCs as well as traffic through VPC peering, VPN connections, Direct Connect, and AWS PrivateLink was unaffected.

## Why did resolution take 3 hours and 42 minutes?

Resolution took an unacceptably long time due to several factors diverting the response team’s attention away from what we ultimately determined to be the root cause.

**The outage triggered alarms on shared services in a different region.** The investigation initially focused on these services as potential causal factors, when it turned out that their failures were symptoms of network connectivity loss in the `us-east-2` region.

**The deployment contained additional networking changes**. The `ModifyVpcBlockPublicAccessOptions` event appeared as a single line item in the CloudTrail logs, and did not immediately jump out at the response team. Other networking changes in the same deployment were more complex and prominent in the logs, drawing investigative attention away from the actual issue.

**Our pre-production environment did not make use of the us-east-2 region in AWS.** The monitoring stack had been deployed to a pre-production environment for a week prior without surfacing any issues. However, that pre-production environment did not match our production environment, so the regional BPA had no visible impact there.

**We did not have representation from the right infrastructure teams at the start of the incident.** This incident initially manifested in our monitoring and alerting as an API outage, but turned out to be a much wider issue caused by the loss of network connectivity. Had we had the right infrastructure teams involved in the response from the outset, we would have made the connection between the outage and the deployment sooner. Once the relevant infrastructure team was paged, we were able to establish that link by correlating timestamps of the incident and the deployment.

## What we are doing about it

We have organized our response into three categories: immediate actions already completed, near-term safeguards, and structural changes to prevent this class of issue.

### Already completed

We have audited every region where Supabase operates to confirm VPC Block Public Access is not enabled. We have confirmed that no IAC stacks contain `VpcBlockPublicAccessOptions` resources.

We have deployed AWS Organizations Service Control Policies (SCPs) across both our pre-production and production organizations to prevent `VpcBlockPublicAccessOptions` and other account/region-scoped resources from being modified outside of a dedicated, controlled pipeline.

### Near-term safeguards

**Guardrails.** We are implementing a blocklist of resource types within our Infrastructure-as-Code to ensure that they cannot be provisioned automatically or manually.

**Access controls.** We are improving access control for internal monitoring so that all engineers can inspect infrastructure audit logs during incidents without requiring escalation.

### Structural changes

**Account isolation.** All non-customer-facing services will be deployed in separate AWS accounts, isolated from production infrastructure. This ensures that configuration changes in auxiliary services cannot affect production.

**External connectivity probes.** We are adding continuous external health checks for network connectivity in ever production region, probing endpoints from outside our network to detect complete connectivity loss within seconds.

**Full parity between production and pre-production environments.** Our pre-production checks covered fewer regions than production. We will expand our pre-production environments to include all supported production regions.

**Faster incident coordination.** We are implementing more aggressive automated triggers and establishing clearer escalation paths that include the right infrastructure teams from the start.

**Cross-region resilience via Multigres.** Today, Supabase does not offer automatic cross-region failover for customer Postgres databases. Multigres will enable a cross-region failover workflow in the future for customers whose workloads can accept the added latency. In the near-term, we will publish guidance on failover strategies and multi-region architecture patterns for customers who require multi-region availability.

## Communication challenges

Our communication was insufficient and at times misleading. We are taking this as an opportunity to overhaul our approach to customer communication during incidents.

**First, we did not announce the incident quickly enough.** While the team did update the [status page](https://status.supabase.com/incidents/pqrf96m6fzxk) systematically during the incident, we were slow to communicate at the start of the incident. Customers noticed the issue and reported it before we posted anything publicly. That should never happen. Improvements to our monitoring and alerting will enable us to detect incidents faster, and we will ensure that the status page is updated upon detection.

**Second, the Supabase dashboard banner never appeared during the incident.** This was due to a change we made earlier in the week to eliminate noisy updates that were not relevant to the customer’s project. We are rebuilding our notifications system with a more robust approach that integrates banner alerts directly into the incident management flow, ensuring customers always see dashboard notifications during major incidents.

**Third, the status page did not indicate component-level degradation correctly.** The uptime calculation on the status page is derived from individual service components being marked as degraded, and we failed to update component-level statuses quickly enough during investigation.

**Fourth, we should have updated the status page more frequently and with more context.** We should have made the precise customer impact clearer. And even when we had no new technical findings to report, we should have clearly stated that we were still investigating and when the next update would be posted.

**Finally, social media updates went out too late.** We did not post about the incident on our official channels until hours after the incident began, and a previously-scheduled, unrelated post went out in the meantime. This came across as insensitive and irresponsible. We are including social media communication as part of our incident response playbook going forward and will treat it as a first-class tool for communicating with our customers.

## Conclusion

This outage was caused by a deployment that enabled a regional AWS networking feature without accounting for its full scope. Our deployment pipeline did not have guardrails to catch this, and our pre-production environment did not surface the impact due to a lack of full parity with production.

We are closing the gaps that allowed this to happen: isolating auxiliary services into separate AWS accounts, preventing region-scoped changes from application stacks, adding external connectivity monitoring, and improving our incident detection, response times, and communication. We will continue to share updates as we implement these changes.

We are grateful to every customer who reported issues, waited patiently, and provided feedback on how we can improve. If you have questions about this incident or how it may have affected your project, please reach out to our support team.

## Timeline

| Time (UTC)     | Status                        | Description                                                                                                                                                                                                                                                                                              |
| -------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21:12          | Impact starts                 | A deployment of the monitoring stack creates a `VpcBlockPublicAccessOptions` resource set to `block-bidirectional` mode. This immediately blocks all internet gateway traffic across the entire `us-east-2` region. ALB request counts drop to effectively zero.                                         |
| 21:13          | Full regional outage          | The deployment continues creating VPC resources, subnets, and networking configuration for the monitoring service. At 21:15, two BPA exclusions are created but only for the monitoring service's own subnets. Production VPCs (20+ active subnets) receive no exclusions and remain completely blocked. |
| 21:17          | Cascading failures begin      | Internal workloads requiring AWS APIs begin to fail due to the loss of network connectivity.                                                                                                                                                                                                             |
| 21:26          | Incident detected             | Internal alerting fires and an incident channel is created. Initial investigation focuses on AWS networking, as complete loss of regional internet connectivity is consistent with an upstream provider issue.                                                                                           |
| 21:32          | Incident created              | Incident created on our external status page.                                                                                                                                                                                                                                                            |
| 22:14          | Investigation continues       | Engineers continue diagnosing elevated Management API errors, service orchestration failures, and connection timeouts in the region. Global services like the Management API are scaled up in other regions to handle traffic being redirected away from `us-east-2`                                     |
| 23:11          | AWS engaged                   | Supabase opens an AWS support case. AWS confirms no issues on their side and requests network diagnostics from affected instances.                                                                                                                                                                       |
| 23:27          | Investigation scope increases | Investigation broadens to include CloudTrail audit logs and IaC deployment history.                                                                                                                                                                                                                      |
| 00:25 (Feb 13) | Correlation identified        | Timestamps of new network resource creation in `us-east-2` are found to coincide exactly with the start of the outage. A new VPC and associated resources were deployed at 21:12, the precise moment traffic stopped.                                                                                    |
| 00:39          | Root cause identified         | The monitoring stack deployed to `us-east-2` is confirmed as the cause. The team verifies it is a non-critical resource safe to remove.                                                                                                                                                                  |
| 00:50          | Mitigation begins             | Destruction of the monitoring stack is initiated, removing its VPC, BPA configuration, and all associated resources.                                                                                                                                                                                     |
| 00:57          | Services restored             | API error rates across all regions return to nominal levels. ALB request counts in `us-east-2` return to normal baselines.                                                                                                                                                                               |
| 01:53          | Incident resolved             | The external status page is marked resolved. All services confirmed stable.                                                                                                                                                                                                                              |

### Supporting graphs

ALB request count in `us-east-2`

![ALB request counts in us-east-2 dropped to zero during the incident.](/images/blog/2026-02-12-supabase-incident/alb-request-count.png)

_Request counts dropped to zero for nearly all ALBs in `us-east-2` during the incident period, showing blocked access to platform services located in the region._

### VPC NAT gateway inbound traffic in `us-east-2`

![VPC NAT gateway inbound traffic in us-east-2 dropped to zero during the incident.](/images/blog/2026-02-12-supabase-incident/vpc-nat-gateway.png)

_Inbound traffic dropped to zero for all public NAT gateways during the incident period, showing blocked access to project databases and other services._
