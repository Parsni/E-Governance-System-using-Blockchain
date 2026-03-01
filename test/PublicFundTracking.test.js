const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PublicFundTracking", function () {
    let contract;
    let admin, beneficiary, stranger;

    beforeEach(async function () {
        [admin, beneficiary, stranger] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("PublicFundTracking");
        contract = await Factory.deploy();
        await contract.waitForDeployment();
    });

    describe("Scheme Creation", function () {
        it("should allow admin to create a scheme", async function () {
            await contract.createScheme(
                "Road Construction",
                "NH-48 widening project",
                beneficiary.address,
                ethers.parseEther("100")
            );
            const count = await contract.schemeCount();
            expect(count).to.equal(1n);
        });

        it("should store scheme metadata correctly", async function () {
            await contract.createScheme(
                "School Funding",
                "Build 10 schools",
                beneficiary.address,
                ethers.parseEther("50")
            );
            const [id, name, desc, ben, allocated, spent, isActive] = await contract.getScheme(1);
            expect(id).to.equal(1n);
            expect(name).to.equal("School Funding");
            expect(desc).to.equal("Build 10 schools");
            expect(ben).to.equal(beneficiary.address);
            expect(allocated).to.equal(ethers.parseEther("50"));
            expect(spent).to.equal(0n);
            expect(isActive).to.equal(true);
        });

        it("should reject non-admin creating a scheme", async function () {
            await expect(
                contract.connect(stranger).createScheme("X", "Y", beneficiary.address, 1000)
            ).to.be.revertedWith("Only admin can perform this action");
        });

        it("should reject zero-address beneficiary", async function () {
            await expect(
                contract.createScheme("X", "Y", ethers.ZeroAddress, 1000)
            ).to.be.revertedWith("Invalid beneficiary");
        });
    });

    describe("Fund Release", function () {
        beforeEach(async function () {
            await contract.createScheme(
                "Road Construction",
                "NH-48 widening",
                beneficiary.address,
                ethers.parseEther("100")
            );
        });

        it("should allow admin to release funds", async function () {
            await contract.releaseFunds(1, ethers.parseEther("25"), "Phase 1 materials");
            const [, , , , , spent] = await contract.getScheme(1);
            expect(spent).to.equal(ethers.parseEther("25"));
        });

        it("should record fund release in audit trail", async function () {
            await contract.releaseFunds(1, ethers.parseEther("10"), "Cement purchase");
            await contract.releaseFunds(1, ethers.parseEther("15"), "Steel purchase");
            const [amounts, purposes] = await contract.getFundReleases(1);
            expect(amounts.length).to.equal(2);
            expect(purposes[0]).to.equal("Cement purchase");
            expect(purposes[1]).to.equal("Steel purchase");
        });

        it("should reject release exceeding allocated budget", async function () {
            await expect(
                contract.releaseFunds(1, ethers.parseEther("101"), "Over budget")
            ).to.be.revertedWith("Exceeds allocated budget");
        });

        it("should reject non-admin releasing funds", async function () {
            await expect(
                contract.connect(stranger).releaseFunds(1, 1000, "Hack attempt")
            ).to.be.revertedWith("Only admin can perform this action");
        });
    });

    describe("Milestones", function () {
        beforeEach(async function () {
            await contract.createScheme("Bridge", "River crossing", beneficiary.address, ethers.parseEther("200"));
        });

        it("should allow admin to complete milestones", async function () {
            await contract.completeMilestone(1, "Foundation laid");
            await contract.completeMilestone(1, "Pillars erected");
            const milestones = await contract.getMilestones(1);
            expect(milestones.length).to.equal(2);
            expect(milestones[0]).to.equal("Foundation laid");
            expect(milestones[1]).to.equal("Pillars erected");
        });

        it("should update milestone count in scheme", async function () {
            await contract.completeMilestone(1, "Phase 1 done");
            const [, , , , , , , , milestoneCount] = await contract.getScheme(1);
            expect(milestoneCount).to.equal(1n);
        });
    });

    describe("Scheme Deactivation", function () {
        beforeEach(async function () {
            await contract.createScheme("Temp", "Temporary", beneficiary.address, 1000);
        });

        it("should allow admin to deactivate a scheme", async function () {
            await contract.deactivateScheme(1);
            const [, , , , , , isActive] = await contract.getScheme(1);
            expect(isActive).to.equal(false);
        });

        it("should reject fund release on deactivated scheme", async function () {
            await contract.deactivateScheme(1);
            await expect(
                contract.releaseFunds(1, 100, "After deactivation")
            ).to.be.revertedWith("Scheme is not active");
        });
    });

    describe("View Functions", function () {
        it("should return all scheme IDs", async function () {
            await contract.createScheme("A", "1", beneficiary.address, 100);
            await contract.createScheme("B", "2", beneficiary.address, 200);
            await contract.createScheme("C", "3", beneficiary.address, 300);
            const ids = await contract.getAllSchemeIds();
            expect(ids.length).to.equal(3);
        });
    });
});
