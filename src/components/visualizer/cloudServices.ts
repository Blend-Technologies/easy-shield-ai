export type CloudService = {
  id: string;
  label: string;
  abbr: string;
  description: string;
  color: string;
  textColor: string;
};

export type CloudCategory = {
  name: string;
  services: CloudService[];
};

export type CloudProvider = {
  id: string;
  name: string;
  color: string;
  textColor: string;
  categories: CloudCategory[];
};

const aws: CloudProvider = {
  id: "aws",
  name: "AWS",
  color: "bg-[#FF9900]",
  textColor: "text-[#FF9900]",
  categories: [
    {
      name: "Compute",
      services: [
        { id: "aws-ec2", label: "EC2", abbr: "EC2", description: "Virtual Servers", color: "bg-[#FF9900]", textColor: "text-white" },
        { id: "aws-lambda", label: "Lambda", abbr: "λ", description: "Serverless Functions", color: "bg-[#FF9900]", textColor: "text-white" },
        { id: "aws-ecs", label: "ECS", abbr: "ECS", description: "Container Service", color: "bg-[#FF9900]", textColor: "text-white" },
        { id: "aws-eks", label: "EKS", abbr: "EKS", description: "Kubernetes Service", color: "bg-[#FF9900]", textColor: "text-white" },
        { id: "aws-fargate", label: "Fargate", abbr: "FG", description: "Serverless Containers", color: "bg-[#FF9900]", textColor: "text-white" },
        { id: "aws-eb", label: "Elastic Beanstalk", abbr: "EB", description: "App Deployment", color: "bg-[#FF9900]", textColor: "text-white" },
      ],
    },
    {
      name: "Storage",
      services: [
        { id: "aws-s3", label: "S3", abbr: "S3", description: "Object Storage", color: "bg-[#3F8624]", textColor: "text-white" },
        { id: "aws-ebs", label: "EBS", abbr: "EBS", description: "Block Storage", color: "bg-[#3F8624]", textColor: "text-white" },
        { id: "aws-efs", label: "EFS", abbr: "EFS", description: "File Storage", color: "bg-[#3F8624]", textColor: "text-white" },
        { id: "aws-glacier", label: "Glacier", abbr: "GL", description: "Archive Storage", color: "bg-[#3F8624]", textColor: "text-white" },
      ],
    },
    {
      name: "Database",
      services: [
        { id: "aws-rds", label: "RDS", abbr: "RDS", description: "Relational Database", color: "bg-[#3B48CC]", textColor: "text-white" },
        { id: "aws-dynamodb", label: "DynamoDB", abbr: "DDB", description: "NoSQL Database", color: "bg-[#3B48CC]", textColor: "text-white" },
        { id: "aws-aurora", label: "Aurora", abbr: "AUR", description: "MySQL/Postgres", color: "bg-[#3B48CC]", textColor: "text-white" },
        { id: "aws-elasticache", label: "ElastiCache", abbr: "EC", description: "In-Memory Cache", color: "bg-[#3B48CC]", textColor: "text-white" },
        { id: "aws-redshift", label: "Redshift", abbr: "RS", description: "Data Warehouse", color: "bg-[#3B48CC]", textColor: "text-white" },
      ],
    },
    {
      name: "Networking",
      services: [
        { id: "aws-vpc", label: "VPC", abbr: "VPC", description: "Virtual Network", color: "bg-[#8C4FFF]", textColor: "text-white" },
        { id: "aws-cf", label: "CloudFront", abbr: "CF", description: "CDN", color: "bg-[#8C4FFF]", textColor: "text-white" },
        { id: "aws-r53", label: "Route 53", abbr: "R53", description: "DNS Service", color: "bg-[#8C4FFF]", textColor: "text-white" },
        { id: "aws-elb", label: "ELB", abbr: "ELB", description: "Load Balancer", color: "bg-[#8C4FFF]", textColor: "text-white" },
        { id: "aws-apigw", label: "API Gateway", abbr: "API", description: "API Management", color: "bg-[#8C4FFF]", textColor: "text-white" },
      ],
    },
    {
      name: "Security",
      services: [
        { id: "aws-iam", label: "IAM", abbr: "IAM", description: "Identity & Access", color: "bg-[#DD344C]", textColor: "text-white" },
        { id: "aws-cognito", label: "Cognito", abbr: "COG", description: "User Auth", color: "bg-[#DD344C]", textColor: "text-white" },
        { id: "aws-kms", label: "KMS", abbr: "KMS", description: "Key Management", color: "bg-[#DD344C]", textColor: "text-white" },
        { id: "aws-waf", label: "WAF", abbr: "WAF", description: "Web App Firewall", color: "bg-[#DD344C]", textColor: "text-white" },
        { id: "aws-shield", label: "Shield", abbr: "SH", description: "DDoS Protection", color: "bg-[#DD344C]", textColor: "text-white" },
      ],
    },
    {
      name: "AI & Analytics",
      services: [
        { id: "aws-sagemaker", label: "SageMaker", abbr: "SM", description: "ML Platform", color: "bg-[#01A88D]", textColor: "text-white" },
        { id: "aws-bedrock", label: "Bedrock", abbr: "BR", description: "Foundation Models", color: "bg-[#01A88D]", textColor: "text-white" },
        { id: "aws-athena", label: "Athena", abbr: "ATH", description: "SQL Analytics", color: "bg-[#8C4FFF]", textColor: "text-white" },
        { id: "aws-kinesis", label: "Kinesis", abbr: "KIN", description: "Data Streaming", color: "bg-[#8C4FFF]", textColor: "text-white" },
      ],
    },
    {
      name: "Integration",
      services: [
        { id: "aws-sqs", label: "SQS", abbr: "SQS", description: "Message Queue", color: "bg-[#E7157B]", textColor: "text-white" },
        { id: "aws-sns", label: "SNS", abbr: "SNS", description: "Notifications", color: "bg-[#E7157B]", textColor: "text-white" },
        { id: "aws-eventbridge", label: "EventBridge", abbr: "EVB", description: "Event Bus", color: "bg-[#E7157B]", textColor: "text-white" },
        { id: "aws-sfn", label: "Step Functions", abbr: "SFN", description: "Workflow Orchestration", color: "bg-[#E7157B]", textColor: "text-white" },
      ],
    },
  ],
};

