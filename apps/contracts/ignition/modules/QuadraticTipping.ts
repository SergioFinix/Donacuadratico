import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDC_ADDRESS_SEPOLIA = "0x01C5C0122039549AD1493B8220cABEdD739BC44E";

const QuadraticTippingModule = buildModule("QuadraticTippingModule", (m) => {
    // Configurable parameters with defaults
    const usdcAddress = m.getParameter("usdcAddress", USDC_ADDRESS_SEPOLIA);
    const verifierAddress = m.getParameter("verifierAddress", "0x0000000000000000000000000000000000000000"); // will be deployed by owner, who can be verifier initially

    const DonaCuadraticoping = m.contract("QuadraticTipping", [usdcAddress, verifierAddress]);

    return { DonaCuadraticoping };
});

export default QuadraticTippingModule;
