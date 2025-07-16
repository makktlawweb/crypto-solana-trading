import { Connection, PublicKey } from "@solana/web3.js";

export class SolanaService {
  private connection: Connection;
  private rpcUrl: string;

  constructor() {
    // Use QuickNode RPC for better performance and rate limits
    this.rpcUrl = process.env.SOLANA_RPC_URL || "https://indulgent-green-owl.solana-mainnet.quiknode.pro/c1197c32d25f2acb206fc108b0c7434395fdb63d";
    this.connection = new Connection(this.rpcUrl, "confirmed");
    console.log(`Using Solana RPC: ${this.rpcUrl}`);
  }

  async getConnectionStatus(): Promise<{ connected: boolean; slot: number | null }> {
    try {
      const slot = await this.connection.getSlot();
      return { connected: true, slot };
    } catch (error) {
      console.error("Solana connection error:", error);
      return { connected: false, slot: null };
    }
  }

  async getTokenAccountInfo(tokenAddress: string) {
    try {
      const pubkey = new PublicKey(tokenAddress);
      const accountInfo = await this.connection.getAccountInfo(pubkey);
      return accountInfo;
    } catch (error) {
      console.error("Error getting token account info:", error);
      return null;
    }
  }

  async getTokenSupply(tokenAddress: string) {
    try {
      const pubkey = new PublicKey(tokenAddress);
      const supply = await this.connection.getTokenSupply(pubkey);
      return supply;
    } catch (error) {
      console.error("Error getting token supply:", error);
      return null;
    }
  }

  async getRecentTransactions(tokenAddress: string, limit: number = 10) {
    try {
      const pubkey = new PublicKey(tokenAddress);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });
      
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          return { signature: sig.signature, transaction: tx, blockTime: sig.blockTime };
        })
      );

      return transactions.filter(tx => tx.transaction !== null);
    } catch (error) {
      console.error("Error getting recent transactions:", error);
      return [];
    }
  }

  getConnection(): Connection {
    return this.connection;
  }
}

export const solanaService = new SolanaService();
