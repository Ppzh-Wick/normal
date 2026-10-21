import { scholars } from './scholars.js';
import { founders } from './founders.js';

export const people = [
  ...scholars.map(person => ({ ...person, group: 'scholars', groupTitle: '八大学者' })),
  ...founders.map(person => ({ ...person, group: 'founders', groupTitle: '五大奠基人' })),
];

export const findPerson = id => people.find(person => person.id === id);
export const portrait = person => `${import.meta.env.BASE_URL}images/portraits/${person.id}.jpg`;
