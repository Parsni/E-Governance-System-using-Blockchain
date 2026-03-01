import EGovernanceVoting from '../abis/EGovernanceVoting.json';
import LandRegistry from '../abis/LandRegistry.json';
import PublicFundTracking from '../abis/PublicFundTracking.json';

export const CONTRACT_ADDRESSES = {
    voting: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    land: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    funds: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

export const ABIS = {
    voting: EGovernanceVoting.abi,
    land: LandRegistry.abi,
    funds: PublicFundTracking.abi
};
