/* Smallest check on the password policy (backend mirrors this exact rule).
   Run: node src/validators.test.mjs */
import assert from 'node:assert'
import { passwordProblem } from './validators.js'

const ok = (pw) => assert.strictEqual(passwordProblem(pw), null, `expected OK: ${pw}`)
const bad = (pw) => assert.ok(passwordProblem(pw), `expected rejected: ${pw}`)

bad('Ab1!')           // too short (< 8)
bad('alllowercase')   // 1 class
bad('lowerUPPER')     // 2 classes
ok('lowerUPPER1')     // 3 classes: lower + upper + digit
ok('Abcdefg1!')       // 4 classes

console.log('password policy ok')
