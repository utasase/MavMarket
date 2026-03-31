import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "agents", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split("=");
    return [key, value ?? "true"];
  }),
);

const phaseFilter = args.get("--phase");
const agentMap = new Map(manifest.agents.map((agent) => [agent.id, agent]));

for (const id of manifest.executionOrder) {
  const agent = agentMap.get(id);
  if (!agent) {
    console.error(`Missing agent definition for ${id}`);
    process.exitCode = 1;
    continue;
  }

  if (phaseFilter && String(agent.phase) !== String(phaseFilter)) {
    continue;
  }

  const deps = agent.dependsOn.length ? agent.dependsOn.join(", ") : "none";
  console.log(`${agent.id}`);
  console.log(`  phase: ${agent.phase}`);
  console.log(`  dependsOn: ${deps}`);
  console.log(`  spec: ${agent.spec}`);
}
