// Frontend logic for Land Registry DApp

// 1. Paste your deployed LandRegistry contract address here.
const LAND_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// 2. Minimal ABI for the LandRegistry contract.
const LAND_ABI = [
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
        name: "parcelCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "_owner", type: "address" },
            { internalType: "string", name: "_location", type: "string" },
            { internalType: "uint256", name: "_area", type: "uint256" },
            { internalType: "string", name: "_documentHash", type: "string" },
        ],
        name: "registerLand",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_parcelId", type: "uint256" }],
        name: "verifyLand",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "_parcelId", type: "uint256" },
            { internalType: "address", name: "_newOwner", type: "address" },
        ],
        name: "requestTransfer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_parcelId", type: "uint256" }],
        name: "approveTransfer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_parcelId", type: "uint256" }],
        name: "getParcel",
        outputs: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "string", name: "location", type: "string" },
            { internalType: "uint256", name: "area", type: "uint256" },
            { internalType: "string", name: "documentHash", type: "string" },
            { internalType: "bool", name: "isVerified", type: "bool" },
            { internalType: "uint256", name: "registeredAt", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getAllParcelIds",
        outputs: [
            { internalType: "uint256[]", name: "ids", type: "uint256[]" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_parcelId", type: "uint256" }],
        name: "getPendingTransfer",
        outputs: [
            { internalType: "address", name: "proposedOwner", type: "address" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "parcelId", type: "uint256" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "string", name: "location", type: "string" },
            { indexed: false, internalType: "uint256", name: "area", type: "uint256" },
            { indexed: false, internalType: "string", name: "documentHash", type: "string" },
        ],
        name: "LandRegistered",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "parcelId", type: "uint256" },
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" },
        ],
        name: "LandTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "parcelId", type: "uint256" },
        ],
        name: "LandVerified",
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
        registerLandBtn: document.getElementById("registerLandBtn"),
        registerStatus: document.getElementById("registerStatus"),
        ownerAddress: document.getElementById("ownerAddress"),
        location: document.getElementById("location"),
        area: document.getElementById("area"),
        documentHash: document.getElementById("documentHash"),
        transferParcelId: document.getElementById("transferParcelId"),
        newOwnerAddress: document.getElementById("newOwnerAddress"),
        requestTransferBtn: document.getElementById("requestTransferBtn"),
        transferStatus: document.getElementById("transferStatus"),
        verifyParcelId: document.getElementById("verifyParcelId"),
        verifyLandBtn: document.getElementById("verifyLandBtn"),
        approveParcelId: document.getElementById("approveParcelId"),
        approveTransferBtn: document.getElementById("approveTransferBtn"),
        adminActionStatus: document.getElementById("adminActionStatus"),
        parcelsList: document.getElementById("parcelsList"),
        refreshParcelsBtn: document.getElementById("refreshParcelsBtn"),
    };
}

