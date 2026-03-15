const hre = require("hardhat");
const { parseUnits } = require("viem");

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const contractAddress = "0x64F5A1e0eDAE7c1a32A33808d6cd57A9e3c17D6F";
  const userAddress = "0x112D3797b229280231ce7Cee9A54f93Ebe162392";

  console.log("Initializing contract at:", contractAddress);

  /*
  // 1. Create a Round (30 days)
  const duration = 30 * 24 * 60 * 60; // 30 days
  const matchingPool = parseUnits("0", 18); // Start with 0 matching for now

  console.log("Creating round...");
  const createHash = await deployer.writeContract({
    address: contractAddress,
    abi: [
      {
        "inputs": [
          { "internalType": "uint256", "name": "_matchingPoolAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "_durationInSeconds", "type": "uint256" }
        ],
        "name": "createRound",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    functionName: "createRound",
    args: [matchingPool, BigInt(duration)]
  });

  console.log("Create Round Hash:", createHash);
  await publicClient.waitForTransactionReceipt({ hash: createHash });
  console.log("Round created successfully!");
  */


  // 2. Register User as Creator
  console.log("Registering user as creator in round 2...");
  const registerHash = await deployer.writeContract({
    address: contractAddress,
    abi: [
      {
        "inputs": [
          { "internalType": "uint256", "name": "_roundId", "type": "uint256" }
        ],
        "name": "registerAsCreator",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    functionName: "registerAsCreator",
    args: [2n]
  });


  console.log("Register Creator Hash:", registerHash);
  await publicClient.waitForTransactionReceipt({ hash: registerHash });
  console.log("User registered as creator successfully!");

  console.log("\nInitialization Complete! 🚀");
  console.log("Contract is now ready for tipping in Round 1.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
