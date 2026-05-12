import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import {
  mplTokenMetadata,
  createNft,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  generateSigner,
  percentAmount,
  publicKey as umiPublicKey,
  Umi,
} from '@metaplex-foundation/umi';
import { Connection, PublicKey } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

// URL metadata yang sudah di-host di GitHub Gist
const METADATA_URI = 'https://gist.githubusercontent.com/diyon12/481fc3ad6d5c4b56c59e79cb886a824c/raw/64cc7568aaa31fdd00344061bdc00ac47c05df71/solemn-achievement.json';

/**
 * Setup Umi (Metaplex SDK) dengan wallet adapter
 */
export function getUmi(connection: Connection, wallet: WalletContextState): Umi {
  const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());

  if (wallet.publicKey && wallet.signTransaction) {
    umi.use(walletAdapterIdentity(wallet as any));
  }

  return umi;
}

/**
 * Tier berdasarkan stake amount
 * Semakin besar stake, semakin tinggi tier achievement
 */
function getTier(stakeAmount: number): string {
  if (stakeAmount >= 1) return 'Diamond';
  if (stakeAmount >= 0.5) return 'Gold';
  if (stakeAmount >= 0.1) return 'Silver';
  return 'Bronze';
}

/**
 * Mint achievement NFT untuk promiser
 * Dipanggil dari Judge dashboard SETELAH approve sukses
 * 
 * Metadata URI point ke GitHub Gist yang berisi JSON metadata + base64 SVG
 * Nama NFT include tier + achievement number untuk differentiation per NFT
 */
export async function mintAchievementNFT(params: {
  umi: Umi;
  promiserAddress: PublicKey;
  promiseDescription: string;
  stakeAmount: number;
  achievementNumber: number;
  approvedAt: number;
  judgeAddress: string;
}): Promise<{ mintAddress: string; signature: string; tier: string }> {
  const tier = getTier(params.stakeAmount);

  // Generate keypair untuk mint NFT baru
  const mint = generateSigner(params.umi);

  // Create NFT — recipient: promiser, fee payer: judge (yang trigger)
  const result = await createNft(params.umi, {
    mint,
    name: `Solemn ${tier} #${params.achievementNumber}`,
    symbol: 'SOLEMN',
    uri: METADATA_URI,
    sellerFeeBasisPoints: percentAmount(0),
    tokenOwner: umiPublicKey(params.promiserAddress.toString()),
  }).sendAndConfirm(params.umi);

  return {
    mintAddress: mint.publicKey.toString(),
    signature: result.signature.toString(),
    tier,
  };
}