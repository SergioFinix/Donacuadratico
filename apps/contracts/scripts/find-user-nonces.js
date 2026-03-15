const hre = require("hardhat");

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const userAddress = "0x112D3797b229280231ce7Cee9A54f93Ebe162392";

  console.log("Analyzing transactions for nonces 47-50...");

  // Since CeloScan doesn't have an easy "get tx by nonce" via RPC easily without full indexing,
  // we can look at the latest blocks and find them.
  // We already know nonce 46 was at block 61664919.
  // We'll search from that block onwards.

  const startBlock = 61664919n;
  const currentBlock = await publicClient.getBlockNumber();

  for (let bn = startBlock; bn <= currentBlock; bn++) {
    const block = await publicClient.getBlock({
      blockNumber: bn,
      includeTransactions: true
    });

    const userTxs = block.transactions.filter(tx => 
      tx.from?.toLowerCase() === userAddress.toLowerCase()
    );

    userTxs.forEach(tx => {
      console.log(`Block ${bn}: Nonce ${tx.nonce}, Hash ${tx.hash}, To ${tx.to}`);
    });
    
    // Stop early if we reached the end? No, nonces can be skipped if failed, but usually they are sequential for sent txs.
  }
}

main().catch(console.error);
