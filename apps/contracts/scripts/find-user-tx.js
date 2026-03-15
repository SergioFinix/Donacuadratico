const hre = require("hardhat");

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const userAddress = "0x112D3797b229280231ce7Cee9A54f93Ebe162392";
  const contractAddress = "0x64F5A1e0eDAE7c1a32A33808d6cd57A9e3c17D6F";
  const cusdAddress = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

  const currentBlock = await publicClient.getBlockNumber();
  console.log("Searching user transactions in last 100 blocks (start block:", currentBlock, ")");

  for (let i = 0n; i < 100n; i++) {
    const block = await publicClient.getBlock({
      blockNumber: currentBlock - i,
      includeTransactions: true
    });

    const userTx = block.transactions.filter(tx => 
      tx.from?.toLowerCase() === userAddress.toLowerCase()
    );

    if (userTx.length > 0) {
      userTx.forEach(tx => {
        console.log(`Block ${block.number}: Hash ${tx.hash} to ${tx.to}`);
        if (tx.to?.toLowerCase() === cusdAddress.toLowerCase()) {
          console.log("  -> This is a cUSD transaction!");
        }
      });
    }
  }
}

main().catch(console.error);
