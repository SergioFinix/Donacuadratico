import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CUSD_ADDRESS_SEPOLIA = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Dummy known ERC20 for tests or user defined. Wait, we should accept param. Let's make it parametric.
// Wait, prompt says: "Usa la dirección del token cUSD en Celo... (mainnet) o el address correspondiente en Celo Sepolia testnet."
// Sepolia cUSD is generally 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1, but I'll make it configurable via ignition parameters.

const QuadraticTippingModule = buildModule("QuadraticTippingModule", (m) => {
    // Configurable parameters with defaults
    const cUSDAddress = m.getParameter("cUSDAddress", "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1");
    const verifierAddress = m.getParameter("verifierAddress", "0x0000000000000000000000000000000000000000"); // will be deployed by owner, who can be verifier initially

    const quadTipping = m.contract("QuadraticTipping", [cUSDAddress, verifierAddress]);

    return { quadTipping };
});

export default QuadraticTippingModule;
