// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PublicFundTracking
 * @dev Blockchain-based public fund tracking system for government schemes.
 *
 * Features:
 * - Admin (government authority) creates public schemes with allocated budgets.
 * - Funds are released in tranches; every release is recorded on-chain.
 * - Milestones can be marked complete for transparency.
 * - Citizens can query any scheme to see exactly how funds were spent.
 *
 * Key Solidity concepts demonstrated:
 * - struct, mapping, arrays, events, modifiers, require(), onlyAdmin pattern
 * - On-chain audit trail for anti-corruption
 */
contract PublicFundTracking {
    // ──────────────────────────────────────────────
    // State Variables
    // ──────────────────────────────────────────────

    /// @notice Government authority address (deployer).
    address public admin;

    /// @notice Auto-incrementing scheme counter.
    uint256 public schemeCount;

    /// @notice Represents a government scheme (e.g. road construction, school funding).
    struct Scheme {
        uint256 id;              // Unique scheme identifier
        string name;             // Scheme name
        string description;      // What the scheme is about
        address beneficiary;     // Receiving department / contractor address
        uint256 allocated;       // Total allocated budget (in wei)
        uint256 spent;           // Total spent so far (in wei)
        bool isActive;           // Whether the scheme is still active
        uint256 createdAt;       // Block timestamp when created
        uint256 milestoneCount;  // Number of milestones completed
    }

    /// @notice Represents a single fund release event for audit trail.
    struct FundRelease {
        uint256 amount;          // Amount released (in wei)
        string purpose;          // Purpose / description of the release
        uint256 timestamp;       // When the release happened
    }

    /// @dev schemeId => Scheme
    mapping(uint256 => Scheme) public schemes;

    /// @dev schemeId => array of FundRelease events (on-chain audit trail)
    mapping(uint256 => FundRelease[]) public fundReleases;

    /// @dev schemeId => array of milestone descriptions
    mapping(uint256 => string[]) public milestones;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    /// @notice Emitted when a new scheme is created.
    event SchemeCreated(
        uint256 indexed schemeId,
        string name,
        address indexed beneficiary,
        uint256 allocated
    );

    /// @notice Emitted when funds are released for a scheme.
    event FundReleased(
        uint256 indexed schemeId,
        uint256 amount,
        string purpose
    );

    /// @notice Emitted when a milestone is completed.
    event MilestoneCompleted(
        uint256 indexed schemeId,
        uint256 milestoneIndex,
        string description
    );

    /// @notice Emitted when a scheme is deactivated.
    event SchemeDeactivated(uint256 indexed schemeId);

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    /// @dev Restricts to admin only.
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    /// @dev Ensures scheme exists.
    modifier schemeExists(uint256 _schemeId) {
        require(_schemeId > 0 && _schemeId <= schemeCount, "Scheme does not exist");
        _;
    }

    /// @dev Ensures scheme is still active.
    modifier schemeActive(uint256 _schemeId) {
        require(schemes[_schemeId].isActive, "Scheme is not active");
        _;
    }

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ──────────────────────────────────────────────
    // Admin Functions
    // ──────────────────────────────────────────────

    /**
     * @dev Create a new government scheme.
     * @param _name          Name of the scheme.
     * @param _description   Description of the scheme.
     * @param _beneficiary   Address of the receiving department / contractor.
     * @param _allocated     Total allocated budget in wei.
     */
    function createScheme(
        string memory _name,
        string memory _description,
        address _beneficiary,
        uint256 _allocated
    ) external onlyAdmin {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_allocated > 0, "Allocated budget must be > 0");

        schemeCount += 1;

        schemes[schemeCount] = Scheme({
            id: schemeCount,
            name: _name,
            description: _description,
            beneficiary: _beneficiary,
            allocated: _allocated,
            spent: 0,
            isActive: true,
            createdAt: block.timestamp,
            milestoneCount: 0
        });

        emit SchemeCreated(schemeCount, _name, _beneficiary, _allocated);
    }

    /**
     * @dev Release funds for a scheme. Records the release on-chain for full audit trail.
     * @param _schemeId  ID of the scheme.
     * @param _amount    Amount to release (in wei).
     * @param _purpose   Description of what the funds are for.
     */
    function releaseFunds(
        uint256 _schemeId,
        uint256 _amount,
        string memory _purpose
    ) external onlyAdmin schemeExists(_schemeId) schemeActive(_schemeId) {
        Scheme storage s = schemes[_schemeId];

        require(_amount > 0, "Amount must be > 0");
        require(s.spent + _amount <= s.allocated, "Exceeds allocated budget");

        s.spent += _amount;

        fundReleases[_schemeId].push(FundRelease({
            amount: _amount,
            purpose: _purpose,
            timestamp: block.timestamp
        }));

        emit FundReleased(_schemeId, _amount, _purpose);
    }

    /**
     * @dev Mark a milestone as completed for a scheme.
     * @param _schemeId     ID of the scheme.
     * @param _description  Description of the milestone achieved.
     */
    function completeMilestone(
        uint256 _schemeId,
        string memory _description
    ) external onlyAdmin schemeExists(_schemeId) schemeActive(_schemeId) {
        require(bytes(_description).length > 0, "Description cannot be empty");

        milestones[_schemeId].push(_description);
        schemes[_schemeId].milestoneCount += 1;

        emit MilestoneCompleted(_schemeId, schemes[_schemeId].milestoneCount - 1, _description);
    }

    /**
     * @dev Deactivate a scheme (e.g. completed or cancelled).
     * @param _schemeId ID of the scheme.
     */
    function deactivateScheme(
        uint256 _schemeId
    ) external onlyAdmin schemeExists(_schemeId) schemeActive(_schemeId) {
        schemes[_schemeId].isActive = false;
        emit SchemeDeactivated(_schemeId);
    }

    // ──────────────────────────────────────────────
    // View Functions (Public — for citizen transparency)
    // ──────────────────────────────────────────────

    /**
     * @dev Get scheme metadata.
     */
    function getScheme(uint256 _schemeId)
        external
        view
        schemeExists(_schemeId)
        returns (
            uint256 id,
            string memory name,
            string memory description,
            address beneficiary,
            uint256 allocated,
            uint256 spent,
            bool isActive,
            uint256 createdAt,
            uint256 milestoneCount
        )
    {
        Scheme storage s = schemes[_schemeId];
        return (
            s.id, s.name, s.description, s.beneficiary,
            s.allocated, s.spent, s.isActive, s.createdAt, s.milestoneCount
        );
    }

    /**
     * @dev Get the full fund release history for a scheme (audit trail).
     */
    function getFundReleases(uint256 _schemeId)
        external
        view
        schemeExists(_schemeId)
        returns (uint256[] memory amounts, string[] memory purposes, uint256[] memory timestamps)
    {
        FundRelease[] storage releases = fundReleases[_schemeId];
        uint256 len = releases.length;

        amounts = new uint256[](len);
        purposes = new string[](len);
        timestamps = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            amounts[i] = releases[i].amount;
            purposes[i] = releases[i].purpose;
            timestamps[i] = releases[i].timestamp;
        }
    }

    /**
     * @dev Get all milestones for a scheme.
     */
    function getMilestones(uint256 _schemeId)
        external
        view
        schemeExists(_schemeId)
        returns (string[] memory)
    {
        return milestones[_schemeId];
    }

    /**
     * @dev Get all scheme IDs.
     */
    function getAllSchemeIds() external view returns (uint256[] memory ids) {
        ids = new uint256[](schemeCount);
        for (uint256 i = 0; i < schemeCount; i++) {
            ids[i] = i + 1;
        }
    }
}
