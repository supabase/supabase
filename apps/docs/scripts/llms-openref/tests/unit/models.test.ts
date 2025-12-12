/**
 * Unit tests for core data models
 */

import { describe, it, expect } from 'vitest';

import {
  createSpecData,
  getOperationById,
  getOperationsByIds,
  getTotalExamples,
  hasOperation,
  getSpotlightExamples,
  addOperationToCategory,
  createCategorizedOperations,
} from '../../src/core/models.js';
import type { Operation, Example, SpecInfo } from '../../src/core/models.js';

describe('SpecData Models', () => {
  const mockInfo: SpecInfo = {
    id: 'test-sdk',
    title: 'Test SDK',
    description: 'Test Description',
    slugPrefix: '/',
    libraries: [],
  };

  const mockExample1: Example = {
    id: 'ex1',
    name: 'Example 1',
    code: 'const x = 1;',
    description: 'Test example',
    dataSql: 'CREATE TABLE test',
    response: '{"success": true}',
    isSpotlight: true,
  };

  const mockExample2: Example = {
    id: 'ex2',
    name: 'Example 2',
    code: 'const y = 2;',
    description: '',
    dataSql: '',
    response: '',
    isSpotlight: false,
  };

  const mockOperation1: Operation = {
    id: 'op1',
    title: 'Operation 1',
    description: 'First operation',
    notes: '',
    examples: [mockExample1, mockExample2],
    overwriteParams: [],
  };

  const mockOperation2: Operation = {
    id: 'op2',
    title: 'Operation 2',
    description: 'Second operation',
    notes: 'Some notes',
    examples: [mockExample1],
    overwriteParams: [],
  };

  describe('createSpecData', () => {
    it('should create spec data with cached maps', () => {
      const specData = createSpecData(mockInfo, [mockOperation1, mockOperation2]);

      expect(specData.info).toBe(mockInfo);
      expect(specData.operations).toHaveLength(2);
      expect(specData._operationMap).toBeDefined();
      expect(specData._operationMap?.size).toBe(2);
      expect(specData._totalExamples).toBe(3);
    });

    it('should handle empty operations', () => {
      const specData = createSpecData(mockInfo, []);

      expect(specData.operations).toHaveLength(0);
      expect(specData._operationMap?.size).toBe(0);
      expect(specData._totalExamples).toBe(0);
    });
  });

  describe('getOperationById', () => {
    it('should find operation by ID using cached map (O(1))', () => {
      const specData = createSpecData(mockInfo, [mockOperation1, mockOperation2]);

      const op = getOperationById(specData, 'op1');

      expect(op).toBe(mockOperation1);
      expect(op?.id).toBe('op1');
    });

    it('should return undefined for non-existent operation', () => {
      const specData = createSpecData(mockInfo, [mockOperation1]);

      const op = getOperationById(specData, 'nonexistent');

      expect(op).toBeUndefined();
    });

    it('should build cache on first access if not pre-built', () => {
      const specData = createSpecData(mockInfo, [mockOperation1]);
      specData._operationMap = undefined; // Simulate no cache

      const op = getOperationById(specData, 'op1');

      expect(op).toBe(mockOperation1);
      expect(specData._operationMap).toBeDefined();
      expect(specData._operationMap?.size).toBe(1);
    });
  });

  describe('getOperationsByIds', () => {
    it('should get multiple operations efficiently', () => {
      const specData = createSpecData(mockInfo, [mockOperation1, mockOperation2]);

      const ops = getOperationsByIds(specData, ['op1', 'op2']);

      expect(ops).toHaveLength(2);
      expect(ops[0]).toBe(mockOperation1);
      expect(ops[1]).toBe(mockOperation2);
    });

    it('should skip non-existent operations', () => {
      const specData = createSpecData(mockInfo, [mockOperation1]);

      const ops = getOperationsByIds(specData, ['op1', 'nonexistent', 'op2']);

      expect(ops).toHaveLength(1);
      expect(ops[0]).toBe(mockOperation1);
    });

    it('should return empty array for no matches', () => {
      const specData = createSpecData(mockInfo, [mockOperation1]);

      const ops = getOperationsByIds(specData, ['nonexistent']);

      expect(ops).toHaveLength(0);
    });
  });

  describe('getTotalExamples', () => {
    it('should return cached total examples count (O(1))', () => {
      const specData = createSpecData(mockInfo, [mockOperation1, mockOperation2]);

      const total = getTotalExamples(specData);

      expect(total).toBe(3);
      expect(specData._totalExamples).toBe(3);
    });

    it('should calculate and cache if not pre-computed', () => {
      const specData = createSpecData(mockInfo, [mockOperation1, mockOperation2]);
      specData._totalExamples = undefined; // Simulate no cache

      const total = getTotalExamples(specData);

      expect(total).toBe(3);
      expect(specData._totalExamples).toBe(3);
    });
  });

  describe('hasOperation', () => {
    it('should check operation existence (O(1))', () => {
      const specData = createSpecData(mockInfo, [mockOperation1]);

      expect(hasOperation(specData, 'op1')).toBe(true);
      expect(hasOperation(specData, 'nonexistent')).toBe(false);
    });
  });

  describe('getSpotlightExamples', () => {
    it('should filter spotlight examples', () => {
      const spotlights = getSpotlightExamples(mockOperation1);

      expect(spotlights).toHaveLength(1);
      expect(spotlights[0]).toBe(mockExample1);
    });

    it('should return empty array if no spotlights', () => {
      const opNoSpotlight: Operation = {
        ...mockOperation1,
        examples: [mockExample2],
      };

      const spotlights = getSpotlightExamples(opNoSpotlight);

      expect(spotlights).toHaveLength(0);
    });
  });

  describe('CategorizedOperations', () => {
    it('should create empty categorized operations', () => {
      const categorized = createCategorizedOperations();

      expect(categorized.size).toBe(0);
    });

    it('should add operation to category', () => {
      const categorized = createCategorizedOperations();

      addOperationToCategory(categorized, 'database', mockOperation1);

      expect(categorized.get('database')).toHaveLength(1);
      expect(categorized.get('database')?.[0]).toBe(mockOperation1);
    });

    it('should append to existing category', () => {
      const categorized = createCategorizedOperations();

      addOperationToCategory(categorized, 'database', mockOperation1);
      addOperationToCategory(categorized, 'database', mockOperation2);

      expect(categorized.get('database')).toHaveLength(2);
    });
  });
});
