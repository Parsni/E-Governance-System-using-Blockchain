// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LandRegistry
 * @dev Blockchain-based land record management system.
 *
 * Features:
 * - Admin (land officer / government authority) registers new land parcels.
 * - Each parcel has an owner address, location string, area, and document hash.
 * - Ownership transfers require admin approval (simulates government verification).
 * - All events are immutable on-chain for public auditability.
 *
 * Key Solidity concepts demonstrated:
 * - struct, mapping, events, modifiers, require(), onlyAdmin pattern
 */
contract LandRegistry {
    // ──────────────────────────────────────────────
    // State Variables
    // ──────────────────────────────────────────────

    /// @notice The government authority address (deployer).
    address public admin;

    /// @notice Auto-incrementing parcel counter.
    uint256 public parcelCount;

    /// @notice Represents a single land parcel on the registry.
    struct LandParcel {
        uint256 id;            // Unique parcel identifier
        address owner;         // Current owner wallet address
        string location;       // Human-readable location (e.g. "Survey #45, Mumbai")
        uint256 area;          // Area in square meters
        string documentHash;   // IPFS CID or SHA-256 hash of property documents
        bool isVerified;       // Has the admin verified this record?
        uint256 registeredAt;  // Block timestamp when first registered
    }

    /// @dev parcelId => LandParcel
    mapping(uint256 => LandParcel) public parcels;

    /// @dev Track pending transfer requests: parcelId => proposed new owner
    mapping(uint256 => address) public pendingTransfers;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    /// @notice Emitted when a new land parcel is registered.
    event LandRegistered(
        uint256 indexed parcelId,
        address indexed owner,
        string location,
        uint256 area,
        string documentHash
    );

    /// @notice Emitted when ownership is transferred after admin approval.
    event LandTransferred(
        uint256 indexed parcelId,
        address indexed previousOwner,
        address indexed newOwner
    );

    /// @notice Emitted when a transfer request is initiated by the current owner.
    event TransferRequested(
        uint256 indexed parcelId,
        address indexed currentOwner,
        address indexed proposedOwner
    );

    /// @notice Emitted when admin verifies a parcel.
    event LandVerified(uint256 indexed parcelId);

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    /// @dev Restricts function to the admin (deployer).
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin (land officer) can perform this action");
        _;
    }

    /// @dev Ensures the parcel exists.
    modifier parcelExists(uint256 _parcelId) {
        require(_parcelId > 0 && _parcelId <= parcelCount, "Parcel does not exist");
        _;
    }

    /// @dev Restricts function to the current owner of the parcel.
    modifier onlyParcelOwner(uint256 _parcelId) {
        require(parcels[_parcelId].owner == msg.sender, "Not the parcel owner");
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
     * @dev Register a new land parcel. Only admin can call this.
     * @param _owner        Wallet address of the land owner.
     * @param _location     Human-readable location description.
     * @param _area         Area in square meters.
     * @param _documentHash IPFS CID or hash of the property document.
     */
    function registerLand(
        address _owner,
        string memory _location,
        uint256 _area,
        string memory _documentHash
    ) external onlyAdmin {
        require(_owner != address(0), "Invalid owner address");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(_area > 0, "Area must be greater than zero");

        parcelCount += 1;

        parcels[parcelCount] = LandParcel({
            id: parcelCount,
            owner: _owner,
            location: _location,
            area: _area,
            documentHash: _documentHash,
            isVerified: false,
            registeredAt: block.timestamp
        });

        emit LandRegistered(parcelCount, _owner, _location, _area, _documentHash);
    }

    /**
     * @dev Admin verifies a registered parcel (marks it as officially verified).
     * @param _parcelId ID of the parcel to verify.
     */
    function verifyLand(uint256 _parcelId) external onlyAdmin parcelExists(_parcelId) {
        require(!parcels[_parcelId].isVerified, "Already verified");
        parcels[_parcelId].isVerified = true;
        emit LandVerified(_parcelId);
    }

    /**
     * @dev Admin approves a pending transfer request.
     *      Transfers ownership from the current owner to the proposed new owner.
     * @param _parcelId ID of the parcel with a pending transfer.
     */
    function approveTransfer(uint256 _parcelId) external onlyAdmin parcelExists(_parcelId) {
        address proposedOwner = pendingTransfers[_parcelId];
        require(proposedOwner != address(0), "No pending transfer for this parcel");

        address previousOwner = parcels[_parcelId].owner;
        parcels[_parcelId].owner = proposedOwner;

        // Clear the pending transfer
        delete pendingTransfers[_parcelId];

        emit LandTransferred(_parcelId, previousOwner, proposedOwner);
    }

    // ──────────────────────────────────────────────
    // Owner Functions
    // ──────────────────────────────────────────────

    /**
     * @dev Current owner initiates a transfer request to a new owner.
     *      The transfer is NOT instant — it requires admin approval via approveTransfer().
     * @param _parcelId ID of the parcel to transfer.
     * @param _newOwner Address of the proposed new owner.
     */
    function requestTransfer(
        uint256 _parcelId,
        address _newOwner
    ) external parcelExists(_parcelId) onlyParcelOwner(_parcelId) {
        require(_newOwner != address(0), "Invalid new owner");
        require(_newOwner != msg.sender, "Cannot transfer to yourself");
        require(parcels[_parcelId].isVerified, "Parcel must be verified before transfer");

        pendingTransfers[_parcelId] = _newOwner;

        emit TransferRequested(_parcelId, msg.sender, _newOwner);
    }

    // ──────────────────────────────────────────────
    // View Functions
    // ──────────────────────────────────────────────

    /**
     * @dev Get details of a specific land parcel.
     */
    function getParcel(uint256 _parcelId)
        external
        view
        parcelExists(_parcelId)
        returns (
            uint256 id,
            address owner,
            string memory location,
            uint256 area,
            string memory documentHash,
            bool isVerified,
            uint256 registeredAt
        )
    {
        LandParcel storage p = parcels[_parcelId];
        return (p.id, p.owner, p.location, p.area, p.documentHash, p.isVerified, p.registeredAt);
    }

    /**
     * @dev Get all parcel IDs (1..parcelCount). Frontend iterates these.
     */
    function getAllParcelIds() external view returns (uint256[] memory ids) {
        ids = new uint256[](parcelCount);
        for (uint256 i = 0; i < parcelCount; i++) {
            ids[i] = i + 1;
        }
    }

    /**
     * @dev Check if a parcel has a pending transfer and who the proposed owner is.
     */
    function getPendingTransfer(uint256 _parcelId)
        external
        view
        parcelExists(_parcelId)
        returns (address proposedOwner)
    {
        return pendingTransfers[_parcelId];
    }
}
