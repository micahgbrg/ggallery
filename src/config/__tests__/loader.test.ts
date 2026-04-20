// Test loader without assert/process to satisfy quick TS check
import { loadConfig } from '../loader';

const assert = {
  strictEqual: (a: any, b: any) => { if (a !== b) throw new Error(`Expected ${b} but got ${a}`); },
  throws: (fn: () => void, check: (err: Error) => boolean) => {
    try {
      fn();
      throw new Error("Expected function to throw");
    } catch (err: any) {
      if (!check(err)) throw new Error("Error did not match expected criteria: " + err.message);
    }
  }
};


async function runTests() {
  console.log('Running loader tests...');

  // Test 1: Valid config
  const validYaml = `
gallery:
  title: "My Gallery"
template: "long-hall"
theme:
  walls: "concrete"
sculptures:
  - file: "sculpture1.glb"
    title: "The First One"
  `;
  
  const validConfig = loadConfig(validYaml);
  assert.strictEqual(validConfig.gallery.title, "My Gallery");
  assert.strictEqual(validConfig.template, "long-hall");
  // Default merging
  assert.strictEqual(validConfig.theme.walls, "concrete");
  assert.strictEqual(validConfig.theme.floor, "hardwood-dark"); // Default merged
  assert.strictEqual(validConfig.sculptures.length, 1);
  assert.strictEqual(validConfig.sculptures[0].spotlight, false); // Default merged

  // Test 2: Missing title
  const missingTitleYaml = `
sculptures:
  - file: "sculpture1.glb"
    title: "Sculpture 1"
  `;
  assert.throws(
    () => loadConfig(missingTitleYaml),
    (err: Error) => err.message.includes("missing required field 'gallery.title'")
  );

  // Test 3: Invalid template name
  const invalidTemplateYaml = `
gallery:
  title: "My Gallery"
template: "round-room"
sculptures:
  - file: "sculpture1.glb"
    title: "Sculpture 1"
  `;
  assert.throws(
    () => loadConfig(invalidTemplateYaml),
    (err: Error) => err.message.includes("invalid template name 'round-room'")
  );

  // Test 4: Missing sculpture title
  const missingSculptureTitleYaml = `
gallery:
  title: "My Gallery"
sculptures:
  - file: "sculpture1.glb"
  `;
  assert.throws(
    () => loadConfig(missingSculptureTitleYaml),
    (err: Error) => err.message.includes("sculpture at index 0 is missing required field 'title'")
  );

  // Test 5: on_pedestal defaults to true
  const noPedestalFieldYaml = `
gallery:
  title: "My Gallery"
sculptures:
  - file: "sculpture1.glb"
    title: "Default Pedestal"
  `;
  const noPedestalConfig = loadConfig(noPedestalFieldYaml);
  assert.strictEqual(noPedestalConfig.sculptures[0].on_pedestal, true);

  // Test 6: on_pedestal: false is passed through
  const noPedestalYaml = `
gallery:
  title: "My Gallery"
sculptures:
  - file: "statue.glb"
    title: "Floor Statue"
    on_pedestal: false
  `;
  const floorConfig = loadConfig(noPedestalYaml);
  assert.strictEqual(floorConfig.sculptures[0].on_pedestal, false);

  console.log('All loader tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  throw err;
});
