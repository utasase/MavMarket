import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "agents", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const errors = [];
const agentIds = new Set();
const executionIds = new Set(manifest.executionOrder);

for (const agent of manifest.agents) {
  if (agentIds.has(agent.id)) {
    errors.push(`Duplicate agent id: ${agent.id}`);
  }
  agentIds.add(agent.id);

  const specPath = path.join(root, agent.spec);
  if (!fs.existsSync(specPath)) {
    errors.push(`Missing spec file for ${agent.id}: ${agent.spec}`);
  }

  for (const dep of agent.dependsOn) {
    if (!manifest.agents.some((candidate) => candidate.id === dep)) {
      errors.push(`Unknown dependency "${dep}" in ${agent.id}`);
    }
  }

  for (const target of agent.handoffTargets) {
    if (!manifest.agents.some((candidate) => candidate.id === target)) {
      errors.push(`Unknown handoff target "${target}" in ${agent.id}`);
    }
  }
}

for (const id of manifest.executionOrder) {
  if (!agentIds.has(id)) {
    errors.push(`Execution order references missing agent: ${id}`);
  }
}

for (const id of agentIds) {
  if (!executionIds.has(id)) {
    errors.push(`Agent missing from execution order: ${id}`);
  }
}

if (errors.length) {
  console.error("Manifest validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Manifest valid: ${manifest.agents.length} agents registered.`);
