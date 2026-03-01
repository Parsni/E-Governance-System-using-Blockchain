// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EGovernanceVoting
 * @dev Simple blockchain-based e-governance voting system.
 * - Admin (deployer) can create elections with multiple candidates.
 * - Each address can vote only once per election.
 * - Results are transparent and immutable on-chain.
 *
 * This module can represent:
 * - Government elections (national, state, local)
 * - DAO / committee voting
 */
contract EGovernanceVoting {
    address public admin;
    uint256 public electionCount;

    struct Election {
        uint256 id;
        string name;
        string description;
        string[] candidates;
        uint256 startTime;
        uint256 endTime;
        bool exists;
        bool finalized;
        uint256 totalVotes;
    }

    // electionId => Election
    mapping(uint256 => Election) private elections;

    // electionId => candidateIndex => votes
    mapping(uint256 => mapping(uint256 => uint256)) public votes;

    // electionId => voter address => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ElectionCreated(
        uint256 indexed id,
        string name,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed electionId,
        address indexed voter,
        uint256 indexed candidateIndex
    );

    event ElectionFinalized(uint256 indexed electionId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier electionExists(uint256 _electionId) {
        require(elections[_electionId].exists, "Election does not exist");
        _;
    }

    modifier duringElection(uint256 _electionId) {
        Election memory e = elections[_electionId];
        require(block.timestamp >= e.startTime, "Election not started");
        require(block.timestamp <= e.endTime, "Election ended");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Create a new election.
     * @param _name Name/title of the election.
     * @param _description Short description.
     * @param _candidates List of candidate names.
     * @param _startTime Unix timestamp for start.
     * @param _endTime Unix timestamp for end.
     */
    function createElection(
        string memory _name,
        string memory _description,
        string[] memory _candidates,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyAdmin {
        require(_candidates.length >= 2, "At least 2 candidates");
        require(_endTime > _startTime, "Invalid time range");

        electionCount += 1;
        Election storage e = elections[electionCount];
        e.id = electionCount;
        e.name = _name;
        e.description = _description;
        e.startTime = _startTime;
        e.endTime = _endTime;
        e.exists = true;
        e.finalized = false;
        e.totalVotes = 0;

        for (uint256 i = 0; i < _candidates.length; i++) {
            e.candidates.push(_candidates[i]);
        }

        emit ElectionCreated(electionCount, _name, _startTime, _endTime);
    }

    /**
     * @dev Vote for a candidate in an election.
     * @param _electionId ID of the election.
     * @param _candidateIndex Index of the candidate in the candidates array.
     */
    function vote(
        uint256 _electionId,
        uint256 _candidateIndex
    ) external electionExists(_electionId) duringElection(_electionId) {
        Election storage e = elections[_electionId];

        require(!hasVoted[_electionId][msg.sender], "Already voted");
        require(_candidateIndex < e.candidates.length, "Invalid candidate");

        hasVoted[_electionId][msg.sender] = true;
        votes[_electionId][_candidateIndex] += 1;
        e.totalVotes += 1;

        emit VoteCast(_electionId, msg.sender, _candidateIndex);
    }

    /**
     * @dev Finalize an election after end time (for reporting purposes).
     */
    function finalizeElection(
        uint256 _electionId
    ) external onlyAdmin electionExists(_electionId) {
        Election storage e = elections[_electionId];
        require(block.timestamp > e.endTime, "Election not ended");
        require(!e.finalized, "Already finalized");

        e.finalized = true;
        emit ElectionFinalized(_electionId);
    }

    /**
     * @dev Retrieve basic info of an election.
     */
    function getElection(
        uint256 _electionId
    )
        external
        view
        electionExists(_electionId)
        returns (
            string memory name,
            string memory description,
            string[] memory candidates,
            uint256 startTime,
            uint256 endTime,
            bool finalized,
            uint256 totalVotes
        )
    {
        Election storage e = elections[_electionId];
        return (
            e.name,
            e.description,
            e.candidates,
            e.startTime,
            e.endTime,
            e.finalized,
            e.totalVotes
        );
    }

    /**
     * @dev Returns the vote count for each candidate in an election.
     */
    function getResults(
        uint256 _electionId
    )
        external
        view
        electionExists(_electionId)
        returns (string[] memory candidates, uint256[] memory candidateVotes)
    {
        Election storage e = elections[_electionId];
        uint256 length = e.candidates.length;

        uint256[] memory voteCounts = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            voteCounts[i] = votes[_electionId][i];
        }

        return (e.candidates, voteCounts);
    }

    /**
     * @dev Helper view to list all election IDs from 1..electionCount.
     * Frontend can iterate and call getElection for each.
     */
    function getAllElectionIds() external view returns (uint256[] memory ids) {
        ids = new uint256[](electionCount);
        for (uint256 i = 0; i < electionCount; i++) {
            ids[i] = i + 1;
        }
    }
}

