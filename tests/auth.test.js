import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { sha256Hex } from '../src/core/hash.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts/hash-password.mjs');

test('sha256Hex gera SHA-256 hexadecimal', async () => {
  const expected = createHash('sha256').update('senha-teste').digest('hex');
  const hash = await sha256Hex('senha-teste');

  assert.equal(hash, expected);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test('script hash-password gera o mesmo hash do app', async () => {
  const expected = await sha256Hex('senha-teste');
  const output = execFileSync(process.execPath, [script, 'senha-teste'], {
    encoding: 'utf8',
  });

  assert.equal(output.trim(), expected);
});

test('script hash-password orienta quando falta a senha', () => {
  assert.throws(
    () => execFileSync(process.execPath, [script], { encoding: 'utf8', stdio: 'pipe' }),
    (error) => error.status === 1,
  );
});
