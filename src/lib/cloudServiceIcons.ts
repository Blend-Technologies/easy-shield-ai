import awsLambdaIcon from "@/assets/aws-lambda.svg";
import awsRdsIcon from "@/assets/aws-rds.svg";
import powerPlatformIcon from "@/assets/power-platform.svg";
import azureDevOpsIcon from "@/assets/azure-devops.svg";
import azureEntraIdIcon from "@/assets/azure-entra-id.svg";

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
];

/** Returns the icon URL for a known cloud service label, or null if none. */
export function getServiceIcon(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [pattern, icon] of SERVICE_ICON_MAP) {
    if (lower.includes(pattern)) return icon;
  }
  return null;
}
