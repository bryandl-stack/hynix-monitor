import { describe, expect, test } from 'vitest';
import { crossedThreshold } from '@/lib/alerts';

describe('crossedThreshold', () => {
  test('임계치를 새로 넘어서면 true', () => {
    expect(crossedThreshold(2, 3.5, 3)).toBe(true);
  });

  test('이미 임계치 위였으면 false (스팸 방지)', () => {
    expect(crossedThreshold(4, 5, 3)).toBe(false);
  });

  test('임계치 아래로 유지되면 false', () => {
    expect(crossedThreshold(1, 2, 3)).toBe(false);
  });

  test('음수 방향 괴리율도 절댓값 기준으로 판단', () => {
    expect(crossedThreshold(-2, -3.5, 3)).toBe(true);
  });

  test('현재값이 null이면 false', () => {
    expect(crossedThreshold(5, null, 3)).toBe(false);
  });

  test('이전값이 없으면(null) 현재값만으로 판단', () => {
    expect(crossedThreshold(null, 4, 3)).toBe(true);
  });
});
