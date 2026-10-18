import {describe,expect,it} from 'vitest';
import {isUnlocked,gradeAnswers,streakAfter} from '../src/lib/domain';
describe('learning rules',()=>{
  it('requires every prerequisite',()=>{
    expect(isUnlocked(['a','b'],['a'])).toBe(false);
    expect(isUnlocked(['a','b'],['a','b'])).toBe(true);
    expect(isUnlocked([],[])).toBe(true);
  });
  it('rejects missing and forged answers',()=>{
    expect(gradeAnswers([{id:'q1',answer:'b'},{id:'q2',answer:'const'}],{q1:'b'})).toBe(false);
    expect(gradeAnswers([{id:'q1',answer:'b'}],{q1:'a'})).toBe(false);
    expect(gradeAnswers([{id:'q1',answer:'b'}],{q1:'b'})).toBe(true);
    expect(gradeAnswers([],{q1:'b'})).toBe(false);
  });
  it('counts unique UTC activity dates and breaks gaps',()=>{
    expect(streakAfter('2026-10-17',3,'2026-10-18')).toBe(4);
    expect(streakAfter('2026-10-18',4,'2026-10-18')).toBe(4);
    expect(streakAfter('2026-10-15',4,'2026-10-18')).toBe(1);
    expect(streakAfter(null,0,'2026-10-18')).toBe(1);
  });
});
