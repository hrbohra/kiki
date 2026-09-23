import { describe, it, expect } from 'vitest';
import { commitmentsProblem, commitmentSummary, houseListSections, HOUSE_LISTS, bundledHouseList } from '../domain/houseList';
import { listings } from '../domain/fixtures';

describe('house list', () => {
  it('every seeded listing has a list, and item ids are unique', () => {
    for (const l of listings) expect(bundledHouseList(l.id).length, l.id).toBeGreaterThan(0);
    const ids = Object.values(HOUSE_LISTS).flat().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('splits into rules, things they would love, and what you would look after', () => {
    const v = houseListSections(HOUSE_LISTS['l-danica']);
    expect(v.rules.length).toBe(2);
    expect(v.love.length).toBe(1);
    expect(v.care.map((c) => c.text)).toEqual(['Feed Miso morning and evening', 'Fresh water and a clean litter tray daily']);
  });

  it('a request must agree to every care item and nothing else', () => {
    const items = HOUSE_LISTS['l-danica'];
    const care = items.filter((i) => i.section === 'care').map((i) => i.id);
    expect(commitmentsProblem(items, [])).toMatch(/all 2/);
    expect(commitmentsProblem(items, [care[0]])).toMatch(/one thing/);
    expect(commitmentsProblem(items, [...care, 'l-emma:care:1'])).toMatch(/not something/);
    expect(commitmentsProblem(items, [items[0].id, ...care])).toMatch(/not something/); // a rule is not a commitment
    expect(commitmentsProblem(items, care)).toBeNull();
    expect(commitmentsProblem(HOUSE_LISTS['l-ollie'], [])).toBeNull(); // nothing to look after
  });

  it('names what a guest agreed to in one readable line', () => {
    const items = HOUSE_LISTS['l-danica'];
    const care = items.filter((i) => i.section === 'care').map((i) => i.id);
    expect(commitmentSummary(items, care)).toBe('Feed Miso morning and evening and fresh water and a clean litter tray daily');
    expect(commitmentSummary(items, [])).toBe('');
  });
});
