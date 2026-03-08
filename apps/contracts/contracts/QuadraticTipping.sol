// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract QuadraticTipping is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable cUSD;
    address public verifier;

    uint256 public constant ROUND_DURATION = 7 days;

    struct Round {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 matchingPool;
        bool finalized;
        address[] creators;
    }

    struct CreatorInfo {
        address creator;
        uint256 totalTips;
        uint256 tipperCount;
        uint256 matchingAmount;
        uint256 sqrtSum;
    }

    struct TipRecord {
        address tipper;
        uint256 amount;
    }

    uint256 public currentRoundId;
    
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => CreatorInfo)) public creatorsInfo;
    mapping(uint256 => mapping(address => TipRecord[])) public roundCreatorTips;
    mapping(uint256 => mapping(address => bool)) public isRegisteredCreator;
    mapping(uint256 => mapping(address => mapping(address => bool))) public hasTipped; // roundId => creator => tipper => bool

    mapping(address => bool) public isVerifiedHuman;

    event RoundCreated(uint256 indexed roundId, uint256 matchingPoolAmount);
    event CreatorRegistered(uint256 indexed roundId, address indexed creator);
    event TipSent(uint256 indexed roundId, address indexed tipper, address indexed creator, uint256 amount);
    event RoundFinalized(uint256 indexed roundId, uint256 totalMatching, uint256 distributedMatching);
    event FundsDistributed(uint256 indexed roundId, address indexed creator, uint256 totalTips, uint256 matchingAmount);

    modifier onlyVerifier() {
        require(msg.sender == verifier, "Not verifier");
        _;
    }

    modifier onlyActiveRound(uint256 _roundId) {
        require(block.timestamp >= rounds[_roundId].startTime && block.timestamp <= rounds[_roundId].endTime, "Round not active");
        _;
    }

    constructor(address _cUSD, address _verifier) Ownable(msg.sender) {
        require(_cUSD != address(0), "Invalid token address");
        cUSD = IERC20(_cUSD);
        verifier = _verifier;
    }

    function setVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid address");
        verifier = _verifier;
    }

    function createRound(uint256 _matchingPoolAmount) external onlyOwner {
        if (_matchingPoolAmount > 0) {
            cUSD.safeTransferFrom(msg.sender, address(this), _matchingPoolAmount);
        }

        currentRoundId++;
        uint256 roundId = currentRoundId;

        rounds[roundId].id = roundId;
        rounds[roundId].startTime = block.timestamp;
        rounds[roundId].endTime = block.timestamp + ROUND_DURATION;
        rounds[roundId].matchingPool = _matchingPoolAmount;

        emit RoundCreated(roundId, _matchingPoolAmount);
    }

    function fundMatchingPool(uint256 _roundId, uint256 _amount) external {
        require(rounds[_roundId].id != 0, "Round does not exist");
        require(!rounds[_roundId].finalized, "Round finalized");
        require(_amount > 0, "Amount must be greater than 0");

        cUSD.safeTransferFrom(msg.sender, address(this), _amount);
        rounds[_roundId].matchingPool += _amount;
    }

    function registerAsCreator(uint256 _roundId) external {
        require(rounds[_roundId].id != 0, "Round does not exist");
        require(!rounds[_roundId].finalized, "Round finalized");
        require(isVerifiedHuman[msg.sender], "Creator not verified human");
        require(!isRegisteredCreator[_roundId][msg.sender], "Already registered");

        rounds[_roundId].creators.push(msg.sender);
        creatorsInfo[_roundId][msg.sender].creator = msg.sender;
        isRegisteredCreator[_roundId][msg.sender] = true;

        emit CreatorRegistered(_roundId, msg.sender);
    }

    function tip(uint256 _roundId, address _creator, uint256 _amount) external nonReentrant onlyActiveRound(_roundId) {
        require(isVerifiedHuman[msg.sender], "Tipper not verified human");
        require(isRegisteredCreator[_roundId][_creator], "Creator not registered in round");
        require(_amount > 0, "Amount must be greater than 0");

        cUSD.safeTransferFrom(msg.sender, address(this), _amount);

        CreatorInfo storage info = creatorsInfo[_roundId][_creator];
        info.totalTips += _amount;
        
        info.sqrtSum += Math.sqrt(_amount);

        if (!hasTipped[_roundId][_creator][msg.sender]) {
            hasTipped[_roundId][_creator][msg.sender] = true;
            info.tipperCount++;
        }

        roundCreatorTips[_roundId][_creator].push(TipRecord({
            tipper: msg.sender,
            amount: _amount
        }));

        emit TipSent(_roundId, msg.sender, _creator, _amount);
    }

    function setVerifiedHuman(address _user, bool _verified) external onlyVerifier {
        isVerifiedHuman[_user] = _verified;
    }

    function finalizeRound(uint256 _roundId) external nonReentrant {
        Round storage round = rounds[_roundId];
        require(round.id != 0, "Round does not exist");
        require(block.timestamp > round.endTime, "Round still active");
        require(!round.finalized, "Already finalized");

        round.finalized = true;

        uint256 totalMatchingRequired = 0;
        uint256[] memory estimatedMatches = new uint256[](round.creators.length);

        for (uint256 i = 0; i < round.creators.length; i++) {
            address creator = round.creators[i];
            CreatorInfo storage info = creatorsInfo[_roundId][creator];
            
            uint256 squaredSum = info.sqrtSum * info.sqrtSum;
            
            if (squaredSum > info.totalTips) {
                estimatedMatches[i] = squaredSum - info.totalTips;
                totalMatchingRequired += estimatedMatches[i];
            } else {
                estimatedMatches[i] = 0;
            }
        }

        uint256 matchingPool = round.matchingPool;

        for (uint256 i = 0; i < round.creators.length; i++) {
            address creator = round.creators[i];
            CreatorInfo storage info = creatorsInfo[_roundId][creator];
            
            uint256 finalMatching = 0;
            if (totalMatchingRequired > 0) {
                if (totalMatchingRequired > matchingPool) {
                    finalMatching = (estimatedMatches[i] * matchingPool) / totalMatchingRequired;
                } else {
                    finalMatching = estimatedMatches[i];
                }
            }
            
            info.matchingAmount = finalMatching;
            
            uint256 totalPayout = info.totalTips + finalMatching;
            if (totalPayout > 0) {
                cUSD.safeTransfer(creator, totalPayout);
            }
            
            emit FundsDistributed(_roundId, creator, info.totalTips, finalMatching);
        }

        emit RoundFinalized(_roundId, totalMatchingRequired, totalMatchingRequired > matchingPool ? matchingPool : totalMatchingRequired);
    }

    function getRoundInfo(uint256 _roundId) external view returns (Round memory) {
        return rounds[_roundId];
    }

    function getCreatorInfo(uint256 _roundId, address _creator) external view returns (CreatorInfo memory) {
        return creatorsInfo[_roundId][_creator];
    }
    
    function getCreatorTips(uint256 _roundId, address _creator) external view returns (TipRecord[] memory) {
        return roundCreatorTips[_roundId][_creator];
    }

    function getActiveRound() external view returns (uint256) {
        return currentRoundId;
    }

    function estimateMatching(uint256 _roundId, address _creator) external view returns (uint256) {
        CreatorInfo memory info = creatorsInfo[_roundId][_creator];
        uint256 squaredSum = info.sqrtSum * info.sqrtSum;
        if (squaredSum > info.totalTips) {
            return squaredSum - info.totalTips;
        }
        return 0;
    }
}