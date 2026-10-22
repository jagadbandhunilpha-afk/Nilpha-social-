/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DemoCoinWallet, CoinTransaction, CoinTransactionType } from '../types';

const STORAGE_KEY_WALLET_PREFIX = 'nilpha_demo_wallet_';
const STORAGE_KEY_TX_PREFIX = 'nilpha_demo_transactions_';

export const walletService = {
  /**
   * Retrieves or initializes the user's demo coin wallet.
   * Every new account receives exactly 200 demo coins once.
   */
  async getWallet(userId: string): Promise<DemoCoinWallet> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Call stored procedure to ensure wallet exists and grant 200 coins exactly once
        const { data, error } = await supabase.rpc('ensure_user_demo_wallet', {
          p_user_id: userId,
        });

        if (!error && data?.success) {
          // Fetch full wallet details
          const { data: walletData, error: fetchErr } = await supabase
            .from('demo_coin_wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (!fetchErr && walletData) {
            return walletData as DemoCoinWallet;
          }
        }
      } catch (err) {
        console.warn('Supabase getWallet error, falling back to local:', err);
      }
    }

    // Local / Offline Fallback with strict 200 initial grant
    const walletKey = `${STORAGE_KEY_WALLET_PREFIX}${userId}`;
    const txKey = `${STORAGE_KEY_TX_PREFIX}${userId}`;

    try {
      const raw = localStorage.getItem(walletKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Local wallet read error:', err);
    }

    // Initialize initial 200 coins
    const initialWallet: DemoCoinWallet = {
      id: `wallet-${userId}`,
      user_id: userId,
      balance: 200,
      total_earned: 200,
      total_spent: 0,
      is_initial_granted: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const initialTx: CoinTransaction = {
      id: `tx-init-${Date.now()}`,
      wallet_id: initialWallet.id,
      user_id: userId,
      amount: 200,
      balance_after: 200,
      transaction_type: 'initial_grant',
      reason: 'স্বাগতম বোনাস: নতুন অ্যাকাউন্টের জন্য প্রাথমিক ২০০ ডেমো কয়েন উপহার (Welcome Bonus)',
      idempotency_key: `init_${userId}`,
      created_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem(walletKey, JSON.stringify(initialWallet));
      localStorage.setItem(txKey, JSON.stringify([initialTx]));
    } catch (err) {}

    return initialWallet;
  },

  /**
   * Retrieves the transaction history for a user.
   */
  async getTransactions(userId: string, limit = 50): Promise<CoinTransaction[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('demo_coin_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data as CoinTransaction[];
        }
      } catch (err) {
        console.warn('Supabase getTransactions error, fallback:', err);
      }
    }

    // Local fallback
    const txKey = `${STORAGE_KEY_TX_PREFIX}${userId}`;
    try {
      const raw = localStorage.getItem(txKey);
      if (raw) {
        const txs: CoinTransaction[] = JSON.parse(raw);
        return txs.slice(0, limit);
      }
    } catch (err) {}

    // If empty, return initial grant
    return [
      {
        id: `tx-init-${userId}`,
        wallet_id: `wallet-${userId}`,
        user_id: userId,
        amount: 200,
        balance_after: 200,
        transaction_type: 'initial_grant',
        reason: 'স্বাগতম বোনাস: নতুন অ্যাকাউন্টের জন্য প্রাথমিক ২০০ ডেমো কয়েন উপহার',
        idempotency_key: `init_${userId}`,
        created_at: new Date().toISOString(),
      },
    ];
  },

  /**
   * Executes an atomic coin transaction (credit or debit).
   * Validates balances, prevents negative balance, and enforces idempotency.
   */
  async executeTransaction(
    inputOrUserId:
      | {
          userId: string;
          amount: number;
          transactionType: CoinTransactionType;
          reason: string;
          referenceId?: string;
          idempotencyKey?: string;
        }
      | string,
    amountArg?: number,
    transactionTypeArg?: CoinTransactionType,
    reasonArg?: string,
    idempotencyKeyArg?: string,
    referenceIdArg?: string
  ): Promise<{ success: boolean; newBalance: number; balance_after: number; error?: string; isDuplicate?: boolean }> {
    let userId: string;
    let amount: number;
    let transactionType: CoinTransactionType;
    let reason: string;
    let referenceId: string | undefined;
    let idempotencyKey: string;

    if (typeof inputOrUserId === 'object') {
      userId = inputOrUserId.userId;
      amount = inputOrUserId.amount;
      transactionType = inputOrUserId.transactionType;
      reason = inputOrUserId.reason;
      referenceId = inputOrUserId.referenceId;
      idempotencyKey =
        inputOrUserId.idempotencyKey ||
        `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    } else {
      userId = inputOrUserId;
      amount = amountArg || 0;
      transactionType = transactionTypeArg || 'game_reward';
      reason = reasonArg || 'কয়েন লেনদেন';
      idempotencyKey =
        idempotencyKeyArg ||
        `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      referenceId = referenceIdArg;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('execute_coin_transaction', {
          p_user_id: userId,
          p_amount: Math.round(amount),
          p_type: transactionType,
          p_reason: reason,
          p_ref_id: referenceId || null,
          p_idempotency_key: idempotencyKey,
        });

        if (!error && data) {
          if (data.success) {
            return { success: true, newBalance: data.balance, balance_after: data.balance };
          }
          return { success: false, newBalance: 0, balance_after: 0, error: data.error };
        }
      } catch (err) {
        console.warn('Supabase executeTransaction error, falling back:', err);
      }
    }

    // Local / Offline Transaction Ledger Handling
    const wallet = await this.getWallet(userId);
    const walletKey = `${STORAGE_KEY_WALLET_PREFIX}${userId}`;
    const txKey = `${STORAGE_KEY_TX_PREFIX}${userId}`;

    let txs: CoinTransaction[] = [];
    try {
      const raw = localStorage.getItem(txKey);
      if (raw) txs = JSON.parse(raw);
    } catch (err) {}

    // Check duplicate idempotency key - reject duplicate replay
    const existing = txs.find((t) => t.idempotency_key === idempotencyKey);
    if (existing) {
      return {
        success: false,
        newBalance: existing.balance_after,
        balance_after: existing.balance_after,
        error: 'ডুপ্লিকেট ট্রানজ্যাকশন শনাক্ত হয়েছে (Duplicate idempotency key)',
        isDuplicate: true,
      };
    }

    const newBalance = wallet.balance + Math.round(amount);
    if (newBalance < 0) {
      return {
        success: false,
        newBalance: wallet.balance,
        balance_after: wallet.balance,
        error: 'অপর্যাপ্ত ডেমো কয়েন ব্যালেন্স (Insufficient coin balance)',
      };
    }

    // Update wallet
    wallet.balance = newBalance;
    if (amount > 0) {
      wallet.total_earned += Math.round(amount);
    } else {
      wallet.total_spent += Math.abs(Math.round(amount));
    }
    wallet.updated_at = new Date().toISOString();

    // Create ledger entry
    const newTx: CoinTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      wallet_id: wallet.id,
      user_id: userId,
      amount: Math.round(amount),
      balance_after: newBalance,
      transaction_type: transactionType,
      reason,
      reference_id: referenceId || null,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
    };

    txs.unshift(newTx);

    try {
      localStorage.setItem(walletKey, JSON.stringify(wallet));
      localStorage.setItem(txKey, JSON.stringify(txs));
    } catch (err) {}

    return { success: true, newBalance, balance_after: newBalance };
  },
};
