/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// In-memory polyfill for Node.js test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: store.size,
  } as any;
}

import { walletService } from '../services/walletService';
import { rewardService } from '../services/rewardService';
import { gameService } from '../services/gameService';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runPart6Tests() {
  console.log('\n================================================================');
  console.log('NILPHA SOCIAL — PART 6 AUTOMATED VERIFICATION SUITE');
  console.log('Testing: Games Hub, Wallet, Ledger, Rewards, Challenges, Referrals');
  console.log('================================================================\n');

  const testUserA = 'test-player-alice-' + Date.now();
  const testUserB = 'test-player-bob-' + Date.now();

  // --------------------------------------------------------------------------
  // 1. Initial 200 Demo Coins Grant Exactly Once
  // --------------------------------------------------------------------------
  console.log('1. Demo Coin Wallet & Initial 200 Grant:');
  const walletA = await walletService.getWallet(testUserA);
  assert(walletA.balance === 200, 'New user receives initial 200 demo coins grant');
  assert(walletA.total_earned === 200, 'Initial 200 coins are recorded in total_earned');
  assert(walletA.total_spent === 0, 'Initial total_spent is zero');

  // Verify calling getWallet again does not duplicate the grant
  const walletARecheck = await walletService.getWallet(testUserA);
  assert(walletARecheck.balance === 200, 'Subsequent getWallet calls do NOT duplicate starting balance');

  // --------------------------------------------------------------------------
  // 2. Auditable Ledger & Atomic Transaction Rules
  // --------------------------------------------------------------------------
  console.log('\n2. Auditable Coin Transactions & Ledger:');
  // Credit test
  const creditTx = await walletService.executeTransaction(
    testUserA,
    50,
    'game_reward',
    'Mini Car Racing Score Reward',
    `test-tx-credit-${Date.now()}`
  );
  assert(creditTx.success === true, 'Credit transaction of +50 succeeds');
  assert(creditTx.balance_after === 250, 'Balance after credit is 250');

  // Debit test
  const debitTx = await walletService.executeTransaction(
    testUserA,
    -30,
    'game_entry',
    'Seven Up Demo Round Play',
    `test-tx-debit-${Date.now()}`
  );
  assert(debitTx.success === true, 'Debit transaction of -30 succeeds');
  assert(debitTx.balance_after === 220, 'Balance after debit is 220');

  // Non-negative balance check
  const overspendTx = await walletService.executeTransaction(
    testUserA,
    -9999,
    'game_entry',
    'Illegal Overdraft Attempt',
    `test-tx-overspend-${Date.now()}`
  );
  assert(overspendTx.success === false, 'Overspending below 0 is blocked (no negative balances)');

  // Verify transactions ledger count
  const history = await walletService.getTransactions(testUserA);
  assert(history.length >= 3, 'Transaction history ledger records all credits and debits');

  // --------------------------------------------------------------------------
  // 3. Idempotency Key Duplicate Rejection
  // --------------------------------------------------------------------------
  console.log('\n3. Transaction Idempotency & Replay Protection:');
  const idempotencyKey = `unique-idem-${Date.now()}`;
  const firstTry = await walletService.executeTransaction(
    testUserA,
    10,
    'challenge_reward',
    'Challenge reward test',
    idempotencyKey
  );
  assert(firstTry.success === true, 'First attempt with idempotency key succeeds');

  const replayTry = await walletService.executeTransaction(
    testUserA,
    10,
    'challenge_reward',
    'Challenge reward replay',
    idempotencyKey
  );
  assert(replayTry.success === false, 'Duplicate transaction with identical idempotency key is rejected');

  // --------------------------------------------------------------------------
  // 4. Daily Check-in Streak & Claim Verification
  // --------------------------------------------------------------------------
  console.log('\n4. Daily Check-in 7-Day Streak & Claim:');
  const initialStatus = await rewardService.getDailyCheckinStatus(testUserA);
  assert(initialStatus.todayClaimed === false, 'Daily check-in is initially unclaimed today');

  const claimResult = await rewardService.claimDailyCheckin(testUserA);
  assert(claimResult.success === true, 'Daily check-in claim succeeds');
  assert(claimResult.rewardCoins === 10, 'Day 1 daily check-in awards +10 demo coins');

  // Verify duplicate claim on same day is rejected
  const duplicateClaim = await rewardService.claimDailyCheckin(testUserA);
  assert(duplicateClaim.success === false, 'Second daily check-in on the same day is rejected');

  const updatedStatus = await rewardService.getDailyCheckinStatus(testUserA);
  assert(updatedStatus.todayClaimed === true, 'todayClaimed is now true');
  assert(updatedStatus.streakCount === 1, 'streakCount incremented to 1');

  // --------------------------------------------------------------------------
  // 5. Daily Challenges Progress & Claim
  // --------------------------------------------------------------------------
  console.log('\n5. Challenges Tracking & Verification:');
  const challenges = await rewardService.getUserChallenges(testUserA);
  assert(challenges.length > 0, 'User receives initial daily and weekly challenges');

  // Attempt claiming an uncompleted challenge
  const uncompleted = challenges.find((c) => (c.progress ?? 0) < (c.target ?? 1));
  if (uncompleted) {
    const prematureClaim = await rewardService.claimChallenge(testUserA, uncompleted.id);
    assert(prematureClaim.success === false, 'Claiming an uncompleted challenge is rejected');
  }

  // --------------------------------------------------------------------------
  // 6. Referral System & Anti-Self-Referral
  // --------------------------------------------------------------------------
  console.log('\n6. Referral Code Generation & Anti-Abuse Rules:');
  const summaryA = await rewardService.getReferralSummary(testUserA);
  const codeA = summaryA.code || summaryA.referralCode;
  assert(codeA.startsWith('NILPHA-'), 'Generated referral code follows NILPHA-XXXXXX pattern');

  // Anti self-referral check
  const selfReferral = await rewardService.applyReferralCode(testUserA, codeA);
  assert(selfReferral.success === false, 'Self-referral is strictly prevented');

  // Bob using Alice\'s referral code
  const referralSuccess = await rewardService.applyReferralCode(testUserB, codeA);
  assert(referralSuccess.success === true, 'Friend applying valid referral code succeeds');
  assert(referralSuccess.rewardCoins === 100, 'Friend receives +100 bonus demo coins');

  // Prevent applying a second referral code
  const secondReferral = await rewardService.applyReferralCode(testUserB, codeA);
  assert(secondReferral.success === false, 'Applying multiple referral codes is blocked');

  // --------------------------------------------------------------------------
  // 7. Mini Games & Seven Up Demo Arena Mechanics
  // --------------------------------------------------------------------------
  console.log('\n7. Playable Mini Games & Seven Up Arena:');
  // Seven Up round simulation
  const sevenUpResult = await gameService.playSevenUpRound(testUserA, '7', 10);
  assert(sevenUpResult.dice1 >= 1 && sevenUpResult.dice1 <= 6, 'Dice 1 is within valid 1-6 range');
  assert(sevenUpResult.dice2 >= 1 && sevenUpResult.dice2 <= 6, 'Dice 2 is within valid 1-6 range');
  assert(sevenUpResult.diceSum === sevenUpResult.dice1 + sevenUpResult.dice2, 'Sum matches dice totals');
  assert((sevenUpResult.fairHash?.length ?? 0) === 64, 'Fair cryptographic SHA-256 verification hash generated');

  // Recording game session
  const session = await gameService.recordGameSession(
    testUserA,
    'car-racing',
    350,
    45
  );
  assert(session.score === 350, 'Game session score recorded accurately');
  assert(session.coins_rewarded > 0, 'Game reward coins awarded within daily cap');

  // Leaderboard retrieval
  const lb = await gameService.getLeaderboard('car-racing');
  assert(lb.length > 0, 'Leaderboard lists top scores');
  assert(lb[0].high_score >= 350, 'User high score appears on leaderboard');

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`ALL PART 6 TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
  console.log('================================================================\n');
}

runPart6Tests().catch((err) => {
  console.error('\nTest suite execution failed:', err);
  process.exit(1);
});
