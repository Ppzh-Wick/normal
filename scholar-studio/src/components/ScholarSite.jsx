import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { findPerson } from '../data/people';
import { parsePersonRoute, personHref } from '../utils/personRoutes';
import { describeRouteChange } from '../utils/routeTransition';
import PersonPage from './PersonPage';
import './route-motion.css';

const readLocation = () => ({ hash: location.hash, entry: history.state || {} });
const homeTitle = '八大学者与五大奠基人 · 成都理工大学校史人物专题';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ScholarSite({ Home }) {
  const [route, setRoute] = useState(readLocation);
  const [transition, setTransition] = useState(null);
  const [homeVisited, setHomeVisited] = useState(() => !parsePersonRoute(route.hash));
  const rootRef = useRef(null);
  const spacerRef = useRef(null);
  const routeRef = useRef(route);
  const settleRef = useRef(null);
  const previousWasProfile = useRef(Boolean(parsePersonRoute(route.hash)));
  const initialGallery = useRef(route.entry.gallery || route.entry.personNavigation?.gallery);
  const profileRoute = parsePersonRoute(route.hash);
  const person = profileRoute && findPerson(profileRoute.id);

  const navigate = useCallback((next, sectionNavigation = false) => {
    if (routeRef.current.hash === next.hash && JSON.stringify(routeRef.current.entry) === JSON.stringify(next.entry)) return;
    // Interrupted browser history navigation starts from a settled viewport.
    settleRef.current?.();
    const previous = routeRef.current;
    const { changedPage, backwards } = describeRouteChange(previous, next);
    const toProfile = parsePersonRoute(next.hash);
    if (!toProfile) setHomeVisited(true);
    setTransition(changedPage && !reduceMotion() ? { previous, scrollY: window.scrollY, backwards } : null);
    const updated = { ...next, sectionNavigation, arrived: changedPage };
    routeRef.current = updated;
    setRoute(updated);
  }, []);

  useEffect(() => {
    const sync = () => navigate(readLocation());
    const syncSection = () => navigate(readLocation(), true);
    const restoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    window.addEventListener('scholar:section-navigation', syncSection);
    return () => {
      history.scrollRestoration = restoration;
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('scholar:section-navigation', syncSection);
    };
  }, [navigate]);

  useLayoutEffect(() => {
    const returning = previousWasProfile.current;
    previousWasProfile.current = Boolean(profileRoute);
    document.title = profileRoute
      ? (person ? `${person.name} · ${person.groupTitle} | 学脉相承` : '人物档案未找到 | 学脉相承')
      : homeTitle;
    if (route.sectionNavigation) return undefined;
    const current = rootRef.current.querySelector('[data-route-current="true"]');
    // Rapid Back/Forward may reuse the just-dismissed React key before unmount.
    current.hidden = false;
    const snapshot = returning && !profileRoute ? route.entry.gallery : null;
    const focusDestination = () => {
      const target = profileRoute ? current.querySelector('h1') : snapshot?.focusId && current.querySelector(`#${CSS.escape(snapshot.focusId)}`);
      target?.focus({ preventScroll: true });
    };
    if (profileRoute) window.scrollTo({ top: 0, behavior: 'instant' });
    else if (snapshot) window.scrollTo({ top: snapshot.scrollY, behavior: 'instant' });
    else current.querySelector(`#${CSS.escape(route.hash.slice(1) || 'home')}`)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    if (!transition) { focusDestination(); return undefined; }

    const outgoing = rootRef.current.querySelector('[data-route-outgoing="true"]');
    const inner = current.firstElementChild;
    const spacer = spacerRef.current;
    // A spacer retains document length while both viewport surfaces are fixed.
    // Inner margin preserves floating nav positions within the outer viewport.
    const destinationY = window.scrollY;
    const pageHeight = current.getBoundingClientRect().height;
    spacer.style.height = `${pageHeight}px`;
    current.classList.add('route-view--frozen');
    inner.style.marginTop = `${-destinationY}px`;
    current.dataset.routeLevel = transition.backwards ? 'under' : 'over';
    outgoing.dataset.routeLevel = transition.backwards ? 'over' : 'under';
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let done = false;
    let context;
    const release = () => {
      context?.revert();
      current.classList.remove('route-view--frozen');
      inner.style.marginTop = '';
      delete current.dataset.routeLevel;
      delete outgoing.dataset.routeLevel;
      spacer.style.height = '';
      html.style.overflow = previousOverflow;
      window.removeEventListener('resize', finish);
      window.removeEventListener('wheel', finish);
      window.removeEventListener('touchmove', finish);
      window.removeEventListener('keydown', finishKey);
      media.removeEventListener('change', finish);
    };
    const finish = () => {
      if (done) return;
      done = true;
      outgoing.hidden = true;
      release();
      window.scrollTo({ top: destinationY, behavior: 'instant' });
      settleRef.current = null;
      setTransition(null);
      current.inert = false;
      focusDestination();
    };
    const finishKey = event => {
      if (['Escape', 'Tab', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) finish();
    };
    settleRef.current = finish;
    context = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut', duration: .86 }, onComplete: finish });
      if (transition.backwards) {
        tl.fromTo(current, { xPercent: -8, scale: .98, opacity: .6 }, { xPercent: 0, scale: 1, opacity: 1 }, 0)
          .to(outgoing, { xPercent: 100 }, 0);
      } else {
        tl.fromTo(current, { xPercent: 100 }, { xPercent: 0 }, 0)
          .to(outgoing, { xPercent: -8, scale: .98, opacity: .55 }, 0);
      }
      if (profileRoute && person) {
        tl.from(current.querySelector('.person-name span'), { yPercent: 80, duration: 1, ease: 'power3.out' }, .24)
          .from(current.querySelectorAll('.person-hero-copy > p, .person-hero-copy > button, .person-hero-foot'), {
            y: 24, opacity: 0, duration: .7, stagger: .055, ease: 'power3.out',
          }, .34);
      }
    }, rootRef);
    window.addEventListener('resize', finish, { passive: true });
    window.addEventListener('wheel', finish, { passive: true });
    window.addEventListener('touchmove', finish, { passive: true });
    window.addEventListener('keydown', finishKey);
    media.addEventListener('change', finish);
    return () => { if (!done) { done = true; release(); settleRef.current = null; } };
    // Transition belongs to this location change, not its settle-state render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  const openPerson = useCallback((id, gallery) => {
    if (!findPerson(id)) return;
    settleRef.current?.();
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
    navigate(readLocation());
  }, [navigate]);

  const returnToWall = () => {
    settleRef.current?.();
    const navigation = history.state?.personNavigation;
    if (navigation?.hasHomeEntry) history.go(-navigation.depth);
    else {
      history.replaceState({}, '', '#scholars');
      navigate(readLocation());
    }
  };

  const previousProfile = transition && parsePersonRoute(transition.previous.hash);
  const homeOutgoing = Boolean(transition && !previousProfile);
  const profiles = [
    ...(profileRoute ? [{ route, parsed: profileRoute, current: true }] : []),
    ...(previousProfile ? [{ route: transition.previous, parsed: previousProfile, current: false }] : []),
  ];
  return <div ref={rootRef} className="route-stage" data-route-busy={Boolean(transition)}>
    <div ref={spacerRef} aria-hidden="true" />
    {homeVisited && <div hidden={Boolean(profileRoute) && !homeOutgoing} inert={Boolean(profileRoute) || Boolean(transition)}
      className={`home-route route-view${homeOutgoing ? ' route-view--frozen' : ''}`}
      data-route-current={!profileRoute} data-route-outgoing={homeOutgoing}>
      <div className="route-flow" style={homeOutgoing ? { marginTop: -transition.scrollY } : undefined}>
        <Home active={!profileRoute && !transition} onOpenPerson={openPerson} initialGallery={initialGallery.current} />
      </div>
    </div>}
    {profiles.map(item => <div key={item.route.hash} hidden={false} className={`route-view${!item.current ? ' route-view--frozen' : ''}`}
      inert={!item.current || Boolean(transition)} data-route-current={item.current} data-route-outgoing={!item.current}>
      <div className="route-flow" style={!item.current ? { marginTop: -transition.scrollY } : undefined}>
        <PersonPage person={findPerson(item.parsed.id)} onBack={returnToWall} onOpenPerson={openPerson}
          motionEnabled={item.current && !transition} playOpening={!item.route.arrived} />
      </div>
    </div>)}
  </div>;
}
