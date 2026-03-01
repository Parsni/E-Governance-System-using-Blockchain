import { useState, useEffect } from 'react';
import { Contract, parseEther, formatEther } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESSES, ABIS } from '../utils/constants';

export default function Funds() {
    const { provider, signer, account } = useWeb3();
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [beneficiary, setBeneficiary] = useState('');
    const [budget, setBudget] = useState('');

    const [releaseId, setReleaseId] = useState('');
    const [releaseAmount, setReleaseAmount] = useState('');
    const [releasePurpose, setReleasePurpose] = useState('');

    const [milestoneId, setMilestoneId] = useState('');
    const [milestoneDesc, setMilestoneDesc] = useState('');

    const getContract = (useSigner = false) => {
        if (!provider) return null;
        return new Contract(
            CONTRACT_ADDRESSES.funds,
            ABIS.funds,
            useSigner ? signer : provider
        );
    };

    const loadSchemes = async () => {
        const contract = getContract();
        if (!contract) return;

        setLoading(true);
        try {
            const ids = await contract.getAllSchemeIds();
            const schemeData = await Promise.all(
                ids.map(async (id) => {
                    const data = await contract.getScheme(id);
                    const releases = await contract.getFundReleases(id);
                    const milestones = await contract.getMilestones(id);

                    const amounts = releases[0] || [];
                    const purposes = releases[1] || [];
                    const timestamps = releases[2] || [];

                    const formattedReleases = amounts.map((amt, idx) => ({
                        amount: formatEther(amt),
                        purpose: purposes[idx],
                        timestamp: Number(timestamps[idx])
                    }));

                    return {
                        id: Number(data[0]),
                        name: data[1],
                        description: data[2],
                        beneficiary: data[3],
                        allocated: formatEther(data[4]),
                        spent: formatEther(data[5]),
                        isActive: data[6],
                        createdAt: Number(data[7]),
                        milestoneCount: Number(data[8]),
                        releases: formattedReleases,
                        milestones: Array.from(milestones)
                    };
                })
            );
            setSchemes(schemeData.reverse());
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadSchemes();
    }, [provider]);

    const handleCreateScheme = async (e) => {
        e.preventDefault();
        if (!signer) return alert("Please connect wallet");
        try {
            const contract = getContract(true);
            const budgetWei = parseEther(budget.toString());
            const tx = await contract.createScheme(name, desc, beneficiary, budgetWei);
            await tx.wait();
            setName(''); setDesc(''); setBeneficiary(''); setBudget('');
            loadSchemes();
        } catch (err) {
            console.error(err);
            alert("Failed to create scheme");
        }
    };

    const handleReleaseFunds = async (e) => {
        e.preventDefault();
        if (!signer) return alert("Please connect wallet");
        try {
            const contract = getContract(true);
            const amountWei = parseEther(releaseAmount.toString());
            const tx = await contract.releaseFunds(parseInt(releaseId), amountWei, releasePurpose);
            await tx.wait();
            setReleaseId(''); setReleaseAmount(''); setReleasePurpose('');
            loadSchemes();
        } catch (err) {
            console.error(err);
            alert("Failed to release funds");
        }
    };

    const handleCompleteMilestone = async (e) => {
        e.preventDefault();
        if (!signer) return alert("Please connect wallet");
        try {
            const contract = getContract(true);
            const tx = await contract.completeMilestone(parseInt(milestoneId), milestoneDesc);
            await tx.wait();
            setMilestoneId(''); setMilestoneDesc('');
            loadSchemes();
        } catch (err) {
            console.error(err);
            alert("Failed to complete milestone");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-400">
                    Public Fund Tracking
                </h1>
                <button onClick={loadSchemes} className="btn-secondary flex items-center gap-2">
                    <span>↻</span> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Admin Forms Col */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-4 text-white">Create Scheme</h2>
                        <form onSubmit={handleCreateScheme} className="space-y-3">
                            <input required placeholder="Scheme Name" value={name} onChange={e => setName(e.target.value)} className="input-field" />
                            <input required placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} className="input-field" />
                            <input required placeholder="Beneficiary (0x...)" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} className="input-field" />
                            <input required placeholder="Budget (ETH)" type="number" step="0.0001" value={budget} onChange={e => setBudget(e.target.value)} className="input-field" />
                            <button type="submit" className="btn-primary w-full">Deploy Scheme</button>
                        </form>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-4 text-white">Release Funds</h2>
                        <form onSubmit={handleReleaseFunds} className="space-y-3">
                            <input required placeholder="Scheme ID" type="number" value={releaseId} onChange={e => setReleaseId(e.target.value)} className="input-field" />
                            <input required placeholder="Amount (ETH)" type="number" step="0.0001" value={releaseAmount} onChange={e => setReleaseAmount(e.target.value)} className="input-field" />
                            <input required placeholder="Purpose" value={releasePurpose} onChange={e => setReleasePurpose(e.target.value)} className="input-field" />
                            <button type="submit" className="btn-secondary bg-indigo-600 hover:bg-indigo-500 w-full">Release</button>
                        </form>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-4 text-white">Mark Milestone</h2>
                        <form onSubmit={handleCompleteMilestone} className="space-y-3">
                            <input required placeholder="Scheme ID" type="number" value={milestoneId} onChange={e => setMilestoneId(e.target.value)} className="input-field" />
                            <input required placeholder="Milestone Description" value={milestoneDesc} onChange={e => setMilestoneDesc(e.target.value)} className="input-field" />
                            <button type="submit" className="btn-secondary bg-emerald-600 hover:bg-emerald-500 w-full">Complete</button>
                        </form>
                    </div>
                </div>

                {/* Display Col */}
                <div className="lg:col-span-2 glass-card p-6 h-[800px] overflow-y-auto">
                    <h2 className="text-xl font-bold mb-6 text-white">Active Schemes</h2>
                    {loading ? (
                        <p className="text-slate-400">Loading tracking data...</p>
                    ) : schemes.length === 0 ? (
                        <p className="text-slate-400">No public schemes tracked yet.</p>
                    ) : (
                        <div className="space-y-6">
                            {schemes.map((scheme) => {
                                const pct = Number(scheme.allocated) > 0 ? (Number(scheme.spent) / Number(scheme.allocated)) * 100 : 0;

                                return (
                                    <div key={scheme.id} className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="text-xs text-brand-secondary font-mono">ID: #{scheme.id}</span>
                                                <h3 className="text-lg font-bold text-white">{scheme.name}</h3>
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${scheme.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {scheme.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-400 mb-4">{scheme.description}</p>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                <span>Fund Utilization</span>
                                                <span>{pct.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-2">
                                                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm bg-slate-800/50 p-3 rounded-lg mb-4">
                                            <div>
                                                <span className="block text-slate-500 text-xs">Allocated</span>
                                                <span className="font-mono text-emerald-400">{scheme.allocated} ETH</span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-500 text-xs">Spent</span>
                                                <span className="font-mono text-blue-400">{scheme.spent} ETH</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-slate-500 text-xs">Beneficiary</span>
                                                <code className="text-xs text-slate-300">{scheme.beneficiary}</code>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Releases */}
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fund Releases</h4>
                                                {scheme.releases.length === 0 ? <span className="text-xs text-slate-500">No releases yet</span> :
                                                    scheme.releases.map((rel, idx) => (
                                                        <div key={idx} className="bg-slate-800/80 p-2 rounded text-xs border border-slate-700/50">
                                                            <div className="flex justify-between text-blue-400 mb-1">
                                                                <span className="font-mono">{rel.amount} ETH</span>
                                                                <span>{new Date(rel.timestamp * 1000).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-slate-300">{rel.purpose}</p>
                                                        </div>
                                                    ))
                                                }
                                            </div>

                                            {/* Milestones */}
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Milestones completed</h4>
                                                {scheme.milestones.length === 0 ? <span className="text-xs text-slate-500">No milestones yet</span> :
                                                    <ul className="space-y-1">
                                                        {scheme.milestones.map((m, idx) => (
                                                            <li key={idx} className="flex gap-2 text-xs text-slate-300 items-start">
                                                                <span className="text-emerald-400">✓</span>
                                                                <span>{m}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                }
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
