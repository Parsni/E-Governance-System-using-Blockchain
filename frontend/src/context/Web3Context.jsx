import { createContext, useState, useEffect, useContext } from 'react';
import { BrowserProvider } from 'ethers';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [error, setError] = useState('');

    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                setError('Please install MetaMask!');
                return;
            }

            const ethProvider = new BrowserProvider(window.ethereum);
            await ethProvider.send("eth_requestAccounts", []);
            const ethSigner = await ethProvider.getSigner();
            const address = await ethSigner.getAddress();

            setProvider(ethProvider);
            setSigner(ethSigner);
            setAccount(address);
            setError('');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to connect wallet');
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    setAccount(null);
                    setSigner(null);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }, []);

    return (
        <Web3Context.Provider value={{ account, provider, signer, error, connectWallet }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => useContext(Web3Context);
