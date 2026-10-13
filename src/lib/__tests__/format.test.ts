import { describe, expect, it } from 'vitest';
import { formatDateVN } from '../format';

describe('formatDateVN', () => {
  it('ISO YYYY-MM-DD -> DD/MM/YYYY', () => {
    expect(formatDateVN('2026-10-13')).toBe('13/10/2026');
    expect(formatDateVN('2026-09-05')).toBe('05/09/2026');
  });
  it('giữ nguyên chuỗi không đúng định dạng', () => {
    expect(formatDateVN('—')).toBe('—');
    expect(formatDateVN('')).toBe('');
  });
});