async function init() {
    const els = getEls();

    if (!window.ethereum) {
        els.currentAccount.textContent = "MetaMask not detected";
        els.parcelsList.textContent = "Please install MetaMask.";
        return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    els.contractAddressDisplay.textContent = LAND_CONTRACT_ADDRESS;

    els.connectButton.onclick = connectWallet;
    els.registerLandBtn.onclick = registerLand;
    els.requestTransferBtn.onclick = requestTransfer;
    els.verifyLandBtn.onclick = verifyLand;
    els.approveTransferBtn.onclick = approveTransfer;
    els.refreshParcelsBtn.onclick = loadParcels;

    if (LAND_CONTRACT_ADDRESS && LAND_CONTRACT_ADDRESS.startsWith("0x")) {
        contract = new ethers.Contract(LAND_CONTRACT_ADDRESS, LAND_ABI, provider);
    }

    if (window.ethereum.selectedAddress) {
        await connectWallet();
    }

    await loadParcels();
}

async function connectWallet() {
    const els = getEls();
    try {
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        const address = await signer.getAddress();
        els.currentAccount.textContent = `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}`;
        if (LAND_CONTRACT_ADDRESS && LAND_CONTRACT_ADDRESS.startsWith("0x")) {
            contract = new ethers.Contract(LAND_CONTRACT_ADDRESS, LAND_ABI, signer);
        }
    } catch (err) {
        console.error(err);
        els.currentAccount.textContent = "Wallet connection failed";
    }
}

async function registerLand() {
    const els = getEls();
    if (!contract || !signer) { alert("Connect MetaMask first."); return; }

    const owner = els.ownerAddress.value.trim();
    const loc = els.location.value.trim();
    const areaVal = parseInt(els.area.value || "0", 10);
    const docHash = els.documentHash.value.trim();

    if (!owner || !loc || areaVal <= 0) { alert("Fill all fields."); return; }

    try {
        els.registerStatus.textContent = "Sending transaction...";
        const tx = await contract.registerLand(owner, loc, areaVal, docHash || "");
        await tx.wait();
        els.registerStatus.textContent = "Land registered on blockchain! Tx: " + tx.hash;
        await loadParcels();
    } catch (err) {
        console.error(err);
        els.registerStatus.textContent = "Failed: " + (err.reason || err.message);
    }
}

async function requestTransfer() {
    const els = getEls();
    if (!contract || !signer) { alert("Connect MetaMask first."); return; }

    const parcelId = parseInt(els.transferParcelId.value, 10);
    const newOwner = els.newOwnerAddress.value.trim();
    if (!parcelId || !newOwner) { alert("Fill parcel ID and new owner."); return; }

    try {
        els.transferStatus.textContent = "Sending...";
        const tx = await contract.requestTransfer(parcelId, newOwner);
        await tx.wait();
        els.transferStatus.textContent = "Transfer request submitted! Tx: " + tx.hash;
        await loadParcels();
    } catch (err) {
        console.error(err);
        els.transferStatus.textContent = "Failed: " + (err.reason || err.message);
    }
}

async function verifyLand() {
    const els = getEls();
    if (!contract || !signer) { alert("Connect MetaMask first."); return; }
    const id = parseInt(els.verifyParcelId.value, 10);
    if (!id) { alert("Enter parcel ID."); return; }

    try {
        els.adminActionStatus.textContent = "Verifying...";
        const tx = await contract.verifyLand(id);
        await tx.wait();
        els.adminActionStatus.textContent = "Parcel verified! Tx: " + tx.hash;
        await loadParcels();
    } catch (err) {
        console.error(err);
        els.adminActionStatus.textContent = "Failed: " + (err.reason || err.message);
    }
}

async function approveTransfer() {
    const els = getEls();
    if (!contract || !signer) { alert("Connect MetaMask first."); return; }
    const id = parseInt(els.approveParcelId.value, 10);
    if (!id) { alert("Enter parcel ID."); return; }

    try {
        els.adminActionStatus.textContent = "Approving transfer...";
        const tx = await contract.approveTransfer(id);
        await tx.wait();
        els.adminActionStatus.textContent = "Transfer approved! Tx: " + tx.hash;
        await loadParcels();
    } catch (err) {
        console.error(err);
        els.adminActionStatus.textContent = "Failed: " + (err.reason || err.message);
    }
}

async function loadParcels() {
    const els = getEls();
    if (!contract) {
        els.parcelsList.textContent = "Set LAND_CONTRACT_ADDRESS in land.js after deployment.";
        return;
    }

    try {
        els.parcelsList.textContent = "Loading from blockchain...";
        const ids = await contract.getAllParcelIds();
        if (!ids || ids.length === 0) {
            els.parcelsList.textContent = "No land parcels registered yet.";
            return;
        }

        const container = document.createElement("div");
        for (let i = 0; i < ids.length; i++) {
            const pid = ids[i].toNumber ? ids[i].toNumber() : Number(ids[i]);
            const [id, owner, location, area, documentHash, isVerified, registeredAt] =
                await contract.getParcel(pid);

            let pendingOwner = "0x0000000000000000000000000000000000000000";
            try {
                pendingOwner = await contract.getPendingTransfer(pid);
            } catch (_) { }

            const card = document.createElement("div");
            card.className = "border rounded-3 p-3 mb-3";

            const verifiedBadge = isVerified
                ? '<span class="badge bg-success badge-pill small">Verified</span>'
                : '<span class="badge bg-warning text-dark badge-pill small">Unverified</span>';

            const pendingText =
                pendingOwner !== "0x0000000000000000000000000000000000000000"
                    ? `<div class="small text-warning mt-1">⏳ Pending transfer to: <code>${pendingOwner}</code></div>`
                    : "";

            card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <div class="small text-muted-soft">Parcel #${pid}</div>
            <h3 class="h6 mb-0">${location}</h3>
          </div>
          ${verifiedBadge}
        </div>
        <div class="small text-muted-soft mb-1">
          <strong>Owner:</strong> <code>${owner.slice(0, 8)}...${owner.slice(-6)}</code>
        </div>
        <div class="small text-muted-soft mb-1">
          <strong>Area:</strong> ${area.toString()} sq.m |
          <strong>Doc Hash:</strong> <code>${documentHash || "N/A"}</code>
        </div>
        <div class="small text-muted-soft">
          <strong>Registered:</strong> ${new Date(Number(registeredAt) * 1000).toLocaleString()}
        </div>
        ${pendingText}
      `;
            container.appendChild(card);
        }

        els.parcelsList.innerHTML = "";
        els.parcelsList.appendChild(container);
    } catch (err) {
        console.error(err);
        els.parcelsList.textContent = "Failed to load parcels from blockchain.";
    }
}

window.addEventListener("DOMContentLoaded", init);