const azure: CloudProvider = {
  id: "azure",
  name: "Azure",
  color: "bg-[#0078D4]",
  textColor: "text-[#0078D4]",
  categories: [
    {
      name: "Compute",
      services: [
        { id: "az-vm", label: "Virtual Machines", abbr: "VM", description: "Cloud VMs", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-functions", label: "Functions", abbr: "AF", description: "Serverless Compute", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-aks", label: "AKS", abbr: "AKS", description: "Kubernetes Service", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-aci", label: "Container Instances", abbr: "ACI", description: "Run Containers", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-app-svc", label: "App Service", abbr: "APP", description: "Web App Hosting", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-batch", label: "Batch", abbr: "BAT", description: "HPC Workloads", color: "bg-[#0078D4]", textColor: "text-white" },
      ],
    },
    {
      name: "Storage",
      services: [
        { id: "az-blob", label: "Blob Storage", abbr: "BLB", description: "Object Storage", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-files", label: "Azure Files", abbr: "FIL", description: "File Shares", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-queue", label: "Queue Storage", abbr: "QST", description: "Message Storage", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-datalake", label: "Data Lake", abbr: "ADL", description: "Big Data Storage", color: "bg-[#0078D4]", textColor: "text-white" },
      ],
    },
    {
      name: "Database",
      services: [
        { id: "az-sql", label: "SQL Database", abbr: "SQL", description: "Managed SQL", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-cosmos", label: "Cosmos DB", abbr: "CDB", description: "Multi-model NoSQL", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-redis", label: "Cache for Redis", abbr: "RED", description: "In-Memory Cache", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-postgres", label: "PostgreSQL", abbr: "PG", description: "Managed Postgres", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-synapse", label: "Synapse Analytics", abbr: "SYN", description: "Data Warehouse", color: "bg-[#0078D4]", textColor: "text-white" },
      ],
    },
    {
      name: "Networking",
      services: [
        { id: "az-vnet", label: "Virtual Network", abbr: "VN", description: "Network Isolation", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-lb", label: "Load Balancer", abbr: "LB", description: "Traffic Distribution", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-agw", label: "Application Gateway", abbr: "AGW", description: "L7 Load Balancer", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-cdn", label: "CDN", abbr: "CDN", description: "Content Delivery", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-dns", label: "DNS", abbr: "DNS", description: "Domain Name System", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-fd", label: "Front Door", abbr: "FD", description: "Global Load Balancer", color: "bg-[#0078D4]", textColor: "text-white" },
      ],
    },
    {
      name: "Security",
      services: [
        { id: "az-ad", label: "Entra ID", abbr: "EID", description: "Identity Platform", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-kv", label: "Key Vault", abbr: "KV", description: "Secrets Management", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-sentinel", label: "Sentinel", abbr: "STN", description: "SIEM & SOAR", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-fw", label: "Firewall", abbr: "FW", description: "Network Security", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-ddos", label: "DDoS Protection", abbr: "DDP", description: "DDoS Mitigation", color: "bg-[#0078D4]", textColor: "text-white" },
      ],
    },
    {
      name: "AI & Analytics",
      services: [
        { id: "az-openai", label: "OpenAI Service", abbr: "OAI", description: "GPT & DALL-E", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-ml", label: "Machine Learning", abbr: "AML", description: "ML Platform", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-cog", label: "Cognitive Services", abbr: "COG", description: "Pre-built AI", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-databricks", label: "Databricks", abbr: "DBR", description: "Unified Analytics", color: "bg-[#0078D4]", textColor: "text-white" },
      ],
    },
    {
      name: "Integration",
      services: [
        { id: "az-sb", label: "Service Bus", abbr: "SB", description: "Message Broker", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-eh", label: "Event Hubs", abbr: "EH", description: "Event Streaming", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-eg", label: "Event Grid", abbr: "EG", description: "Event Routing", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-la", label: "Logic Apps", abbr: "LA", description: "Workflow Automation", color: "bg-[#0078D4]", textColor: "text-white" },
        { id: "az-apim", label: "API Management", abbr: "APM", description: "API Gateway", color: "bg-[#0078D4]", textColor: "text-white" },
      ],
    },
  ],
};

const gcp: CloudProvider = {
  id: "gcp",
  name: "Google Cloud",
  color: "bg-[#4285F4]",
  textColor: "text-[#4285F4]",
  categories: [
    {
      name: "Compute",
      services: [
        { id: "gcp-gce", label: "Compute Engine", abbr: "GCE", description: "Virtual Machines", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-cf", label: "Cloud Functions", abbr: "CF", description: "Serverless Functions", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-run", label: "Cloud Run", abbr: "RUN", description: "Serverless Containers", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-gke", label: "GKE", abbr: "GKE", description: "Kubernetes Engine", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-gae", label: "App Engine", abbr: "GAE", description: "App Platform", color: "bg-[#4285F4]", textColor: "text-white" },
      ],
    },
    {
      name: "Storage",
      services: [
        { id: "gcp-gcs", label: "Cloud Storage", abbr: "GCS", description: "Object Storage", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-pd", label: "Persistent Disk", abbr: "PD", description: "Block Storage", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-fs", label: "Filestore", abbr: "FS", description: "File Storage", color: "bg-[#4285F4]", textColor: "text-white" },
      ],
    },
    {
      name: "Database",
      services: [
        { id: "gcp-sql", label: "Cloud SQL", abbr: "SQL", description: "Managed SQL", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-spanner", label: "Spanner", abbr: "SPN", description: "Global Relational DB", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-firestore", label: "Firestore", abbr: "FST", description: "Document Database", color: "bg-[#FBBC04]", textColor: "text-black" },
        { id: "gcp-bigtable", label: "Bigtable", abbr: "BT", description: "Wide-column NoSQL", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-memorystore", label: "Memorystore", abbr: "MEM", description: "In-Memory Cache", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-bq", label: "BigQuery", abbr: "BQ", description: "Data Warehouse", color: "bg-[#4285F4]", textColor: "text-white" },
      ],
    },
    {
      name: "Networking",
      services: [
        { id: "gcp-vpc", label: "VPC", abbr: "VPC", description: "Virtual Network", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-lb", label: "Cloud Load Balancing", abbr: "CLB", description: "Load Balancer", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-cdn", label: "Cloud CDN", abbr: "CDN", description: "Content Delivery", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-dns", label: "Cloud DNS", abbr: "DNS", description: "DNS Service", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-armor", label: "Cloud Armor", abbr: "ARM", description: "WAF & DDoS", color: "bg-[#4285F4]", textColor: "text-white" },
      ],
    },
    {
      name: "Security",
      services: [
        { id: "gcp-iam", label: "IAM", abbr: "IAM", description: "Identity & Access", color: "bg-[#EA4335]", textColor: "text-white" },
        { id: "gcp-kms", label: "Cloud KMS", abbr: "KMS", description: "Key Management", color: "bg-[#EA4335]", textColor: "text-white" },
        { id: "gcp-scc", label: "Security Command", abbr: "SCC", description: "Security Center", color: "bg-[#EA4335]", textColor: "text-white" },
        { id: "gcp-sm", label: "Secret Manager", abbr: "SM", description: "Secrets Storage", color: "bg-[#EA4335]", textColor: "text-white" },
      ],
    },
    {
      name: "AI & Analytics",
      services: [
        { id: "gcp-vertex", label: "Vertex AI", abbr: "VAI", description: "ML Platform", color: "bg-[#34A853]", textColor: "text-white" },
        { id: "gcp-gemini", label: "Gemini API", abbr: "GEM", description: "Foundation Models", color: "bg-[#34A853]", textColor: "text-white" },
        { id: "gcp-vision", label: "Vision AI", abbr: "VIS", description: "Image Analysis", color: "bg-[#34A853]", textColor: "text-white" },
        { id: "gcp-dataflow", label: "Dataflow", abbr: "DF", description: "Stream Processing", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-dataproc", label: "Dataproc", abbr: "DP", description: "Spark & Hadoop", color: "bg-[#4285F4]", textColor: "text-white" },
      ],
    },
    {
      name: "Integration",
      services: [
        { id: "gcp-pubsub", label: "Pub/Sub", abbr: "PS", description: "Message Queue", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-workflows", label: "Workflows", abbr: "WF", description: "Orchestration", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-apigee", label: "Apigee", abbr: "APG", description: "API Management", color: "bg-[#4285F4]", textColor: "text-white" },
        { id: "gcp-tasks", label: "Cloud Tasks", abbr: "CT", description: "Task Queue", color: "bg-[#4285F4]", textColor: "text-white" },
      ],
    },
  ],
};

export const cloudProviders: CloudProvider[] = [aws, azure, gcp];

// Also keep existing generic integration components
export const genericCategories: CloudCategory[] = [
  {
    name: "Platforms",
    services: [
      { id: "salesforce", label: "Salesforce", abbr: "SF", description: "CRM & Sales Cloud", color: "bg-[#00A1E0]", textColor: "text-white" },
      { id: "outsystems", label: "OutSystems", abbr: "OS", description: "Low-Code Platform", color: "bg-[#CF272D]", textColor: "text-white" },
      { id: "mendix", label: "Mendix", abbr: "MX", description: "App Development", color: "bg-[#0595DB]", textColor: "text-white" },
      { id: "bubble", label: "Bubble", abbr: "BB", description: "No-Code Builder", color: "bg-[#3D3D3D]", textColor: "text-white" },
      { id: "power-apps", label: "Power Apps", abbr: "PA", description: "Microsoft Platform", color: "bg-[#742774]", textColor: "text-white" },
    ],
  },
  {
    name: "Generic Security",
    services: [
      { id: "firewall", label: "Firewall", abbr: "FW", description: "Network Security", color: "bg-[#DD344C]", textColor: "text-white" },
      { id: "oauth", label: "OAuth / SSO", abbr: "SSO", description: "Authentication", color: "bg-[#DD344C]", textColor: "text-white" },
      { id: "encryption", label: "Encryption", abbr: "ENC", description: "Data Protection", color: "bg-[#DD344C]", textColor: "text-white" },
    ],
  },
  {
    name: "Generic Integration",
    services: [
      { id: "rest-api", label: "REST API", abbr: "API", description: "HTTP Endpoints", color: "bg-[#6366F1]", textColor: "text-white" },
      { id: "webhook", label: "Webhook", abbr: "WH", description: "Event Triggers", color: "bg-[#6366F1]", textColor: "text-white" },
      { id: "message-queue", label: "Message Queue", abbr: "MQ", description: "Async Processing", color: "bg-[#6366F1]", textColor: "text-white" },
      { id: "etl", label: "ETL Pipeline", abbr: "ETL", description: "Data Transform", color: "bg-[#6366F1]", textColor: "text-white" },
      { id: "database", label: "Database", abbr: "DB", description: "SQL / NoSQL", color: "bg-[#3B48CC]", textColor: "text-white" },
      { id: "cache", label: "Cache", abbr: "CHE", description: "In-Memory Store", color: "bg-[#3B48CC]", textColor: "text-white" },
    ],
  },
];
