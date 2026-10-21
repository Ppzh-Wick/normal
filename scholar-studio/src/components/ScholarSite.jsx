import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { findPerson } from '../data/people';
import { parsePersonRoute, personHref } from '../utils/personRoutes';
import PersonPage from './PersonPage';

const readLocation = () => ({ hash: location.hash, entry: history.state || {} });
const homeTitle = '八大学者与五大奠基人 · 成都理工大学校史人物专题';

export default function ScholarSite({ Home }) {
  const [route, setRoute] = useState(readLocation);
  const profileRoute = parsePersonRoute(route.hash);
  const person = profileRoute && findPerson(profileRoute.id);
  const [homeVisited, setHomeVisited] = useState(!profileRoute);
  const previousWasProfile = useRef(Boolean(profileRoute));
  const initialGallery = useRef(route.entry.gallery || route.entry.personNavigation?.gallery);

  useEffect(() => {
    // Back/forward can emit both popstate and hashchange for the same entry.
    const sync = () => {
      const next = readLocation();
      setRoute(current => current.hash === next.hash ? current : next);
    };
    const restoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      history.scrollRestoration = restoration;
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  useLayoutEffect(() => {
    const returning = previousWasProfile.current;
    if (profileRoute) {
      previousWasProfile.current = true;
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.title = person ? `${person.name} · ${person.groupTitle} | 学脉相承` : '人物档案未找到 | 学脉相承';
      document.querySelector('.person-page h1')?.focus({ preventScroll: true });
      return;
    }
    document.title = homeTitle;
    if (!homeVisited) { setHomeVisited(true); return; }
    previousWasProfile.current = false;
    const snapshot = route.entry.gallery;
    if (returning && snapshot) {
      window.scrollTo({ top: snapshot.scrollY, behavior: 'instant' });
      const focusTarget = document.getElementById(snapshot.focusId);
      focusTarget?.focus({ preventScroll: true });
    } else {
      const id = route.hash.slice(1) || 'home';
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [route, homeVisited]);

  const openPerson = useCallback((id, gallery) => {
    if (!findPerson(id)) return;
    const current = readLocation();
    const fromProfile = parsePersonRoute(current.hash);
    const previousNav = current.entry.personNavigation;
    const focused = document.activeElement;
    const snapshot = fromProfile ? previousNav?.gallery : {
      ...gallery, scrollY: window.scrollY,
      focusId: focused?.id || `person-link-${id}`,
    };
    if (!fromProfile) history.replaceState({ ...current.entry, gallery: snapshot }, '', location.href);
    const navigation = {
      depth: fromProfile ? (previousNav?.depth || 0) + 1 : 1,
      homeHash: fromProfile ? (previousNav?.homeHash || '#scholars') : (current.hash || '#home'),
      gallery: snapshot,
      hasHomeEntry: fromProfile ? Boolean(previousNav?.hasHomeEntry) : true,
    };
    history.pushState({ personNavigation: navigation }, '', personHref(id));
    setRoute(readLocation());
  }, []);

  const returnToWall = () => {
    const navigation = history.state?.personNavigation;
    if (navigation?.hasHomeEntry) {
      history.go(-navigation.depth);
    } else {
      history.replaceState({}, '', '#scholars');
      setHomeVisited(true);
      setRoute(readLocation());
    }
  };

  return <>
    {homeVisited && <div hidden={Boolean(profileRoute)} inert={Boolean(profileRoute)} className="home-route">
      <Home active={!profileRoute} onOpenPerson={openPerson} initialGallery={initialGallery.current} />
    </div>}
    {profileRoute && <PersonPage key={profileRoute.id || 'missing'} person={person} onBack={returnToWall} onOpenPerson={openPerson} />}
  </>;
}
