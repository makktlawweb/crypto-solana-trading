import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';

export interface SwapQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: any;
  priceImpactPct: string;
  routePlan: any[];
}

export interface SwapResult {
  txid: string;
  inputAmount: number;
  outputAmount: number;
  priceImpactPct: number;
}

export class JupiterTradingService {
  private connection: Connection;
  private jupiterApiUrl = 'https://quote-api.jup.ag/v6';
  
  constructor() {
    // Use Solana mainnet RPC
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
  }

  async getSwapQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 300 // 3% slippage
  ): Promise<SwapQuote> {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false'
      });

      const response = await axios.get(`${this.jupiterApiUrl}/quote?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw new Error('Failed to get swap quote from Jupiter');
    }
  }

  async executeSwap(
    walletKeypair: Keypair,
    quote: SwapQuote,
    priorityFeeLamports: number = 0.001 * 1e9 // 0.001 SOL priority fee for speed
  ): Promise<SwapResult> {
    try {
      // Get swap transaction from Jupiter
      const swapResponse = await axios.post(`${this.jupiterApiUrl}/swap`, {
        quoteResponse: quote,
        userPublicKey: walletKeypair.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: priorityFeeLamports
      });

      const { swapTransaction } = swapResponse.data;

      // Deserialize the transaction
      const transactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuf);

      // Sign the transaction
      transaction.sign([walletKeypair]);

      // Send and confirm the transaction with high priority
      const rawTransaction = transaction.serialize();
      const txid = await this.connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 3,
        preflightCommitment: 'confirmed'
      });

      // Wait for confirmation with timeout
      const confirmation = await this.connection.confirmTransaction(txid, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log(`Swap executed successfully. TxID: ${txid}`);

      return {
        txid,
        inputAmount: parseInt(quote.inAmount),
        outputAmount: parseInt(quote.outAmount),
        priceImpactPct: parseFloat(quote.priceImpactPct)
      };

    } catch (error) {
      console.error('Error executing swap:', error);
      throw new Error(`Failed to execute swap: ${error}`);
    }
  }

  async buyTokenWithSOL(
    walletKeypair: Keypair,
    tokenMint: string,
    solAmount: number,
    maxSlippageBps: number = 500 // 5% max slippage for speed
  ): Promise<SwapResult> {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const lamports = Math.floor(solAmount * 1e9); // Convert SOL to lamports

    // Get quote
    const quote = await this.getSwapQuote(
      SOL_MINT,
      tokenMint,
      lamports,
      maxSlippageBps
    );

    // Execute immediate swap
    return await this.executeSwap(walletKeypair, quote, 0.005 * 1e9); // Higher priority fee for speed
  }

  async sellTokenForSOL(
    walletKeypair: Keypair,
    tokenMint: string,
    tokenAmount: number,
    maxSlippageBps: number = 500
  ): Promise<SwapResult> {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';

    // Get quote
    const quote = await this.getSwapQuote(
      tokenMint,
      SOL_MINT,
      tokenAmount,
      maxSlippageBps
    );

    // Execute immediate swap
    return await this.executeSwap(walletKeypair, quote, 0.005 * 1e9);
  }

  async getTokenBalance(walletPublicKey: PublicKey, tokenMint: string): Promise<number> {
    try {
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        walletPublicKey,
        { mint: new PublicKey(tokenMint) }
      );

      if (tokenAccounts.value.length === 0) {
        return 0;
      }

      const accountInfo = await this.connection.getTokenAccountBalance(
        tokenAccounts.value[0].pubkey
      );

      return accountInfo.value.uiAmount || 0;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  async getSOLBalance(walletPublicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(walletPublicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      return 0;
    }
  }
}

export const jupiterTradingService = new JupiterTradingService();