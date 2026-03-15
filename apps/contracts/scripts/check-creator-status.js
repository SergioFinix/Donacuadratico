const hre = require("hardhat");

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const contractAddress = "0x64F5A1e0eDAE7c1a32A33808d6cd57A9e3c17D6F";
  const creator = "0xe1a87cdf048f8b1b2dfc0911faf87fc5119e7de0";
  const roundId = 2n;

  const abi = [
    {
      "inputs": [
        { "internalType": "uint256", "name": "_roundId", "type": "uint256" },
        { "internalType": "address", "name": "_creator", "type": "address" }
      ],
      "name": "isRegisteredCreator",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
      "name": "isVerifiedHuman",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const isRegistered = await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "isRegisteredCreator",
    args: [roundId, creator]
  });

  const isVerified = await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "isVerifiedHuman",
    args: ["0x112D3797b229280231ce7Cee9A54f93Ebe162392"]
  });

  console.log(`Creator ${creator} registered: ${isRegistered}`);
  console.log(`User 0x112D... verified: ${isVerified}`);
}

main().catch(console.error);
