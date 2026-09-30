import test from 'node:test';
import assert from 'node:assert/strict';
import {activationFromHash,passwordError} from '../lib/auth-activation.ts';
test('solamente enlaces de invitación o recuperación habilitan el formulario',()=>{
 assert.equal(activationFromHash('#type=invite&access_token=synthetic').token,'synthetic');
 assert.equal(activationFromHash('#type=recovery&access_token=synthetic').token,'synthetic');
 for(const hash of ['','#type=invite','#type=signup&access_token=synthetic','#type=invite&access_token=synthetic&error=expired']) assert.ok(activationFromHash(hash).error);
});
test('contraseñas breves o diferentes se rechazan',()=>{
 assert.ok(passwordError('short','short'));
 assert.ok(passwordError('synthetic-password','different'));
 assert.equal(passwordError('synthetic-password','synthetic-password'),'');
});
