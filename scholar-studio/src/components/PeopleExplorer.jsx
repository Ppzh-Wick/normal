import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import DriftWall from './DriftWall';
import { scholars } from '../data/scholars';
import { founders } from '../data/founders';
import './PeopleExplorer.css';

const people = [
  ...scholars.map(person => ({ ...person, group: 'scholars', groupTitle: '八大学者' })),
  ...founders.map(person => ({ ...person, group: 'founders', groupTitle: '五大奠基人' })),
];
const groups = [
  { id: 'all', title: '全部人物', count: 13 },
  { id: 'scholars', title: '八大学者', count: 8 },
  { id: 'founders', title: '五大奠基人', count: 5 },
];
const portrait = person => `${import.meta.env.BASE_URL}images/portraits/${person.id}.jpg`;

const PeopleExplorer = forwardRef(function PeopleExplorer(_, ref) {
  const [group, setGroup] = useState('all');
  const [selectedId, setSelectedId] = useState(people[0].id);
  const [paused, setPaused] = useState(false);
  const [readRequest, setReadRequest] = useState(0);
  const [columns, setColumns] = useState(5);
  const wallRef = useRef(null);
  const profileRef = useRef(null);
  const profileTitleRef = useRef(null);
  const selected = people.find(person => person.id === selectedId) || people[0];
  const visiblePeople = useMemo(() => people.filter(person => group === 'all' || person.group === group), [group]);
  const items = useMemo(() => visiblePeople.map(person => ({
    id: person.id, image: portrait(person), title: person.name,
    subtitle: person.groupTitle, alt: `${person.name}的历史肖像`,
    objectPosition: '50% 24%',
  })), [visiblePeople]);

  const changeGroup = id => {
    setGroup(id);
    if (id !== 'all' && selected.group !== id) {
      setSelectedId(people.find(person => person.group === id).id);
    }
  };

  const readPerson = id => {
    const person = people.find(person => person.id === id);
    if (!person) return;
    setGroup(current => current === 'all' || current === person.group ? current : person.group);
    setSelectedId(id);
    setReadRequest(request => request + 1);
  };
  useImperativeHandle(ref, () => ({ openProfile: readPerson }), []);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setColumns(width < 600 ? 2 : width < 1000 ? 3 : 5);
    });
    if (wallRef.current) observer.observe(wallRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!readRequest) return undefined;
    const frame = requestAnimationFrame(() => {
      profileTitleRef.current?.focus({ preventScroll: true });
      profileRef.current?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [readRequest]);

  return (
    <>
      <div className="people-explorer">
        <div className="people-toolbar">
          <div className="people-group-switch" role="group" aria-label="人物分类">
            {groups.map(item => (
              <button key={item.id} type="button" aria-pressed={group === item.id}
                aria-controls="people-wall people-directory"
                onClick={() => changeGroup(item.id)}>
                {item.title}<span>{item.count}</span>
              </button>
            ))}
          </div>
          <button className="people-motion-toggle" type="button" aria-pressed={paused}
            onClick={() => setPaused(value => !value)}>
            <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{paused ? '继续流动' : '暂停流动'}
          </button>
        </div>
        <div className="people-wall-entry">
          <div className="people-wall-stage" id="people-wall" ref={wallRef}>
            <DriftWall
              items={items} columns={columns} tileWidth={columns === 2 ? 170 : 240} tileHeight={columns === 2 ? 220 : 290} gap={18}
              tilt={16} turn={-14} perspective={1200} depth={120} speed={42}
              direction="up" variance={0.45} parallax={0.6} lift={64}
              fade={0.6} dim={0.86} overlayColor="#204b96" radius={14}
              roll={0} pauseOnHover={false} grayscale={false} paused={paused}
              imageFit="cover" showTitles keyboardNavigation={false}
              onSelect={item => readPerson(item.id)}
              ariaLabel="十三位校史人物流动照片墙"
            />
          </div>
        </div>
        <div className="people-wall-caption"><p>点击肖像，读懂他们留下的学问。</p><span>八大学者 · 五大奠基人</span></div>
        <div className="people-directory" id="people-directory" role="group" aria-label="按姓名阅读人物档案">
          {visiblePeople.map(person => (
            <button type="button" key={person.id} aria-pressed={selected.id === person.id}
              aria-controls="scholar-profile" onClick={() => readPerson(person.id)}>
              {person.name}<span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
        <p className="people-count" role="status">当前展示 {visiblePeople.length} 位 · {groups.find(item => item.id === group).title}</p>
      </div>

      <article className="scholar-archive people-profile" id="scholar-profile" ref={profileRef} aria-labelledby="scholar-profile-title">
        <div className="people-profile-header">
          <div className="people-profile-photo"><img src={portrait(selected)} alt={`${selected.name}的历史肖像`} width="200" height="260" loading="lazy" decoding="async" /></div>
          <div className="scholar-archive-intro">
            <div className="archive-title-mask"><h3 id="scholar-profile-title" ref={profileTitleRef} tabIndex={-1}>{selected.name}</h3></div>
            <p className="people-profile-group">{selected.groupTitle} · 人物档案</p>
            <p className="people-profile-meta">{selected.field}{selected.years ? ` / ${selected.years}` : ''}</p>
            <p className="archive-summary">{selected.summary}</p>
          </div>
        </div>
        <div className="people-profile-body">
          <div className="scholar-archive-achievements">
            <div className="archive-achievements-heading"><h4>留给学校的学问</h4></div>
            {selected.contributions.map(item => (
              <div className="archive-achievement" key={item.title}>
                <div><h5>{item.title}</h5><p>{item.text}</p></div>
              </div>
            ))}
          </div>
          <div className="people-life">
            <h4>生平足迹</h4>
            <ol className="people-timeline">
              {selected.timeline.map((item, index) => <li key={`${item.year}-${index}`}><span>{item.year}</span><div><h5>{item.title}</h5><p>{item.text}</p></div></li>)}
            </ol>
            <details className="people-biography" key={selected.id}>
              <summary>阅读人物生平<span aria-hidden="true">＋</span></summary>
              {selected.biography.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </details>
          </div>
        </div>
        <div className="people-profile-footer">
          <a className="archive-source" href={selected.sources[0].url} target="_blank" rel="noreferrer noopener">查阅原始史料 ↗</a>
          <a href="#scholars">返回人物墙 ↑</a>
        </div>
      </article>
    </>
  );
});

export default PeopleExplorer;
