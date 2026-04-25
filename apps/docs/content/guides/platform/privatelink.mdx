---
id: 'privatelink'
title: 'PrivateLink'
description: 'Secure private network connectivity to your Supabase database using AWS VPC Lattice.'
---

<Admonition type="note">

PrivateLink is currently in beta and available only to Team and Enterprise customers.
Contact support if you would like to create a PrivateLink connection for a read-only replica.

</Admonition>

PrivateLink provides enterprise-grade private network connectivity between your AWS VPC and your Supabase database using AWS VPC Lattice. This eliminates exposure to the public internet by creating a secure, private connection that keeps your database traffic within the AWS network backbone.

By enabling PrivateLink, database connections never traverse the public internet, enabling the disablement of public facing connectivity and providing an additional layer of security and compliance for sensitive workloads. This infrastructure-level security feature helps organizations meet strict data governance requirements and reduces potential attack vectors.

## How PrivateLink works

Supabase PrivateLink is an organisation level configuration. It works by sharing a [VPC Lattice Resource Configuration](https://docs.aws.amazon.com/vpc-lattice/latest/ug/resource-configuration.html) to any number of AWS Accounts for each of your Supabase projects. Connectivity can be achieved by either associating the Resource Configuration to a PrivateLink endpoint, or a [VPC Lattice Service Network](https://docs.aws.amazon.com/vpc-lattice/latest/ug/service-networks.html). This means:

- Database traffic flows through private AWS infrastructure only
- Connection latency is typically reduced compared to public internet routing
- Network isolation provides enhanced security posture
- Attack surface is minimized by eliminating public exposure

The connection architecture changes from public internet routing to a dedicated private path through AWS's secure network backbone.

Supabase PrivateLink is currently just for direct database and PgBouncer connections only. It does not support other Supabase services like API, Storage, Auth, or Realtime. These services will continue to operate over public internet connections.

## Requirements

To use PrivateLink with your Supabase project:

- Team or Enterprise Supabase subscription
- AWS VPC in the same region as your Supabase project
- Appropriate permissions to accept Resource Shares, and create and manage endpoints

## Getting started

#### Step 1: Add AWS account

Navigate to your project's Integrations section to set up PrivateLink:

1. Go to your Supabase project dashboard
2. Navigate to [**Settings** > **Integrations**](/dashboard/project/_/settings/integrations)
3. Find the **AWS PrivateLink** section
4. Click **Add Account**
5. Enter your AWS Account ID
6. Provide a description for the account (recommended)
7. Click **Add Account** to submit

After submission, Supabase creates a VPC Lattice Resource Configuration for your project and sends an AWS Resource Share to the specified AWS Account ID. This process may take a few moments. Once complete, the account will show a "Ready" status, indicating that the resource share has been sent to your AWS account and is ready to be accepted.

#### Step 2: Accept resource share

Supabase will send you an AWS Resource Share containing the VPC Lattice Resource Configurations for your projects. To accept this share:

1. Login to your AWS Management Console, ensure you are in the AWS region where your Supabase project is located
2. Navigate to the AWS Resource Access Manager (RAM) console
   {/* supa-mdx-lint-disable-next-line Rule004ExcludeWords */}
3. Go to [Shared with me > Resource shares](https://console.aws.amazon.com/ram/home#SharedResourceShares)
4. Locate the resource share from Supabase.
   - The resource share has the format `sspl-[project_ref]-[random alphanumeric string]`
5. Click on the resource share name to view details. Review the list of resource shares - it should only include resources of type vpc-lattice:ResourceConfiguration.
6. Click **Accept resource share**
7. Confirm the acceptance in the dialog box

{/* supa-mdx-lint-disable-next-line Rule004ExcludeWords */}
After accepting, you'll see the resource configurations appear in your [Shared with me > Shared resources](https://console.aws.amazon.com/ram/home#SharedResources) section of the RAM console and the [PrivateLink and Lattice > Resource configurations](https://console.aws.amazon.com/vpcconsole/home#ResourceConfigs) section of the VPC console.

#### Step 3: Configure security groups

Ensure your security groups allow traffic on the appropriate ports:

1. Navigate to the [VPC console > Security Groups](https://console.aws.amazon.com/vpcconsole/home#SecurityGroups:)
2. Create a new security group for the endpoint or service network by clicking [Create security group](https://console.aws.amazon.com/vpcconsole/home#CreateSecurityGroup:)
3. Give your security group a descriptive name and select the appropriate VPC
4. Add an inbound rule for:
   - Type: Postgres (TCP, port 5432)
   - Destination that is appropriate for your network. i.e. the subnet of your VPC or security group of your application instances
5. Finish creating the security group by clicking **Create security group**

#### Step 4: Create connection

In your AWS account, you have two options to establish connectivity:

##### Option A: Create a PrivateLink endpoint

1. Navigate to the VPC console in your AWS account
2. Go to [Endpoints](https://console.aws.amazon.com/vpcconsole/home#Endpoints:) in the left sidebar
3. Click [Create endpoint](https://console.aws.amazon.com/vpcconsole/home#CreateVpcEndpoint:)
4. Give your endpoint a name (e.g. `supabase-privatelink-[project name]`)
5. Under Type, select **Resources**
6. In the **Resource configurations** section select the appropriate resource configuration
   - The resource configuration name will be in the format `[organisation]-[project-ref]-rc`
7. Select your VPC from the dropdown. This should match the VPC you selected for your security group in Step 3
8. Enable the **Enable DNS name** option if you want to use a DNS record instead of the endpoints IP address(es)
9. Choose the appropriate subnets for your network
   - AWS will provision a private ENI for you in each selected subnet
   - IP address type should be set to IPv4
10. Choose the security group you created in Step 3.
11. Click **Create endpoint**
12. After creation, you will see the endpoint in the [Endpoints](https://console.aws.amazon.com/vpcconsole/home#Endpoints:) section with a status of "Available"
13. For connectivity:
    - The IP addresses of the endpoint will be listed in the **Subnets** section of the endpoint details
    - The DNS record will be in the **Associations** section of the endpoint details in the **DNS Name** field if you enabled it in step 8

##### Option B: Attach resource configuration to an existing VPC lattice service network

1. **This method is only recommended if you have an existing VPC Lattice Service Network**
2. Navigate to the VPC Lattice console in your AWS account
3. Go to [Service networks](https://console.aws.amazon.com/vpcconsole/home#ServiceNetworks) in the left sidebar and select your service network
4. In the service network details, go to the **Resource configuration associations** tab
5. Click **Create associations**
6. Select the appropriate **Resource configuration** from the dropdown
7. Click **Save changes**
8. After creation, you will see the resource configuration in the Resource configurations section of your service network with the status "Active"
9. For connectivity, click on the association details and the domain name will be listed in the **DNS entries** section

#### Step 5: Test connectivity

Verify the private connection is working correctly from your VPC:

1. Launch an EC2 instance or use an existing instance within your VPC
2. Install a Postgres client (e.g., `psql`)
3. Test the connection using the private endpoint:

```bash
psql "postgresql://[username]:[password]@[private-endpoint]:5432/postgres"
```

You should see a successful connection without any public internet traffic.

#### Step 6: Update applications

Configure your applications to use the private connection details:

1. Update your database connection strings to use the private endpoint hostname
2. Ensure your application instances are in the same VPC or connected VPCs
3. Update any database connection pooling configurations
4. Test application connectivity thoroughly

Example connection string update:

```
# Before (public)
postgresql://user:pass@db.[project-ref].supabase.co:5432/postgres

# After (private)
postgresql://user:pass@your-private-endpoint.vpce.amazonaws.com:5432/postgres
```

#### Step 7: Disable public connectivity (optional)

For maximum security, you can disable public internet access for your database:

1. Contact Supabase support to disable public connectivity
2. Ensure all applications are successfully using the private connection
3. Update any monitoring or backup tools to use the private endpoint

## Beta limitations

During the beta phase:

- **Read Replicas**: To establish PrivateLink with a Read Replica, reach out to your account rep.
- **Feature Evolution**: The setup process and capabilities may evolve as we refine the offering

## Compatibility

The PrivateLink endpoint is a layer 3 solution so behaves like a standard Postgres endpoint, allowing you to connect using:

- Direct Postgres connections using standard tools
- Third-party database tools and ORMs (with the appropriate routing)

## Next steps

Ready to enhance your database security with PrivateLink? [Contact our Enterprise team](/contact/enterprise) to discuss your requirements and begin the setup process.

Our support team will guide you through the configuration and ensure your private database connectivity meets your security and performance requirements.

## Regional availability

PrivateLink is not currently available in the following regions:

- **eu-central-2 (Zurich)** - Expected availability: April 2026
