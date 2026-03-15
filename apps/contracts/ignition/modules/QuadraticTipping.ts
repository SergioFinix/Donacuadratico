import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TOKEN_ADDRESS_MAINNET = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

const QuadraticTippingModule = buildModule("QuadraticTippingModule", (m) => {
    // Configurable parameters with defaults
    const usdcAddress = m.getParameter("usdcAddress", TOKEN_ADDRESS_MAINNET);
    const verifierAddress = m.getParameter("verifierAddress", "0x09BB59c870AA5CB0e7A01b2f96d72B29f3a4BE90");


    const DonaCuadraticoping = m.contract("QuadraticTipping", [usdcAddress, verifierAddress]);

    return { DonaCuadraticoping };
});

export default QuadraticTippingModule;
