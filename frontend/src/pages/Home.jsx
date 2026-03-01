import { useState, useEffect } from 'react';
import { Contract } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESSES, ABIS } from '../utils/constants';

export default function Home() {
    const { provider, signer, account } = useWeb3();
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [candidates, setCandidates] = useState('');
    const [duration, setDuration] = useState('');

    const getContract = (useSigner = false) => {
        if (!provider) return null;
        return new Contract(
            CONTRACT_ADDRESSES.voting,
            ABIS.voting,
            useSigner ? signer : provider
        );
    };

    const loadElections = async () => {
        const contract = getContract();
        if (!contract) return;

        setLoading(true);
        try {
            const ids = await contract.getAllElectionIds();
            const electionData = await Promise.all(
                ids.map(async (id) => {
                    const details = await contract.getElection(id);
                    const results = await contract.getResults(id);

                    return {
                        id: Number(id),
                        name: details[0],
                        description: details[1],
                        startTime: Number(details[3]),
                        endTime: Number(details[4]),
                        finalized: details[5],
                        totalVotes: Number(details[6]),
                        candidates: results[0],
                        votes: results[1].map(v => Number(v))
                    };
                })
            );
            setElections(electionData.reverse());
        } catch (err) {
            console.error("Failed to load elections", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadElections();
    }, [provider]);

    const handleCreateElection = async (e) => {
        e.preventDefault();
        if (!signer) return alert("Please connect wallet");

        const candidateList = candidates.split(',').map(c => c.trim()).filter(c => c);
        if (candidateList.length < 2) return alert("Need at least 2 candidates");

        const startTime = Math.floor(Date.now() / 1000);
        const endTime = startTime + parseInt(duration) * 60;

        try {
            const contract = getContract(true);
            const tx = await contract.createElection(name, description, candidateList, startTime, endTime);
            await tx.wait();
            setName('');
            setDescription('');
            setCandidates('');
            setDuration('');
            loadElections();
        } catch (err) {
            console.error(err);
            alert("Failed to create election");
        }
    };

    const handleVote = async (electionId, candidateIndex) => {
        if (!signer) return alert("Please connect wallet");
        try {
            const contract = getContract(true);
            const tx = await contract.vote(electionId, candidateIndex);
            await tx.wait();
            loadElections();
        } catch (err) {
            console.error(err);
            alert("Failed to cast vote or already voted.");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Voting Dashboard
                </h1>
                <button onClick={loadElections} className="btn-secondary flex items-center gap-2">
                    <span>↻</span> Refresh
                </button>
            </div>

            {/* Admin Panel (Visible if they have MetaMask but essentially anyone can create for demo purposes unless restricted) */}
            <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">Create New Election</h2>
                <form onSubmit={handleCreateElection} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="Election Title" value={name} onChange={e => setName(e.target.value)} className="input-field" />
                    <input required placeholder="Duration in Minutes" type="number" value={duration} onChange={e => setDuration(e.target.value)} className="input-field" />
                    <input required placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="input-field md:col-span-2" />
                    <input required placeholder="Candidates (comma separated)" value={candidates} onChange={e => setCandidates(e.target.value)} className="input-field md:col-span-2" />
                    <button type="submit" className="btn-primary md:col-span-2">Deploy Election</button>
                </form>
            </div>

            {/* Elections List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                    <p className="text-slate-400">Loading elections from blockchain...</p>
                ) : elections.length === 0 ? (
                    <p className="text-slate-400">No elections found.</p>
                ) : (
                    elections.map((election) => {
                        const now = Math.floor(Date.now() / 1000);
                        const isOngoing = now >= election.startTime && now <= election.endTime;
                        const isEnded = now > election.endTime;

                        return (
                            <div key={election.id} className="glass-card p-6 flex flex-col justify-between hover:border-slate-600 transition-colors">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-xs text-brand-secondary font-mono">#{election.id}</span>
                                            <h3 className="text-xl font-bold text-white">{election.name}</h3>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isOngoing ? 'bg-emerald-500/20 text-emerald-400' : isEnded ? 'bg-slate-700 text-slate-300' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {isOngoing ? 'Ongoing' : isEnded ? 'Ended' : 'Upcoming'}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4">{election.description}</p>

                                    <div className="space-y-3 mb-6">
                                        {election.candidates.map((cand, idx) => (
                                            <div key={idx} className="bg-slate-900/50 rounded-lg p-3 flex justify-between items-center border border-slate-700/50">
                                                <span className="font-medium">{cand}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm text-brand-secondary font-mono">{election.votes[idx]} votes</span>
                                                    {isOngoing && account && (
                                                        <button onClick={() => handleVote(election.id, idx)} className="bg-brand-accent/20 text-blue-400 hover:bg-brand-accent hover:text-white px-3 py-1 rounded-md text-sm transition-all">
                                                            Vote
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-700/50 flex justify-between">
                                    <span>Total Votes: {election.totalVotes}</span>
                                    <span>Ends: {new Date(election.endTime * 1000).toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
