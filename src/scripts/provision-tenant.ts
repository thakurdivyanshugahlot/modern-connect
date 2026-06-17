import { execSync } from "child_process";

export function provisionTenant(userId: string) {
  execSync(
    `npx corsair setup --plugin=gmail --tenant=${userId}`,
    {
      stdio: "inherit",
    },
  );

  execSync(
    `npx corsair setup --plugin=googlecalendar --tenant=${userId}`,
    {
      stdio: "inherit",
    },
  );
}