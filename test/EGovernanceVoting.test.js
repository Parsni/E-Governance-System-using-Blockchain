const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EGovernanceVoting", function () {
    let contract;
    let admin, voter1, voter2;

    beforeEach(async function () {
        [admin, voter1, voter2] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("EGovernanceVoting");
        contract = await Factory.deploy();
        await contract.waitForDeployment();
    });

    // ── Helper: create an election that starts now and lasts 1 hour ──
    async function createDefaultElection() {
        const now = Math.floor(Date.now() / 1000);
        const start = now - 60; // started 1 min ago
        const end = now + 3600; // ends in 1 hour
        await contract.createElection(
            "Test Election",
            "A test",
            ["Alice", "Bob", "Charlie"],
            start,
            end
        );
    }

    describe("Election Creation", function () {
        it("should allow admin to create an election", async function () {
            await createDefaultElection();
            const count = await contract.electionCount();
            expect(count).to.equal(1n);
        });

        it("should reject non-admin creating an election", async function () {
            const now = Math.floor(Date.now() / 1000);
            await expect(
                contract.connect(voter1).createElection("X", "Y", ["A", "B"], now, now + 3600)
            ).to.be.revertedWith("Only admin");
        });

        it("should require at least 2 candidates", async function () {
            const now = Math.floor(Date.now() / 1000);
            await expect(
                contract.createElection("X", "Y", ["Solo"], now, now + 3600)
            ).to.be.revertedWith("At least 2 candidates");
        });
    });

    describe("Voting", function () {
        beforeEach(async function () {
            await createDefaultElection();
        });

        it("should allow a voter to cast a vote", async function () {
            await contract.connect(voter1).vote(1, 0);
            const [, voteCounts] = await contract.getResults(1);
            expect(voteCounts[0]).to.equal(1n);
        });

        it("should prevent double voting", async function () {
            await contract.connect(voter1).vote(1, 0);
            await expect(
                contract.connect(voter1).vote(1, 1)
            ).to.be.revertedWith("Already voted");
        });

        it("should reject invalid candidate index", async function () {
            await expect(
                contract.connect(voter1).vote(1, 99)
            ).to.be.revertedWith("Invalid candidate");
        });

        it("should track total votes", async function () {
            await contract.connect(voter1).vote(1, 0);
            await contract.connect(voter2).vote(1, 1);
            const [, , , , , , totalVotes] = await contract.getElection(1);
            expect(totalVotes).to.equal(2n);
        });
    });

    describe("Results & Queries", function () {
        it("should return correct results after voting", async function () {
            await createDefaultElection();
            await contract.connect(voter1).vote(1, 2); // Charlie
            await contract.connect(voter2).vote(1, 2); // Charlie
            const [candidates, voteCounts] = await contract.getResults(1);
            expect(candidates[2]).to.equal("Charlie");
            expect(voteCounts[2]).to.equal(2n);
        });

        it("should return all election IDs", async function () {
            await createDefaultElection();
            await createDefaultElection();
            const ids = await contract.getAllElectionIds();
            expect(ids.length).to.equal(2);
        });
    });

    describe("Finalization", function () {
        it("should allow admin to finalize after end time", async function () {
            const now = Math.floor(Date.now() / 1000);
            await contract.createElection("Past", "Done", ["A", "B"], now - 7200, now - 3600);
            await contract.finalizeElection(1);
            const [, , , , , finalized] = await contract.getElection(1);
            expect(finalized).to.equal(true);
        });

        it("should reject finalization before end time", async function () {
            await createDefaultElection();
            await expect(contract.finalizeElection(1)).to.be.revertedWith("Election not ended");
        });
    });
});
