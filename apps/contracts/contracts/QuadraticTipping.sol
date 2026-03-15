// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract QuadraticTipping is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public verifier;

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
    mapping(uint256 => mapping(address => mapping(address => bool)))
        public hasTipped; // roundId => creator => tipper => bool

    mapping(address => bool) public isVerifiedHuman;

    event RoundCreated(
        uint256 indexed roundId,
        uint256 matchingPoolAmount,
        uint256 durationInSeconds
    );
    event CreatorRegistered(uint256 indexed roundId, address indexed creator);
    event TipSent(
        uint256 indexed roundId,
        address indexed tipper,
        address indexed creator,
        uint256 amount
    );
    event RoundFinalized(
        uint256 indexed roundId,
        uint256 totalMatching,
        uint256 distributedMatching
    );
    event FundsDistributed(
        uint256 indexed roundId,
        address indexed creator,
        uint256 totalTips,
        uint256 matchingAmount
    );

    modifier onlyVerifier() {
        require(msg.sender == verifier, "Not verifier");
        _;
    }

    modifier onlyActiveRound(uint256 _roundId) {
        require(
            block.timestamp >= rounds[_roundId].startTime &&
                block.timestamp <= rounds[_roundId].endTime,
            "Round not active"
        );
        _;
    }

    constructor(address _usdc, address _verifier) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid token address");
        usdc = IERC20(_usdc);
        verifier = _verifier;
    }

    function setVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid address");
        verifier = _verifier;
    }

    function createRound(
        uint256 _matchingPoolAmount,
        uint256 _durationInSeconds
    ) external onlyOwner {
        require(_durationInSeconds > 0, "Duration must be > 0");

        if (_matchingPoolAmount > 0) {
            usdc.safeTransferFrom(
                msg.sender,
                address(this),
                _matchingPoolAmount
            );
        }

        currentRoundId++;
        uint256 roundId = currentRoundId;

        rounds[roundId].id = roundId;
        rounds[roundId].startTime = block.timestamp;
        rounds[roundId].endTime = block.timestamp + _durationInSeconds;
        rounds[roundId].matchingPool = _matchingPoolAmount;

        emit RoundCreated(roundId, _matchingPoolAmount, _durationInSeconds);
    }

    function fundMatchingPool(uint256 _roundId, uint256 _amount) external {
        require(rounds[_roundId].id != 0, "Round does not exist");
        require(!rounds[_roundId].finalized, "Round finalized");
        require(_amount > 0, "Amount must be greater than 0");

        usdc.safeTransferFrom(msg.sender, address(this), _amount);
        rounds[_roundId].matchingPool += _amount;
    }

    function registerAsCreator(uint256 _roundId) external {
        require(rounds[_roundId].id != 0, "Round does not exist");
        require(!rounds[_roundId].finalized, "Round finalized");
        require(isVerifiedHuman[msg.sender], "Creator not verified human");
        require(
            !isRegisteredCreator[_roundId][msg.sender],
            "Already registered"
        );

        rounds[_roundId].creators.push(msg.sender);
        creatorsInfo[_roundId][msg.sender].creator = msg.sender;
        isRegisteredCreator[_roundId][msg.sender] = true;

        emit CreatorRegistered(_roundId, msg.sender);
    }

    function tip(
        uint256 _roundId,
        address _creator,
        uint256 _amount
    ) external nonReentrant onlyActiveRound(_roundId) {
        require(isVerifiedHuman[msg.sender], "Tipper not verified human"); //valida que sea humano
        require(
            isRegisteredCreator[_roundId][_creator], //valida que el creador este registrado
            "Creator not registered in round"
        );
        require(_amount > 0, "Amount must be greater than 0"); //valida que el monto sea mayor a 0

        usdc.safeTransferFrom(msg.sender, address(this), _amount); //transfiere el monto del donante al contrato

        CreatorInfo storage info = creatorsInfo[_roundId][_creator]; //obtiene la informacion del creador
        info.totalTips += _amount; //suma el monto al total de tips del creador

        info.sqrtSum += Math.sqrt(_amount); //suma la raiz cuadrada al atributo sqrtSum del creador

        if (!hasTipped[_roundId][_creator][msg.sender]) {
            //valida que el donante no haya donado antes al creador
            hasTipped[_roundId][_creator][msg.sender] = true; //marca que el donante ha donado al creador
            info.tipperCount++; //incrementa el contador de donantes
        }

        roundCreatorTips[_roundId][_creator].push(
            TipRecord({tipper: msg.sender, amount: _amount})
        );

        emit TipSent(_roundId, msg.sender, _creator, _amount);
    }

    function setVerifiedHuman(
        address _user,
        bool _verified
    ) external onlyVerifier {
        isVerifiedHuman[_user] = _verified;
    }

    function finalizeRound(uint256 _roundId) external nonReentrant {
        Round storage round = rounds[_roundId]; //obtiene la informacion de la ronda
        require(round.id != 0, "Round does not exist"); //valida que la ronda exista
        require(block.timestamp > round.endTime, "Round still active"); //valida que la ronda no este activa
        require(!round.finalized, "Already finalized"); //valida que la ronda no este finalizada

        round.finalized = true; //marca la ronda como finalizada

        uint256 totalMatchingRequired = 0; //inicializa el total de matching requerido
        uint256[] memory estimatedMatches = new uint256[](
            round.creators.length
        ); //crea un array para almacenar el matching estimado para cada creador

        for (uint256 i = 0; i < round.creators.length; i++) {
            //itera sobre cada creador
            address creator = round.creators[i]; //obtiene la direccion del creador
            CreatorInfo storage info = creatorsInfo[_roundId][creator]; //obtiene la informacion del creador

            uint256 squaredSum = info.sqrtSum * info.sqrtSum; //calcula el cuadrado de la raiz cuadrada de los tips

            if (squaredSum > info.totalTips) {
                //valida que el cuadrado de la raiz cuadrada de los tips sea mayor al total de tips
                estimatedMatches[i] = squaredSum - info.totalTips; //calcula el matching estimado para cada creador
                totalMatchingRequired += estimatedMatches[i]; //suma el matching estimado al total de matching requerido
            } else {
                estimatedMatches[i] = 0; //si el cuadrado de la raiz cuadrada de los tips es menor o igual al total de tips, el matching estimado es 0
            }
        }

        uint256 matchingPool = round.matchingPool; //obtiene el matching pool

        for (uint256 i = 0; i < round.creators.length; i++) {
            //itera sobre cada creador
            address creator = round.creators[i]; //obtiene la direccion del creador
            CreatorInfo storage info = creatorsInfo[_roundId][creator]; //obtiene la informacion del creador

            uint256 finalMatching = 0; //inicializa el matching final
            if (totalMatchingRequired > 0) {
                //valida que el total de matching requerido sea mayor a 0
                if (totalMatchingRequired > matchingPool) {
                    //valida que el total de matching requerido sea mayor al matching pool
                    finalMatching =
                        (estimatedMatches[i] * matchingPool) /
                        totalMatchingRequired; //calcula el matching final para cada creador
                } else {
                    finalMatching = estimatedMatches[i]; //si el total de matching requerido es menor o igual al matching pool, el matching final es el matching estimado
                }
            }

            info.matchingAmount = finalMatching; //establece el matching final para cada creador

            uint256 totalPayout = info.totalTips + finalMatching; //calcula el pago total para cada creador
            if (totalPayout > 0) {
                //valida que el pago total sea mayor a 0
                usdc.safeTransfer(creator, totalPayout); //transfiere el pago total al creador
            }

            emit FundsDistributed(
                _roundId,
                creator,
                info.totalTips,
                finalMatching
            );
        }

        emit RoundFinalized(
            _roundId,
            totalMatchingRequired,
            totalMatchingRequired > matchingPool
                ? matchingPool
                : totalMatchingRequired
        );
    }

    function getRoundInfo(
        uint256 _roundId
    ) external view returns (Round memory) {
        return rounds[_roundId];
    }

    function getCreatorInfo(
        uint256 _roundId,
        address _creator
    ) external view returns (CreatorInfo memory) {
        return creatorsInfo[_roundId][_creator];
    }

    function getCreatorTips(
        uint256 _roundId,
        address _creator
    ) external view returns (TipRecord[] memory) {
        return roundCreatorTips[_roundId][_creator];
    }

    function getActiveRound() external view returns (uint256) {
        return currentRoundId;
    }

    function estimateMatching(
        uint256 _roundId,
        address _creator
    ) external view returns (uint256) {
        CreatorInfo memory info = creatorsInfo[_roundId][_creator];
        uint256 squaredSum = info.sqrtSum * info.sqrtSum;
        if (squaredSum > info.totalTips) {
            return squaredSum - info.totalTips;
        }
        return 0;
    }
}
