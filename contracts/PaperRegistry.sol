// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaperRegistry {
    address public admin;
    address public examBoard;

    enum Status { Uploaded, Approved }

    struct Paper {
        string cid;
        string fileHash;
        uint256 examTimestamp;
        string subject;
        Status status;
        uint8 approvals;
    }

    mapping(uint256 => Paper) public papers;
    uint256 public paperCount;

    mapping(address => bool) public registeredCenters;
    mapping(address => bool) public committeeMembers;
    mapping(uint256 => mapping(address => bool)) public hasApproved;

    event PaperUploaded(uint256 indexed paperId, string cid, string fileHash, uint256 examTimestamp, string subject);
    event AccessAttempted(uint256 indexed paperId, address indexed requester, bool success, string reason);
    event PaperApproved(uint256 indexed paperId, address indexed approver, uint8 totalApprovals);
    event CenterRegistered(address indexed center);

    modifier onlyBoard() {
        require(msg.sender == examBoard, "Not authorized: not Exam Board");
        _;
    }

    modifier onlyRegisteredCenter() {
        require(registeredCenters[msg.sender], "Not authorized: center not registered");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized: not admin");
        _;
    }

    constructor(address _examBoard) {
        admin = msg.sender;
        examBoard = _examBoard;
    }

    function uploadPaper(
        string calldata cid,
        string calldata fileHash,
        uint256 examTimestamp,
        string calldata subject
    ) external onlyBoard returns (uint256) {
        require(examTimestamp > block.timestamp, "Exam time must be in the future");

        paperCount++;
        papers[paperCount] = Paper(cid, fileHash, examTimestamp, subject, Status.Uploaded, 0);

        emit PaperUploaded(paperCount, cid, fileHash, examTimestamp, subject);
        return paperCount;
    }

        function requestKey(uint256 paperId) external onlyRegisteredCenter returns (bool) {
        Paper storage p = papers[paperId];
        require(p.examTimestamp != 0, "Paper does not exist");

        if (block.timestamp < p.examTimestamp) {
            emit AccessAttempted(paperId, msg.sender, false, "Too early");
            return false;
        }

        emit AccessAttempted(paperId, msg.sender, true, "Granted");
        return true;
    }
    
    function registerCenter(address centerAddress) external onlyAdmin {
        registeredCenters[centerAddress] = true;
        emit CenterRegistered(centerAddress);
    }

    function addCommitteeMember(address member) external onlyAdmin {
        committeeMembers[member] = true;
    }

    function approvePaper(uint256 paperId) external {
        require(committeeMembers[msg.sender], "Not a committee member");
        require(!hasApproved[paperId][msg.sender], "Already approved");

        hasApproved[paperId][msg.sender] = true;
        papers[paperId].approvals++;

        if (papers[paperId].approvals >= 2) {
            papers[paperId].status = Status.Approved;
        }

        emit PaperApproved(paperId, msg.sender, papers[paperId].approvals);
    }

    function simulateTime(uint256 paperId, uint256 newExamTimestamp) external onlyAdmin {
        papers[paperId].examTimestamp = newExamTimestamp;
    }

    function getPaper(uint256 paperId) external view returns (Paper memory) {
        return papers[paperId];
    }
}