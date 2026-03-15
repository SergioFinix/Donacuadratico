const hre = require("hardhat");
const { parseUnits } = require("viem");

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const contractAddress = "0x64F5A1e0eDAE7c1a32A33808d6cd57A9e3c17D6F";
  const cusdAddress = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  const userAddress = "0x112D3797b229280231ce7Cee9A54f93Ebe162392";

  console.log("Starting full sequence: Approve -> Tip");
  console.log("Contract:", contractAddress);
  console.log("User:", userAddress);

  const amount = parseUnits("0.01", 18); // Use 0.01 for this test

  const erc20Abi = [
    {
      "inputs": [
        { "internalType": "address", "name": "spender", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "approve",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const tippingAbi = [
    {
      "inputs": [
        { "internalType": "uint256", "name": "_roundId", "type": "uint256" },
        { "internalType": "address", "name": "_creator", "type": "address" },
        { "internalType": "uint256", "name": "_amount", "type": "uint256" }
      ],
      "name": "tip",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  try {
    // 1. Approve
    console.log("Step 1: Approving 0.01 cUSD...");
    const approveHash = await deployer.writeContract({
      address: cusdAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [contractAddress, amount]
    });
    console.log("Approve TX:", approveHash);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log("Approve successful!");

    // 2. Tip (Round 2)
    console.log("Step 2: Tipping 0.01 cUSD in Round 2...");
    const tipHash = await deployer.writeContract({
      address: contractAddress,
      abi: tippingAbi,
      functionName: "tip",
      args: [2n, userAddress, amount]
    });
    console.log("Tip TX:", tipHash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tipHash });
    console.log("Tip successful! Status:", receipt.status);

  } catch (error) {
    console.error("Sequence failed!");
    console.error(error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
