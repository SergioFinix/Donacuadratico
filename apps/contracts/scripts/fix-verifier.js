const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x18BB094b44C46066d082659e67133df6BCD78619";
  const NEW_VERIFIER = "0x09BB59c870AA5CB0e7A01b2f96d72B29f3a4BE90";

  console.log("Updating verifier on Celo Mainnet...");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("New Verifier:", NEW_VERIFIER);

  // Using viem since it's the configured toolbox
  const [walletClient] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log("Using account:", walletClient.account.address);

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: [{
      inputs: [{ name: "_verifier", type: "address" }],
      name: "setVerifier",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }],
    functionName: "setVerifier",
    args: [NEW_VERIFIER]
  });

  console.log("Transaction sent! Hash:", hash);
  console.log("Waiting for confirmation...");
  
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Verifier updated successfully!");
}

main().catch((error) => {
  console.error("❌ Error updating verifier:", error);
  process.exitCode = 1;
});
