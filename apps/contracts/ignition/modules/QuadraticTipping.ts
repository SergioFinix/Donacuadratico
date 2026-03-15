import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TOKEN_ADDRESS_MAINNET = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

const QuadraticTippingModule = buildModule("QuadraticTippingModule", (m) => {
    // Configurable parameters with defaults
    const usdcAddress = m.getParameter("usdcAddress", TOKEN_ADDRESS_MAINNET);
    const verifierAddress = m.getParameter("verifierAddress", "0xf76A0Af73Df734393ca2684f7e7BB9b446aa0010");

    const DonaCuadraticoping = m.contract("QuadraticTipping", [usdcAddress, verifierAddress]);

    return { DonaCuadraticoping };
});

export default QuadraticTippingModule;
