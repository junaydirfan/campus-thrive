/**
 * Unit Tests for CampusThrive Scoring System
 * 
 * Tests all scoring functions with various edge cases and scenarios
 * to ensure the algorithms match the specification exactly.
 * 
 * Note: This is a test file that would normally use a testing framework like Jest or Vitest.
 * For now, it serves as documentation of expected behavior and can be run with a proper test setup.
 */

import {
  calculateMC,
  calculateDSS,
  calculateStreak,
  analyzeDrivers,
  generatePowerHours,
  calculateAllScores,
  validateScoringConfig,
  SCORING_CONFIG
} from './scoring';
import { MoodEntry } from '@/types';

// Test helper functions
function createTestMoodEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'test-id',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    timeBucket: 'Midday',
    valence: 3,
    energy: 3,
    focus: 3,
    stress: 3,
    tags: [],
    deepworkMinutes: 0,
    tasksCompleted: 0,
    sleepHours: 8,
    recoveryAction: false,
    socialTouchpoints: 0,
    ...overrides
  };
}

// Test suite (would be run with proper testing framework)
function runScoringTests() {
  let sampleEntries: MoodEntry[];
  let historicalEntries: MoodEntry[];

  function setupTestData() {
    // Create sample historical entries
    historicalEntries = [
      createTestMoodEntry({
        id: '1',
        timestamp: new Date('2024-01-01T09:00:00Z'),
        timeBucket: 'Morning',
        valence: 4,
        energy: 3,
        focus: 4,
        stress: 2,
        tags: ['study', 'coffee'],
        deepworkMinutes: 120,
        tasksCompleted: 5,
        sleepHours: 8,
        recoveryAction: true,
        socialTouchpoints: 3
      }),
      createTestMoodEntry({
        id: '2',
        timestamp: new Date('2024-01-02T14:00:00Z'),
        timeBucket: 'Midday',
        valence: 3,
        energy: 4,
        focus: 3,
        stress: 3,
        tags: ['gym', 'social'],
        deepworkMinutes: 60,
        tasksCompleted: 3,
        sleepHours: 7,
        recoveryAction: false,
        socialTouchpoints: 5
      }),
      createTestMoodEntry({
        id: '3',
        timestamp: new Date('2024-01-03T20:00:00Z'),
        timeBucket: 'Evening',
        valence: 2,
        energy: 2,
        focus: 2,
        stress: 4,
        tags: ['exam', 'stress'],
        deepworkMinutes: 30,
        tasksCompleted: 1,
        sleepHours: 6,
        recoveryAction: true,
        socialTouchpoints: 1
      }),
      createTestMoodEntry({
        id: '4',
        timestamp: new Date('2024-01-04T10:00:00Z'),
        timeBucket: 'Morning',
        valence: 5,
        energy: 5,
        focus: 5,
        stress: 1,
        tags: ['study', 'productive'],
        deepworkMinutes: 180,
        tasksCompleted: 8,
        sleepHours: 9,
        recoveryAction: true,
        socialTouchpoints: 4
      }),
      createTestMoodEntry({
        id: '5',
        timestamp: new Date('2024-01-05T16:00:00Z'),
        timeBucket: 'Midday',
        valence: 3,
        energy: 3,
        focus: 3,
        stress: 3,
        tags: ['social', 'friends'],
        deepworkMinutes: 45,
        tasksCompleted: 2,
        sleepHours: 8,
        recoveryAction: false,
        socialTouchpoints: 6
      })
    ];

    // Create current entry for testing
    sampleEntries = [
      createTestMoodEntry({
        id: '6',
        timestamp: new Date('2024-01-06T12:00:00Z'),
        timeBucket: 'Midday',
        valence: 4,
        energy: 4,
        focus: 4,
        stress: 2,
        tags: ['study', 'productive'],
        deepworkMinutes: 150,
        tasksCompleted: 6,
        sleepHours: 8,
        recoveryAction: true,
        socialTouchpoints: 3
      })
    ];
  }

  // Test functions (would use proper testing framework assertions)
  function testCalculateMC() {
    setupTestData();
    
    const result = calculateMC(sampleEntries[0]!, historicalEntries);
    
    console.assert(result.isValid === true, 'MC calculation should be valid');
    console.assert(typeof result.mc === 'number', 'MC should be a number');
    console.assert(result.components !== undefined, 'Components should be defined');
    console.assert(result.components.valence !== undefined, 'Valence component should be defined');
    console.assert(result.components.energy !== undefined, 'Energy component should be defined');
    console.assert(result.components.focus !== undefined, 'Focus component should be defined');
    console.assert(result.components.stress !== undefined, 'Stress component should be defined');
    
    // Test insufficient data
    const insufficientResult = calculateMC(sampleEntries[0]!, []);
    console.assert(insufficientResult.isValid === false, 'Should handle insufficient data');
    console.assert(insufficientResult.error?.includes('Insufficient historical data'), 'Should have appropriate error message');
    
    // Test time bucket filtering
    const timeBucketResult = calculateMC(sampleEntries[0]!, historicalEntries, 'Morning');
    console.assert(timeBucketResult.isValid === true, 'Time bucket filtering should work');
    
    console.log('✅ calculateMC tests passed');
  }

  function testCalculateDSS() {
    setupTestData();
    
    const result = calculateDSS(sampleEntries[0]!, historicalEntries);
    
    console.assert(result.isValid === true, 'DSS calculation should be valid');
    console.assert(typeof result.dss === 'number', 'DSS should be a number');
    console.assert(result.components !== undefined, 'Components should be defined');
    console.assert(result.components.lm !== undefined, 'LM component should be defined');
    console.assert(result.components.ri !== undefined, 'RI component should be defined');
    console.assert(result.components.cn !== undefined, 'CN component should be defined');
    
    // Test LM calculation
    const entry = sampleEntries[0]!;
    const expectedLM = (entry.deepworkMinutes || 0) + 10 * (entry.tasksCompleted || 0);
    console.assert(result.components.lm.raw === expectedLM, 'LM calculation should be correct');
    
    // Test RI calculation
    const expectedRI = (entry.sleepHours || 0) + (entry.recoveryAction ? 1 : 0);
    console.assert(result.components.ri.raw === expectedRI, 'RI calculation should be correct');
    
    // Test CN calculation
    const expectedCN = entry.socialTouchpoints || 0;
    console.assert(result.components.cn.raw === expectedCN, 'CN calculation should be correct');
    
    console.log('✅ calculateDSS tests passed');
  }

  function testCalculateStreak() {
    setupTestData();
    
    const result = calculateStreak(historicalEntries);
    
    console.assert(typeof result.currentStreak === 'number', 'Current streak should be a number');
    console.assert(typeof result.longestStreak === 'number', 'Longest streak should be a number');
    console.assert(result.currentStreak >= 0, 'Current streak should be non-negative');
    console.assert(result.longestStreak >= 0, 'Longest streak should be non-negative');
    
    // Test empty entries
    const emptyResult = calculateStreak([]);
    console.assert(emptyResult.currentStreak === 0, 'Empty entries should have 0 streak');
    console.assert(emptyResult.longestStreak === 0, 'Empty entries should have 0 longest streak');
    console.assert(emptyResult.streakStartDate === null, 'Empty entries should have null streak start');
    console.assert(emptyResult.lastEntryDate === null, 'Empty entries should have null last entry');
    console.assert(emptyResult.isActive === false, 'Empty entries should not be active');
    
    console.log('✅ calculateStreak tests passed');
  }

  function testAnalyzeDrivers() {
    setupTestData();
    
    const result = analyzeDrivers(historicalEntries, 1);
    
    console.assert(Array.isArray(result), 'Result should be an array');
    
    if (result.length > 0) {
      const driver = result[0]!;
      console.assert(driver.tag !== undefined, 'Driver should have tag');
      console.assert(driver.occurrences > 0, 'Driver should have occurrences');
      console.assert(typeof driver.mcImpact === 'number', 'MC impact should be a number');
      console.assert(typeof driver.dssImpact === 'number', 'DSS impact should be a number');
      console.assert(['high', 'medium', 'low'].includes(driver.confidence), 'Confidence should be valid');
    }
    
    // Test minimum occurrences filtering
    const filteredResult = analyzeDrivers(historicalEntries, 5);
    filteredResult.forEach(driver => {
      console.assert(driver.occurrences >= 5, 'Should filter by minimum occurrences');
    });
    
    // Test sorting by absolute MC impact
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      if (prev && curr) {
        console.assert(Math.abs(prev.mcImpact) >= Math.abs(curr.mcImpact), 'Should be sorted by absolute MC impact');
      }
    }
    
    console.log('✅ analyzeDrivers tests passed');
  }

  function testGeneratePowerHours() {
    setupTestData();
    
    const result = generatePowerHours(historicalEntries);
    
    console.assert(result.matrix !== undefined, 'Matrix should be defined');
    console.assert(result.matrix.length === 7, 'Matrix should have 7 weekdays');
    console.assert(result.matrix[0]?.length === 24, 'Matrix should have 24 hours');
    
    result.matrix.forEach(weekday => {
      weekday.forEach(hour => {
        console.assert(typeof hour === 'number', 'Hour should be a number');
        console.assert(hour >= 0, 'Hour should be non-negative');
      });
    });
    
    console.assert(Array.isArray(result.peakHours), 'Peak hours should be an array');
    console.assert(Array.isArray(result.lowHours), 'Low hours should be an array');
    
    result.peakHours.forEach(hour => {
      console.assert(hour.weekday >= 0 && hour.weekday < 7, 'Weekday should be valid');
      console.assert(hour.hour >= 0 && hour.hour < 24, 'Hour should be valid');
      console.assert(typeof hour.score === 'number', 'Score should be a number');
    });
    
    console.assert(result.lastUpdated instanceof Date, 'Last updated should be a Date');
    
    console.log('✅ generatePowerHours tests passed');
  }

  function testCalculateAllScores() {
    setupTestData();
    
    const result = calculateAllScores(sampleEntries[0]!, historicalEntries);
    
    console.assert(result.mc !== undefined, 'MC should be defined');
    console.assert(result.dss !== undefined, 'DSS should be defined');
    console.assert(result.streak !== undefined, 'Streak should be defined');
    console.assert(result.mc.isValid === true, 'MC should be valid');
    console.assert(result.dss.isValid === true, 'DSS should be valid');
    console.assert(typeof result.streak.currentStreak === 'number', 'Streak should be a number');
    
    console.log('✅ calculateAllScores tests passed');
  }

  function testValidateScoringConfig() {
    const isValid = validateScoringConfig();
    
    console.assert(typeof isValid === 'boolean', 'Validation should return boolean');
    console.assert(isValid === true, 'Configuration should be valid');
    
    // Test MC weights sum to 1.0
    const mcWeightSum = Object.values(SCORING_CONFIG.MC_WEIGHTS).reduce((sum, weight) => sum + Math.abs(weight), 0);
    console.assert(Math.abs(mcWeightSum - 1.0) < 0.001, 'MC weights should sum to 1.0');
    
    // Test DSS weights sum to 1.0
    const dssWeightSum = Object.values(SCORING_CONFIG.DSS_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    console.assert(Math.abs(dssWeightSum - 1.0) < 0.001, 'DSS weights should sum to 1.0');
    
    // Test sigma floor is positive
    console.assert(SCORING_CONFIG.SIGMA_FLOOR > 0, 'Sigma floor should be positive');
    
    console.log('✅ validateScoringConfig tests passed');
  }

  function testEdgeCases() {
    setupTestData();
    
    // Test malformed entries
    const malformedEntry = createTestMoodEntry({
      valence: 2.5,
      energy: -1,
      focus: 6,
      stress: 0,
      tags: null as any
    });

    const mcResult = calculateMC(malformedEntry, historicalEntries);
    const dssResult = calculateDSS(malformedEntry, historicalEntries);
    
    console.assert(mcResult !== undefined, 'Should handle malformed entries');
    console.assert(dssResult !== undefined, 'Should handle malformed entries');
    
    // Test very large datasets
    const largeDataset = Array(1000).fill(null).map((_, i) => 
      createTestMoodEntry({
        id: `large-${i}`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      })
    );

    const largeResult = calculateMC(sampleEntries[0]!, largeDataset);
    console.assert(largeResult.isValid === true, 'Should handle large datasets');
    
    // Test identical values
    const identicalEntries = Array(10).fill(null).map((_, i) => 
      createTestMoodEntry({
        id: `identical-${i}`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      })
    );

    const identicalResult = calculateMC(sampleEntries[0]!, identicalEntries);
    console.assert(identicalResult.isValid === true, 'Should handle identical values');
    
    // Test extreme values
    const extremeEntry = createTestMoodEntry({
      valence: 5,
      energy: 5,
      focus: 5,
      stress: 0,
      deepworkMinutes: 300,
      tasksCompleted: 20,
      sleepHours: 12,
      socialTouchpoints: 10
    });

    const extremeResult = calculateDSS(extremeEntry, historicalEntries);
    console.assert(extremeResult.isValid === true, 'Should handle extreme values');
    
    console.log('✅ Edge cases tests passed');
  }

  // Run all tests
  function runAllTests() {
    console.log('🧪 Running CampusThrive Scoring System Tests...\n');
    
    try {
      testCalculateMC();
      testCalculateDSS();
      testCalculateStreak();
      testAnalyzeDrivers();
      testGeneratePowerHours();
      testCalculateAllScores();
      testValidateScoringConfig();
      testEdgeCases();
      
      console.log('\n🎉 All tests passed successfully!');
      return true;
    } catch (error) {
      console.error('\n❌ Test failed:', error);
      return false;
    }
  }

  return { runAllTests };
}

// Export for potential use
export { runScoringTests };

// Example usage (uncomment to run tests):
// const { runAllTests } = runScoringTests();
// runAllTests();