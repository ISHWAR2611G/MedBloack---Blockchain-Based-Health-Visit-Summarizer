const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthRecord Contract", function () {
    let HealthRecord;
    let healthRecord;
    let admin, doctor1, doctor2, viewer;

    beforeEach(async function () {
        [admin, doctor1, doctor2, viewer] = await ethers.getSigners();
        HealthRecord = await ethers.getContractFactory("HealthRecord");
        healthRecord = await HealthRecord.deploy();
    });

    describe("Record Management", function () {
        it("Should allow a doctor to add a record", async function () {
            await healthRecord.connect(doctor1).addHealthRecord("patient1", "QmTest123", "HospitalA");

            const details = await healthRecord.connect(admin).getRecordDetails("QmTest123");
            expect(details.patientId).to.equal("patient1");
            expect(details.doctor).to.equal(doctor1.address);
            expect(details.hospitalId).to.equal("HospitalA");
        });

        it("Should prevent adding duplicate CIDs", async function () {
            await healthRecord.connect(doctor1).addHealthRecord("patient1", "QmTest123", "HospitalA");
            await expect(
                healthRecord.connect(doctor2).addHealthRecord("patient2", "QmTest123", "HospitalB")
            ).to.be.revertedWith("Record already exists");
        });
    });

    describe("Access Control", function () {
        it("Admin should be able to grant access and view all records", async function () {
            await healthRecord.connect(doctor1).addHealthRecord("patient1", "Qm1", "HospitalA");
            await healthRecord.connect(admin).grantAccess("patient1", viewer.address);

            const records = await healthRecord.connect(viewer).getPatientRecords("patient1");
            expect(records).to.include("Qm1");
        });

        it("Doctor who created a record should be able to view patient records", async function () {
            await healthRecord.connect(doctor1).addHealthRecord("patient1", "Qm1", "HospitalA");
            const records = await healthRecord.connect(doctor1).getPatientRecords("patient1");
            expect(records).to.include("Qm1");
        });

        it("Doctor who didn't create a record shouldn't be able to view without access", async function () {
            await healthRecord.connect(doctor1).addHealthRecord("patient1", "Qm1", "HospitalA");
            await expect(
                healthRecord.connect(doctor2).getPatientRecords("patient1")
            ).to.be.revertedWith("Not authorized to read");
        });

        it("Authorized viewer can read record details", async function () {
            await healthRecord.connect(doctor1).addHealthRecord("patient1", "Qm1", "HospitalA");
            await healthRecord.connect(doctor1).grantAccess("patient1", viewer.address);

            const details = await healthRecord.connect(viewer).getRecordDetails("Qm1");
            expect(details.patientId).to.equal("patient1");
        });
    });
});
