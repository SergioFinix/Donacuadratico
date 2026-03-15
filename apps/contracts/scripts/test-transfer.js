const hre = require("hardhat");
const { parseUnits } = require("viem");

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const cusdAddress = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  const userAddress = "0x112D3797b229280231ce7Cee9A54f93Ebe162392";

  console.log("Testing transfer of 0.1 cUSD from", userAddress, "to", userAddress);

  const amount = parseUnits("0.1", 18);

  const erc20Abi = [
    {
      "inputs": [
        { "internalType": "address", "name": "recipient", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "transfer",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  try {
    const hash = await deployer.writeContract({
      address: cusdAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [userAddress, amount]
    });

    console.log("Transfer Transaction Hash:", hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transfer successful! Status:", receipt.status);
  } catch (error) {
    console.error("Transfer failed!");
    console.error(error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
