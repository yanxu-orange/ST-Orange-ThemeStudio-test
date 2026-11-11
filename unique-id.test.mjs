import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {uniqueId} from './unique-id.mjs';

test('ID helper preserves native UUID and supports HTTP-only Web Crypto',()=>{
  assert.equal(uniqueId({randomUUID:()=> 'native-id'}),'native-id');
  const httpCrypto={getRandomValues:values=>webcrypto.getRandomValues(values)};
  const ids=Array.from({length:1000},()=>uniqueId(httpCrypto));
  assert.equal(new Set(ids).size,ids.length);
  for(const id of ids)assert.match(id,/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
});
