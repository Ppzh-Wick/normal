import test from 'node:test';
import assert from 'node:assert/strict';
import { describeRouteChange } from '../src/utils/routeTransition.js';

const home = (hash = '#scholars', gallery) => ({ hash, entry: gallery ? { gallery } : {} });
const profile = (id, depth) => ({
  hash: `#/people/${id}`,
  entry: depth === undefined ? {} : { personNavigation: { depth, hasHomeEntry: true } },
});

test('chapter links and browser history within Home do not replace its mounted page', () => {
  for (const [from, to] of [
    ['', '#home'], ['#home', '#scholars'], ['#scholars', '#projects'],
    ['#projects', '#scholars'], ['#strengths', '#home'],
  ]) {
    assert.deepEqual(describeRouteChange(home(from), home(to)), { changedPage: false, backwards: false });
  }
});

test('opening a portrait moves into its page; returning to any home chapter moves back', () => {
  for (const hash of ['#home', '#scholars', '#projects']) {
    const chapter = home(hash, { group: 'founders', paused: true, scrollY: 1800 });
    const person = profile('liu-baojun', 1);
    assert.deepEqual(describeRouteChange(chapter, person), { changedPage: true, backwards: false });
    assert.deepEqual(describeRouteChange(person, chapter), { changedPage: true, backwards: true });
  }
});

test('next-person, browser Back, and browser Forward follow navigation depth, not person ordering', () => {
  // Reading wraps from the last person to the first: it is still forward.
  const last = profile('jin-jingfu', 4);
  const first = profile('li-chengsan', 5);
  assert.deepEqual(describeRouteChange(last, first), { changedPage: true, backwards: false });
  assert.deepEqual(describeRouteChange(first, last), { changedPage: true, backwards: true });
});

test('fresh deep links, including missing profiles, can open another person and return to the wall', () => {
  for (const hash of ['#/people/li-chengsan', '#/people/unknown', '#/people/', '#/people/%E0%A4%A']) {
    const direct = { hash, entry: {} };
    assert.deepEqual(describeRouteChange(direct, profile('chang-longqing', 1)), { changedPage: true, backwards: false });
    assert.deepEqual(describeRouteChange(direct, home()), { changedPage: true, backwards: true });
  }
});

test('same-page history state restoration is not mistaken for a page transition', () => {
  const before = home('#scholars', { group: 'all', paused: false, scrollY: 1200 });
  const restored = home('#scholars', { group: 'founders', paused: true, scrollY: 1650 });
  assert.deepEqual(describeRouteChange(before, restored), { changedPage: false, backwards: false });
  assert.deepEqual(describeRouteChange(profile('li-chengsan', 2), profile('li-chengsan', 8)), {
    changedPage: false, backwards: false,
  });
});

test('serialized history entries preserve back direction without a live object identity', () => {
  const from = JSON.parse(JSON.stringify(profile('li-tangmi', 3)));
  const to = JSON.parse(JSON.stringify(profile('chang-longqing', 2)));
  assert.deepEqual(describeRouteChange(from, to), { changedPage: true, backwards: true });
});
