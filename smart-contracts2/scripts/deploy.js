const hre = require("hardhat");

async function main() {
    const HealthRecord = await hre.ethers.getContractFactory("HealthRecord");

    // Deploy the contract
    const healthRecord = await HealthRecord.deploy();
    await healthRecord.waitForDeployment();

    console.log(`HealthRecord deployed to: ${await healthRecord.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
