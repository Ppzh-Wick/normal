import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import DriftWall from './DriftWall';
import { people, portrait } from '../data/people';
import { isPlainClick, personHref } from '../utils/personRoutes';
import './PeopleExplorer.css';

const groups = [
  { id: 'all', title: '全部人物', count: 13 },
  { id: 'scholars', title: '八大学者', count: 8 },
  { id: 'founders', title: '五大奠基人', count: 5 },
];

const PeopleExplorer = forwardRef(function PeopleExplorer({ onPauseChange, onOpenPerson, initialGallery, active = true }, ref) {
  const [group, setGroup] = useState(initialGallery?.group || 'all');
  const [selectedId, setSelectedId] = useState(initialGallery?.selectedId || people[0].id);
  const [paused, setPaused] = useState(initialGallery?.paused || false);
  const [columns, setColumns] = useState(5);
  const wallRef = useRef(null);
  const selected = people.find(person => person.id === selectedId) || people[0];
  const visiblePeople = useMemo(() => people.filter(person => group === 'all' || person.group === group), [group]);
  const items = useMemo(() => visiblePeople.map(person => ({
    id: person.id, image: portrait(person), title: person.name,
    alt: `${person.name}的历史肖像`,
    objectPosition: '50% 50%',
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
    setSelectedId(id);
    onOpenPerson(id, { group, paused, selectedId: id });
  };
  useImperativeHandle(ref, () => ({ openProfile: readPerson }), [group, paused, onOpenPerson]);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (!width) return;
      setColumns(width < 600 ? 2 : width < 900 ? 3 : width < 1100 ? 4 : width < 1320 ? 5 : width < 1600 ? 6 : 7);
    });
    if (wallRef.current) observer.observe(wallRef.current);
    return () => observer.disconnect();
  }, []);

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
            onClick={() => { setPaused(!paused); onPauseChange?.(!paused); }}>
            <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{paused ? '继续流动' : '暂停流动'}
          </button>
        </div>
        <div className="people-wall-entry">
          <div className="people-wall-stage" id="people-wall" ref={wallRef}>
            <DriftWall
              items={items} columns={columns} tileWidth={columns === 2 ? 145 : columns === 3 ? 205 : columns === 4 ? 220 : 200} tileHeight={columns === 2 ? 168 : 204} gap={24}
              tilt={8} turn={-8} perspective={1600} depth={160} planeScale={1} speed={26}
              direction="up" variance={0.3} parallax={0.3} lift={18}
              fade={0.12} dim={0.94} overlayColor="#180c0f" radius={0}
              roll={0} pauseOnHover={false} grayscale paused={!active || paused}
              imageFit="contain" showTitles keyboardNavigation={false}
              onSelect={item => readPerson(item.id)}
              ariaLabel="十三位校史人物流动照片墙"
            />
          </div>
        </div>
        <div className="people-wall-caption"><p>点击肖像，走进人物专题。</p><span>八大学者 · 五大奠基人</span></div>
        <div className="people-directory" id="people-directory" role="group" aria-label="按姓名阅读人物档案">
          {visiblePeople.map(person => (
            <a key={person.id} id={`person-link-${person.id}`} href={personHref(person.id)}
              className={selected.id === person.id ? 'is-selected' : ''}
              onClick={event => { if (isPlainClick(event)) { event.preventDefault(); readPerson(person.id); } }}>
              {person.name}<span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <p className="people-count" role="status">当前展示 {visiblePeople.length} 位 · {groups.find(item => item.id === group).title}</p>
      </div>


    </>
  );
});

export default PeopleExplorer;
