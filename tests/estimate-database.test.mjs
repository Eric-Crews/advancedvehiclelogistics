import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';

test('all migrations apply and rate counters stop at their ceiling', () => {
  const db = new DatabaseSync(':memory:');
  try {
    for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) db.exec(readFileSync(new URL('../drizzle/' + file, import.meta.url), 'utf8'));
    const take = db.prepare('INSERT INTO ai_usage_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count');
    for (let i = 1; i <= 12; i++) assert.equal(take.get('actor:example', 10000, 12).count, i);
    assert.equal(take.get('actor:example', 10000, 12), undefined);
    assert.equal(db.prepare('SELECT count FROM ai_usage_limits WHERE key=?').get('actor:example').count, 12);
    const columns = db.prepare('PRAGMA table_info(loads)').all().map(r => r.name);
    assert.ok(columns.includes('requirements_verified_at')); assert.ok(columns.includes('requirements_verification_note'));
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='loads_estimate_id_unique'").get().name, 'loads_estimate_id_unique');
  } finally { db.close(); }
});
