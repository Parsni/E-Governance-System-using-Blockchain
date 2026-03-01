const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry", function () {
    let contract;
    let admin, owner1, owner2, stranger;

    beforeEach(async function () {
        [admin, owner1, owner2, stranger] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("LandRegistry");
        contract = await Factory.deploy();
        await contract.waitForDeployment();
    });

    describe("Land Registration", function () {
        it("should allow admin to register a land parcel", async function () {
            await contract.registerLand(owner1.address, "Survey #45, Mumbai", 500, "QmHash123");
            const count = await contract.parcelCount();
            expect(count).to.equal(1n);

            const [id, owner, location, area, docHash, isVerified] = await contract.getParcel(1);
            expect(id).to.equal(1n);
            expect(owner).to.equal(owner1.address);
            expect(location).to.equal("Survey #45, Mumbai");
            expect(area).to.equal(500n);
            expect(docHash).to.equal("QmHash123");
            expect(isVerified).to.equal(false);
        });

        it("should reject non-admin registration", async function () {
            await expect(
                contract.connect(owner1).registerLand(owner1.address, "Loc", 100, "hash")
            ).to.be.revertedWith("Only admin (land officer) can perform this action");
        });

        it("should reject zero-address owner", async function () {
            await expect(
                contract.registerLand(ethers.ZeroAddress, "Loc", 100, "hash")
            ).to.be.revertedWith("Invalid owner address");
        });

        it("should reject zero area", async function () {
            await expect(
                contract.registerLand(owner1.address, "Loc", 0, "hash")
            ).to.be.revertedWith("Area must be greater than zero");
        });
    });

    describe("Verification", function () {
        beforeEach(async function () {
            await contract.registerLand(owner1.address, "Survey #10, Delhi", 200, "QmDoc456");
        });

        it("should allow admin to verify a parcel", async function () {
            await contract.verifyLand(1);
            const [, , , , , isVerified] = await contract.getParcel(1);
            expect(isVerified).to.equal(true);
        });

        it("should reject double verification", async function () {
            await contract.verifyLand(1);
            await expect(contract.verifyLand(1)).to.be.revertedWith("Already verified");
        });
    });

    describe("Ownership Transfer", function () {
        beforeEach(async function () {
            await contract.registerLand(owner1.address, "Survey #10, Delhi", 200, "QmDoc456");
            await contract.verifyLand(1);
        });

        it("should allow owner to request transfer", async function () {
            await contract.connect(owner1).requestTransfer(1, owner2.address);
            const proposed = await contract.getPendingTransfer(1);
            expect(proposed).to.equal(owner2.address);
        });

        it("should reject transfer request from non-owner", async function () {
            await expect(
                contract.connect(stranger).requestTransfer(1, owner2.address)
            ).to.be.revertedWith("Not the parcel owner");
        });

        it("should reject transfer of unverified parcel", async function () {
            await contract.registerLand(owner1.address, "New Loc", 100, "hash");
            // Parcel 2 is not verified
            await expect(
                contract.connect(owner1).requestTransfer(2, owner2.address)
            ).to.be.revertedWith("Parcel must be verified before transfer");
        });

        it("should allow admin to approve transfer", async function () {
            await contract.connect(owner1).requestTransfer(1, owner2.address);
            await contract.approveTransfer(1);
            const [, newOwner] = await contract.getParcel(1);
            expect(newOwner).to.equal(owner2.address);
        });

        it("should reject approve when no pending transfer", async function () {
            await expect(contract.approveTransfer(1)).to.be.revertedWith(
                "No pending transfer for this parcel"
            );
        });
    });

    describe("View Functions", function () {
        it("should return all parcel IDs", async function () {
            await contract.registerLand(owner1.address, "Loc A", 100, "h1");
            await contract.registerLand(owner2.address, "Loc B", 200, "h2");
            const ids = await contract.getAllParcelIds();
            expect(ids.length).to.equal(2);
            expect(ids[0]).to.equal(1n);
            expect(ids[1]).to.equal(2n);
        });
    });
});
