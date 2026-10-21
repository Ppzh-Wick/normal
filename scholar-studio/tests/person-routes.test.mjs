import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { people, findPerson } from '../src/data/people.js';
import { isPlainClick, parsePersonRoute, personHref } from '../src/utils/personRoutes.js';

test('every one of the thirteen people has a unique, resolvable page and real portrait', () => {
  assert.equal(people.length, 13);
  assert.equal(new Set(people.map(person => person.id)).size, 13);
  assert.equal(people.filter(person => person.group === 'scholars').length, 8);
  assert.equal(people.filter(person => person.group === 'founders').length, 5);
  for (const person of people) {
    assert.equal(findPerson(parsePersonRoute(personHref(person.id)).id), person);
    assert.ok(existsSync(new URL(`../public/images/portraits/${person.id}.jpg`, import.meta.url)));
    for (const key of ['contributions', 'timeline', 'sources']) assert.ok(person[key].length, `${person.id}: ${key}`);
  }
});
test('home anchors never become person pages; malformed and unknown profiles do not select another person', () => {
  for (const hash of ['', '#home', '#scholars', '#projects']) assert.equal(parsePersonRoute(hash), null);
  for (const hash of ['#/people/', '#/people/%E0%A4%A', '#/people/li-chengsan/extra']) assert.equal(parsePersonRoute(hash).id, null);
  assert.equal(findPerson(parsePersonRoute('#/people/unknown').id), undefined);
});
test('modified clicks retain browser-native open-in-new-tab behavior', () => {
  assert.equal(isPlainClick({ button: 0 }), true);
  for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) assert.equal(isPlainClick({ button: 0, [modifier]: true }), false);
  assert.equal(isPlainClick({ button: 1 }), false);
});
