import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

const Navbar = () => {
    const { account, connectWallet, error } = useWeb3();
    const location = useLocation();

    const navLinks = [
        { name: 'Voting', path: '/' },
        { name: 'Land Registry', path: '/land' },
        { name: 'Funds Tracking', path: '/funds' }
    ];

    return (
        <nav className="glass-card sticky top-0 z-50 rounded-none border-x-0 border-t-0 bg-slate-900/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center space-x-8">
                        <Link to="/" className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            GovChain
                        </Link>
                        <div className="hidden md:flex space-x-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === link.path
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {error && <span className="text-red-400 text-sm">{error}</span>}
                        {account ? (
                            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 font-mono text-sm text-emerald-400">
                                {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                            </div>
                        ) : (
                            <button onClick={connectWallet} className="btn-primary">
                                Connect Wallet
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
