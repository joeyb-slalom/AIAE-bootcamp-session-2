const { db, validators } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

describe('TODO validators', () => {
  describe('isValidTitle', () => {
    it('returns true for non-empty string titles', () => {
      expect(validators.isValidTitle('Plan sprint review')).toBe(true);
      expect(validators.isValidTitle('  Buy milk  ')).toBe(true);
    });

    it('returns false for empty or invalid titles', () => {
      expect(validators.isValidTitle('')).toBe(false);
      expect(validators.isValidTitle('   ')).toBe(false);
      expect(validators.isValidTitle(undefined)).toBe(false);
      expect(validators.isValidTitle(null)).toBe(false);
      expect(validators.isValidTitle(9)).toBe(false);
    });
  });

  describe('normalizeDueDateInput', () => {
    it('marks undefined due date as omitted', () => {
      expect(validators.normalizeDueDateInput(undefined)).toEqual({
        hasValue: false,
        value: null,
      });
    });

    it('returns null for blank or null due date values', () => {
      expect(validators.normalizeDueDateInput(null)).toEqual({
        hasValue: true,
        value: null,
      });
      expect(validators.normalizeDueDateInput('')).toEqual({
        hasValue: true,
        value: null,
      });
    });

    it('returns normalized date for valid YYYY-MM-DD values', () => {
      expect(validators.normalizeDueDateInput('2026-12-01')).toEqual({
        hasValue: true,
        value: '2026-12-01',
      });
    });

    it('returns error for invalid due date format or value', () => {
      expect(validators.normalizeDueDateInput('12/01/2026').error).toContain('Invalid due date format');
      expect(validators.normalizeDueDateInput('2026-02-30').error).toContain('Invalid due date value');
      expect(validators.normalizeDueDateInput(123).error).toContain('Due date must be a string');
    });
  });
});