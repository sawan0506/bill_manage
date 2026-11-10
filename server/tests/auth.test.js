import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Security & Authentication Engine', () => {
  it('should hash and verify passwords using bcrypt cost 12', async () => {
    const rawPassword = 'SecretPassword@123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notStrictEqual(rawPassword, hash);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(isMatch, true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrongMatch, false);
  });

  it('should sign and verify JWT access tokens with expiration', () => {
    const secret = 'test_access_secret_1234567890_test';
    const payload = { userId: 'user123', role: 'admin' };

    const token = jwt.sign(payload, secret, { expiresIn: '15m' });
    assert.ok(token);

    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.userId, 'user123');
    assert.strictEqual(decoded.role, 'admin');
  });

  it('should reject expired tokens or mismatched secrets', () => {
    const secret = 'test_secret_1';
    const wrongSecret = 'test_secret_2';
    const token = jwt.sign({ userId: 'user123' }, secret, { expiresIn: '1s' });

    assert.throws(() => {
      jwt.verify(token, wrongSecret);
    });
  });
});
