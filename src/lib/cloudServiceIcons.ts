import awsLambdaIcon from "@/assets/aws-lambda.svg";
import awsRdsIcon from "@/assets/aws-rds.svg";

/**
 * Maps lowercase label substrings to icon URLs.
 * Add more entries here as new service icons are added to src/assets/.
 */
const SERVICE_ICON_MAP: [pattern: string, icon: string][] = [
  ["lambda", awsLambdaIcon],
  ["rds", awsRdsIcon],
];

/** Returns the icon URL for a known cloud service label, or null if none. */
export function getServiceIcon(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [pattern, icon] of SERVICE_ICON_MAP) {
    if (lower.includes(pattern)) return icon;
  }
  return null;
}
