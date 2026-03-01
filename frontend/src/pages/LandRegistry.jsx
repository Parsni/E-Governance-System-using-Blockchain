import { useState, useEffect } from 'react';
import { Contract } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESSES, ABIS } from '../utils/constants';

export default function LandRegistry() {
    const { provider, signer, account } = useWeb3();
    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [owner, setOwner] = useState('');
    const [location, setLocation] = useState('');
    const [area, setArea] = useState('');
    const [docHash, setDocHash] = useState('');
    const [transferId, setTransferId] = useState('');
    const [newOwner, setNewOwner] = useState('');

    const getContract = (useSigner = false) => {
        if (!provider) return null;
        return new Contract(
            CONTRACT_ADDRESSES.land,
            ABIS.land,
            useSigner ? signer : provider
        );
    };

    const loadParcels = async () => {
        const contract = getContract();
        if (!contract) return;

        setLoading(true);
        try {
            const ids = await contract.getAllParcelIds();
            const parcelData = await Promise.all(
                ids.map(async (id) => {
                    const data = await contract.getParcel(id);
                    let pendingOwner = "0x0000000000000000000000000000000000000000";
                    try {
                        pendingOwner = await contract.getPendingTransfer(id);
                    } catch (e) {
                        // Ignored, no pending transfer
                    }

                    return {
                        id: Number(data[0]),
                        owner: data[1],
                        location: data[2],
                        area: Number(data[3]),
                        documentHash: data[4],
                        isVerified: data[5],
                        registeredAt: Number(data[6]),
                        pendingOwner
                    };
                })
            );
            setParcels(parcelData.reverse());
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadParcels();
    }, [provider]);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!signer) return alert("Please connect wallet");
        try {
            const contract = getContract(true);
            const tx = await contract.registerLand(owner, location, parseInt(area), docHash);
            await tx.wait();
            setOwner(''); setLocation(''); setArea(''); setDocHash('');
            loadParcels();
        } catch (err) {
            console.error(err);
            alert("Registration failed");
        }
    };

    const handleRequestTransfer = async (e) => {
        e.preventDefault();
        if (!signer) return alert("Please connect wallet");
        try {
            const contract = getContract(true);
            const tx = await contract.requestTransfer(parseInt(transferId), newOwner);
            await tx.wait();
            setTransferId(''); setNewOwner('');
            loadParcels();
        } catch (err) {
            console.error(err);
            alert("Transfer request failed");
        }
    };

    const handleAdminAction = async (id, action) => {
        if (!signer) return alert("Please connect wallet");
        try {
            const contract = getContract(true);
            const tx = action === 'verify'
                ? await contract.verifyLand(id)
                : await contract.approveTransfer(id);
            await tx.wait();
            loadParcels();
        } catch (err) {
            console.error(err);
            alert(`${action} failed`);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                    Land Registry
                </h1>
                <button onClick={loadParcels} className="btn-secondary flex items-center gap-2">
                    <span>↻</span> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Admin/User Forms */}
                <div className="space-y-8">
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4 text-white">Register New Parcel</h2>
                        <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4">
                            <input required placeholder="Owner Wallet Address (0x...)" value={owner} onChange={e => setOwner(e.target.value)} className="input-field" />
                            <input required placeholder="Location Details" value={location} onChange={e => setLocation(e.target.value)} className="input-field" />
                            <div className="flex gap-4">
                                <input required placeholder="Area (sq.m)" type="number" value={area} onChange={e => setArea(e.target.value)} className="input-field w-1/2" />
                                <input required placeholder="Document Hash (IPFS/SHA)" value={docHash} onChange={e => setDocHash(e.target.value)} className="input-field w-1/2" />
                            </div>
                            <button type="submit" className="btn-primary">Register Land</button>
                        </form>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4 text-white">Request Transfer</h2>
                        <form onSubmit={handleRequestTransfer} className="grid grid-cols-1 gap-4">
                            <input required placeholder="Parcel ID" type="number" value={transferId} onChange={e => setTransferId(e.target.value)} className="input-field" />
                            <input required placeholder="New Owner Address (0x...)" value={newOwner} onChange={e => setNewOwner(e.target.value)} className="input-field" />
                            <button type="submit" className="btn-secondary bg-indigo-600 hover:bg-indigo-500">Submit Request</button>
                        </form>
                    </div>
                </div>

                {/* Parcels List */}
                <div className="glass-card p-6 min-h-[500px] overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-6 text-white">Registered Parcels</h2>
                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-slate-400">Loading registry...</p>
                        ) : parcels.length === 0 ? (
                            <p className="text-slate-400">No parcels registered yet.</p>
                        ) : (
                            parcels.map((parcel) => (
                                <div key={parcel.id} className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-500 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-xs text-brand-secondary font-mono">ID: #{parcel.id}</span>
                                            <h3 className="text-lg font-bold text-white">{parcel.location}</h3>
                                        </div>
                                        {parcel.isVerified ? (
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400">Verified</span>
                                        ) : (
                                            <button onClick={() => handleAdminAction(parcel.id, 'verify')} className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-white transition-colors cursor-pointer">
                                                Verify (Admin)
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-1 text-sm text-slate-300 mb-4">
                                        <p><span className="text-slate-500">Owner:</span> <code className="bg-slate-800 px-1 rounded">{parcel.owner.slice(0, 8)}...{parcel.owner.slice(-6)}</code></p>
                                        <p><span className="text-slate-500">Area:</span> {parcel.area} sq.m</p>
                                        <p><span className="text-slate-500">DocHash:</span> <span className="font-mono text-xs">{parcel.documentHash}</span></p>
                                        <p><span className="text-slate-500">Registered:</span> {new Date(parcel.registeredAt * 1000).toLocaleString()}</p>
                                    </div>

                                    {parcel.pendingOwner !== "0x0000000000000000000000000000000000000000" && (
                                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                                            <div className="text-xs text-indigo-400">
                                                Pending Transfer: <code className="bg-slate-800 text-slate-300 px-1 rounded">{parcel.pendingOwner.slice(0, 8)}...</code>
                                            </div>
                                            <button onClick={() => handleAdminAction(parcel.id, 'approve')} className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white px-3 py-1 rounded-md text-xs transition-all">
                                                Approve (Admin)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
