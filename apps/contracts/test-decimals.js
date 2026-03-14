const hre = require("hardhat");

async function main() {
  const usdcAddress = "0x01C5C0122039549AD1493B8220cABEdD739BC44E";
  const minimalABI = ["function decimals() view returns (uint8)"];
  const contract = await hre.ethers.getContractAt(minimalABI, usdcAddress);
  
  const decimals = await contract.decimals();
  console.log("Token decimals:", decimals);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
