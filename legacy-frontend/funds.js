// Frontend logic for Public Fund Tracking DApp

// 1. Paste your deployed PublicFundTracking contract address here.
const FUND_CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// 2. Minimal ABI for the PublicFundTracking contract.
const FUND_ABI = [
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    {
        inputs: [],
        name: "admin",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "schemeCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "string", name: "_name", type: "string" },
            { internalType: "string", name: "_description", type: "string" },
            { internalType: "address", name: "_beneficiary", type: "address" },
            { internalType: "uint256", name: "_allocated", type: "uint256" },
        ],
        name: "createScheme",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "_schemeId", type: "uint256" },
            { internalType: "uint256", name: "_amount", type: "uint256" },
            { internalType: "string", name: "_purpose", type: "string" },
        ],
        name: "releaseFunds",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "_schemeId", type: "uint256" },
            { internalType: "string", name: "_description", type: "string" },
        ],
        name: "completeMilestone",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_schemeId", type: "uint256" }],
        name: "deactivateScheme",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_schemeId", type: "uint256" }],
        name: "getScheme",
        outputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "string", name: "name", type: "string" },
            { internalType: "string", name: "description", type: "string" },
            { internalType: "address", name: "beneficiary", type: "address" },
            { internalType: "uint256", name: "allocated", type: "uint256" },
            { internalType: "uint256", name: "spent", type: "uint256" },
            { internalType: "bool", name: "isActive", type: "bool" },
            { internalType: "uint256", name: "createdAt", type: "uint256" },
            { internalType: "uint256", name: "milestoneCount", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_schemeId", type: "uint256" }],
        name: "getFundReleases",
        outputs: [
            { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
            { internalType: "string[]", name: "purposes", type: "string[]" },
            { internalType: "uint256[]", name: "timestamps", type: "uint256[]" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_schemeId", type: "uint256" }],
        name: "getMilestones",
        outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getAllSchemeIds",
        outputs: [{ internalType: "uint256[]", name: "ids", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "schemeId", type: "uint256" },
            { indexed: false, internalType: "string", name: "name", type: "string" },
            { indexed: true, internalType: "address", name: "beneficiary", type: "address" },
            { indexed: false, internalType: "uint256", name: "allocated", type: "uint256" },
        ],
        name: "SchemeCreated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "schemeId", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
            { indexed: false, internalType: "string", name: "purpose", type: "string" },
        ],
        name: "FundReleased",
        type: "event",
    },
];

let provider;
let signer;
let contract;

function getEls() {
    return {
        connectButton: document.getElementById("connectButton"),
        currentAccount: document.getElementById("currentAccount"),
        contractAddressDisplay: document.getElementById("contractAddressDisplay"),
        createSchemeBtn: document.getElementById("createSchemeBtn"),
        createStatus: document.getElementById("createStatus"),
        schemeName: document.getElementById("schemeName"),
        schemeDesc: document.getElementById("schemeDesc"),
        beneficiary: document.getElementById("beneficiary"),
        budget: document.getElementById("budget"),
        releaseSchemeId: document.getElementById("releaseSchemeId"),
        releaseAmount: document.getElementById("releaseAmount"),
        releasePurpose: document.getElementById("releasePurpose"),
        releaseFundsBtn: document.getElementById("releaseFundsBtn"),
        milestoneSchemeId: document.getElementById("milestoneSchemeId"),
        milestoneDesc: document.getElementById("milestoneDesc"),
        completeMilestoneBtn: document.getElementById("completeMilestoneBtn"),
        actionStatus: document.getElementById("actionStatus"),
        schemesList: document.getElementById("schemesList"),
        refreshSchemesBtn: document.getElementById("refreshSchemesBtn"),
    };
}

async function init() {
    const els = getEls();
    if (!window.ethereum) {
        els.currentAccount.textContent = "MetaMask not detected";
        els.schemesList.textContent = "Please install MetaMask.";
        return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    els.contractAddressDisplay.textContent = FUND_CONTRACT_ADDRESS;

    els.connectButton.onclick = connectWallet;
    els.createSchemeBtn.onclick = createScheme;
    els.releaseFundsBtn.onclick = releaseFunds;
    els.completeMilestoneBtn.onclick = completeMilestone;
    els.refreshSchemesBtn.onclick = loadSchemes;

    if (FUND_CONTRACT_ADDRESS && FUND_CONTRACT_ADDRESS.startsWith("0x")) {
        contract = new ethers.Contract(FUND_CONTRACT_ADDRESS, FUND_ABI, provider);
    }

    if (window.ethereum.selectedAddress) await connectWallet();
    await loadSchemes();
}

async function connectWallet() {
    const els = getEls();
    try {
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        const address = await signer.getAddress();
        els.currentAccount.textContent = `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}`;
        if (FUND_CONTRACT_ADDRESS && FUND_CONTRACT_ADDRESS.startsWith("0x")) {
            contract = new ethers.Contract(FUND_CONTRACT_ADDRESS, FUND_ABI, signer);
        }
    } catch (err) {
        console.error(err);
        els.currentAccount.textContent = "Wallet connection failed";
    }
}

async function createScheme() {
    const els = getEls();
    if (!contract || !signer) { alert("Connect MetaMask first."); return; }

    const name = els.schemeName.value.trim();
    const desc = els.schemeDesc.value.trim();
    const ben = els.beneficiary.value.trim();
    const budgetEth = parseFloat(els.budget.value || "0");

    if (!name || !desc || !ben || budgetEth <= 0) { alert("Fill all fields."); return; }

    try {
        els.createStatus.textContent = "Sending transaction...";
        const budgetWei = ethers.utils.parseEther(budgetEth.toString());
        const tx = await contract.createScheme(name, desc, ben, budgetWei);
        await tx.wait();
        els.createStatus.textContent = "Scheme created! Tx: " + tx.hash;
        els.schemeName.value = "";
        els.schemeDesc.value = "";
        await loadSchemes();
    } catch (err) {
        console.error(err);
        els.createStatus.textContent = "Failed: " + (err.reason || err.message);
    }
}

async function releaseFunds() {
    const els = getEls();
    if (!contract || !signer) { alert("Connect MetaMask first."); return; }

    const schemeId = parseInt(els.releaseSchemeId.value, 10);
    const amountEth = parseFloat(els.releaseAmount.value || "0");
    const purpose = els.releasePurpose.value.trim();

    if (!schemeId || amountEth <= 0 || !purpose) { alert("Fill all fields."); return; }

    try {
        els.actionStatus.textContent = "Releasing funds...";
        const amountWei = ethers.utils.parseEther(amountEth.toString());
        const tx = await contract.releaseFunds(schemeId, amountWei, purpose);
        await tx.wait();
        els.actionStatus.textContent = "Funds released! Tx: " + tx.hash;
        await loadSchemes();
    } catch (err) {
        console.error(err);
        els.actionStatus.textContent = "Failed: " + (err.reason || err.message);
    }
}

async function completeMilestone() {
    const els = getEls();
    if (!contract || !signer) { alert("Connect MetaMask first."); return; }

    const schemeId = parseInt(els.milestoneSchemeId.value, 10);
    const desc = els.milestoneDesc.value.trim();
    if (!schemeId || !desc) { alert("Fill all fields."); return; }

    try {
        els.actionStatus.textContent = "Marking milestone...";
        const tx = await contract.completeMilestone(schemeId, desc);
        await tx.wait();
        els.actionStatus.textContent = "Milestone completed! Tx: " + tx.hash;
        await loadSchemes();
    } catch (err) {
        console.error(err);
        els.actionStatus.textContent = "Failed: " + (err.reason || err.message);
    }
}

async function loadSchemes() {
    const els = getEls();
    if (!contract) {
        els.schemesList.textContent = "Set FUND_CONTRACT_ADDRESS in funds.js after deployment.";
        return;
    }

    try {
        els.schemesList.textContent = "Loading from blockchain...";
        const ids = await contract.getAllSchemeIds();
        if (!ids || ids.length === 0) {
            els.schemesList.textContent = "No schemes created yet.";
            return;
        }

        const container = document.createElement("div");

        for (let i = 0; i < ids.length; i++) {
            const sid = ids[i].toNumber ? ids[i].toNumber() : Number(ids[i]);
            const [id, name, description, beneficiary, allocated, spent, isActive, createdAt, milestoneCount] =
                await contract.getScheme(sid);

            // Get fund releases
            const [amounts, purposes, timestamps] = await contract.getFundReleases(sid);

            // Get milestones
            const milestones = await contract.getMilestones(sid);

            const card = document.createElement("div");
            card.className = "border rounded-3 p-3 mb-3";

            const allocatedEth = ethers.utils.formatEther(allocated);
            const spentEth = ethers.utils.formatEther(spent);
            const pct = Number(allocated) > 0 ? (Number(spent) / Number(allocated)) * 100 : 0;

            const statusBadge = isActive
                ? '<span class="badge bg-success badge-pill small">Active</span>'
                : '<span class="badge bg-secondary badge-pill small">Inactive</span>';

            // Build fund release trail
            let releaseHtml = "";
            if (amounts.length > 0) {
                releaseHtml = '<div class="mt-2"><strong>Fund Releases:</strong><ul class="mb-0">';
                for (let j = 0; j < amounts.length; j++) {
                    const amtEth = ethers.utils.formatEther(amounts[j]);
                    const dt = new Date(Number(timestamps[j]) * 1000).toLocaleString();
                    releaseHtml += `<li>${amtEth} ETH — ${purposes[j]} <span class="text-muted-soft">(${dt})</span></li>`;
                }
                releaseHtml += "</ul></div>";
            }

            // Build milestones
            let milestonesHtml = "";
            if (milestones.length > 0) {
                milestonesHtml = '<div class="mt-2"><strong>Milestones:</strong><ol class="mb-0">';
                milestones.forEach((m) => {
                    milestonesHtml += `<li>✅ ${m}</li>`;
                });
                milestonesHtml += "</ol></div>";
            }

            card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <div class="small text-muted-soft">Scheme #${sid}</div>
            <h3 class="h6 mb-0">${name}</h3>
          </div>
          ${statusBadge}
        </div>
        <p class="small text-muted-soft mb-2">${description}</p>
        <div class="small text-muted-soft mb-1">
          <strong>Beneficiary:</strong> <code>${beneficiary.slice(0, 8)}...${beneficiary.slice(-6)}</code>
        </div>
        <div class="small text-muted-soft mb-2">
          <strong>Budget:</strong> ${allocatedEth} ETH |
          <strong>Spent:</strong> ${spentEth} ETH |
          <strong>Milestones:</strong> ${milestoneCount.toString()}
        </div>
        <div class="progress mb-2">
          <div class="progress-bar bg-info" style="width:${pct.toFixed(1)}%"></div>
        </div>
        <div class="small text-muted-soft mb-1">
          ${pct.toFixed(1)}% of budget utilized
        </div>
        ${releaseHtml}
        ${milestonesHtml}
      `;
            container.appendChild(card);
        }

        els.schemesList.innerHTML = "";
        els.schemesList.appendChild(container);
    } catch (err) {
        console.error(err);
        els.schemesList.textContent = "Failed to load schemes from blockchain.";
    }
}

window.addEventListener("DOMContentLoaded", init);
