import awsLambdaIcon from "@/assets/aws-lambda.svg";
import awsRdsIcon from "@/assets/aws-rds.svg";
import powerPlatformIcon from "@/assets/power-platform.svg";
import azureDevOpsIcon from "@/assets/azure-devops.svg";
import azureEntraIdIcon from "@/assets/azure-entra-id.svg";
import azureMonitorIcon from "@/assets/azure-monitor.svg";
import azureSynapseIcon from "@/assets/azure-synapse.svg";
import azureVnetIcon from "@/assets/azure-vnet.svg";
import azureApimIcon from "@/assets/azure-apim.svg";

/**
 * Maps lowercase label substrings to icon URLs.
 * Add more entries here as new service icons are added to src/assets/.
 */
const SERVICE_ICON_MAP: [pattern: string, icon: string][] = [
  ["lambda", awsLambdaIcon],
  ["rds", awsRdsIcon],
  ["power platform", powerPlatformIcon],
  ["azure devops", azureDevOpsIcon],
  ["devops", azureDevOpsIcon],
  ["entra id", azureEntraIdIcon],
  ["entra managed", azureEntraIdIcon],
  ["microsoft entra", azureEntraIdIcon],
  ["azure active directory", azureEntraIdIcon],
  ["azure ad", azureEntraIdIcon],
  ["azure monitor", azureMonitorIcon],
  ["application insights", azureMonitorIcon],
  ["log analytics", azureMonitorIcon],
  ["azure synapse", azureSynapseIcon],
  ["synapse analytics", azureSynapseIcon],
  ["synapse", azureSynapseIcon],
  ["virtual network", azureVnetIcon],
  ["azure vnet", azureVnetIcon],
  ["vnet", azureVnetIcon],
  ["api management", azureApimIcon],
  ["azure apim", azureApimIcon],
  ["apim", azureApimIcon],
];

/** Returns the icon URL for a known cloud service label, or null if none. */
export function getServiceIcon(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [pattern, icon] of SERVICE_ICON_MAP) {
    if (lower.includes(pattern)) return icon;
  }
  return null;
}
