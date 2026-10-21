import { parsePersonRoute } from './personRoutes.js';

const navigationDepth = route => {
  const depth = route.entry?.personNavigation?.depth;
  return Number.isInteger(depth) && depth >= 0 ? depth : 0;
};

/** Classify page motion separately from restoring a history entry's state. */
export function describeRouteChange(from, to) {
  const fromProfile = parsePersonRoute(from.hash);
  const toProfile = parsePersonRoute(to.hash);
  // All home chapters share one mounted page; invalid person URLs still have
  // their own missing-profile screen and must be able to leave it normally.
  const changedPage = (fromProfile ? from.hash : 'home') !== (toProfile ? to.hash : 'home');
  const backwards = changedPage && Boolean(!toProfile || (
    fromProfile && navigationDepth(to) < navigationDepth(from)
  ));
  return { changedPage, backwards };
}
