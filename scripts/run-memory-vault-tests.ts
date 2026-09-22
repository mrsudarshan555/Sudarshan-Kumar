import { runMayraMemoryVaultTestSuite } from '../src/services/memory/memoryVaultTestHarness';

const reports = await runMayraMemoryVaultTestSuite();
const failed = reports.filter((report) => !report.passed);

console.log(JSON.stringify({
  total: reports.length,
  passed: reports.length - failed.length,
  failed: failed.length,
  failures: failed.map((report) => ({
    scenario: report.scenario,
    details: report.details,
  })),
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
