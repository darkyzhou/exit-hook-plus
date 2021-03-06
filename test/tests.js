const assert = require('assert');
const path = require('path');
const { fork } = require('child_process');

function forkTestFile(fileName, jsonOutput = true, signal = null) {
  return new Promise((resolve) => {
    const proc = fork(path.resolve(__dirname, 'cases', `${fileName}.js`), {
      env: process.env,
      silent: true
    });

    let output = '';
    proc.stdout.on('data', (data) => (output += data.toString()));
    proc.stderr.on('data', (data) => (output += data.toString()));
    proc.on('exit', (code) => resolve([code, jsonOutput ? JSON.parse(output) : output]));

    if (signal) {
      // https://github.com/nodejs/node/issues/22761
      setTimeout(() => proc.kill(signal), 500);
    }
  });
}

describe('trivial exit test case', () => {
  describe('no process.exit called', () => {
    it('should print correct reason only once', async () => {
      const [code, output] = await forkTestFile('trivial-exit-no-process-exit');
      assert.deepStrictEqual(code, 0);
      assert.deepStrictEqual(output[0], 'trivial');
      assert.deepStrictEqual(output[1], 0);
    });
  });

  describe('with process.exit(99) called', () => {
    it('should print the only one correct reason', async () => {
      const [code, output] = await forkTestFile('trivial-exit-with-process-exit');
      assert.deepStrictEqual(code, 99);
      assert.deepStrictEqual(output[0], 1);
      assert.deepStrictEqual(output[1], 'trivial');
      assert.deepStrictEqual(output[2], 99);
    });
  });
});

describe('unhandledRejection test case', () => {
  it('should print correct reason only once', async () => {
    const [code, output] = await forkTestFile('unhandled-rejection');
    assert.deepStrictEqual(code, 1);
    assert.deepStrictEqual(output[0], 'exception');
    assert.deepStrictEqual(output[1], 'test error');
  });
});

describe('uncaughtException test case', () => {
  it('should print correct reason only once', async () => {
    const [code, output] = await forkTestFile('uncaught-exception');
    assert.deepStrictEqual(code, 1);
    assert.deepStrictEqual(output[0], 'exception');
    assert.deepStrictEqual(output[1], 'test error');
  });
});

describe('sigint test case', () => {
  it('should print correct reason once', async () => {
    const [code, output] = await forkTestFile('sigint', true, 'SIGINT');
    assert.deepStrictEqual(code, 130);
    assert.deepStrictEqual(output[0], 'signal');
    assert.deepStrictEqual(output[1], 'SIGINT');
  });
});

describe(`executeAllHooksAndTerminate(99, 'test data') test case`, () => {
  it('should print correct reason once', async () => {
    const [code, output] = await forkTestFile('manual');
    assert.deepStrictEqual(code, 99);
    assert.deepStrictEqual(output[0], 'manual');
    assert.deepStrictEqual(output[1], 'test data');
  });
});

describe('remove existing hook test case', () => {
  it('should remove the right hook and give correct output', async () => {
    const [code, output] = await forkTestFile('remove-hook');
    assert.deepStrictEqual(code, 0);
    assert.deepStrictEqual(output, 2);
  });
});

describe('default exit logger test case', () => {
  describe('unhandled exception occurred', () => {
    it('should print correct log', async () => {
      const [code, output] = await forkTestFile('default-exit-logger-exception', false);
      assert.deepStrictEqual(code, 1);
      assert.deepStrictEqual(
        output.trim(),
        'the program is now exiting due to unhandled exception: test error'
      );
    });
  });
  describe('received SIGTERM signal', () => {
    it('should print correct log', async () => {
      const [code, output] = await forkTestFile('default-exit-logger-sigterm', false, 'SIGTERM');
      assert.deepStrictEqual(code, 143);
      assert.deepStrictEqual(
        output.trim(),
        'the program is now exiting due to receiving signal: SIGTERM'
      );
    });
  });
});
