// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(address, address, uint256) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

// @dev Added a WorkFactory contract that allows for easy creation of Work contracts. The Work contract constructor now takes an argument of the platowner address. 

contract WorkFactory {
    address[] public WorkAddresses;
    mapping(address => bool) internal WorkContracts;

    function createWork() public {
        address newContract = address(new Work(msg.sender));
        WorkAddresses.push(newContract);
        WorkContracts[newContract] = true;
    }

    function getWorkAddresses() public view returns (address[] memory) {
        return WorkAddresses;
    }

    function isWorkContract(address _address) public view returns (bool) {
        return WorkContracts[_address];
    }
}

contract Work {
    uint internal Workforce = 0;
    uint internal Assignments = 0;
    uint public platfee;
    address public platowner;

    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Worker {
        address payable Worker;
        string name;
        string image;
        string description;
        uint AssignmentsDone;
        uint index;
    }

    struct Assignment {
        address payable employer;
        address payable BestSubmitter;
        string name;
        string image;
        string AssignmentDescription;
        string BestSubmission;
        uint price;
        uint index;
        uint SubmissionCounter;
    }

    mapping(uint => string[]) internal AssignmentCompleted;
    mapping(uint => mapping(uint => string)) internal submissions;
    mapping(uint => mapping(uint => address)) internal submitterList;
    mapping(address => bool) internal workers;
    mapping(uint => Worker) internal workforce;
    mapping(uint => Assignment) internal AssignmentsToDo;

    constructor(address _platowner) {
        platowner = _platowner;
    }

    modifier OnlyOwner() {
        require(msg.sender == platowner);
        _;
    }

    modifier OnlyRegistered() {
        require(workers[msg.sender], "Worker is not registered.");
        _;
    }

    modifier OnlyEmployer(uint _index) {
        require(
            msg.sender == AssignmentsToDo[_index].employer,
            "Caller is not the employer."
        );
        _;
    }

    function SetPlatFee(uint _newfee) public OnlyOwner {
        platfee = _newfee;
    }

    /**
     * @dev Adds a new worker to the contract.
     * @param _name The name of the worker.
     * @param _image The image associated with the worker.
     * @param _description A description of the worker's skills and experience.
     * AddtoWorkforce function to set the workers mapping to true for a registered worker. This is to ensure that only registered workers can submit work for assignments.
     */
    function AddtoWorkforce(
        string calldata _name,
        string calldata _image,
        string calldata _description
    ) public {
        workforce[Workforce] = Worker(
            payable(msg.sender),
            _name,
            _image,
            _description,
            0,
            Workforce
        );
        workers[msg.sender] = true;
        Workforce++;
    }

    function GetAssignment(
        uint _index
    )
        public
        view
        OnlyRegistered
        returns (
            address payable,
            string memory,
            string memory,
            string memory,
            uint
        )
    {
        return (
            AssignmentsToDo[_index].employer,
            AssignmentsToDo[_index].name,
            AssignmentsToDo[_index].image,
            AssignmentsToDo[_index].AssignmentDescription,
            AssignmentsToDo[_index].price
        );
    }

    function GetWorkerInfo(
        uint _index
    )
        public
        view
        returns (
            address payable,
            string memory,
            string memory,
            string memory,
            uint
        )
    {
        return (
            workforce[_index].Worker,
            workforce[_index].name,
            workforce[_index].image,
            workforce[_index].description,
            workforce[_index].AssignmentsDone
        );
    }

    function SubmitWork(
        uint _index,
        string calldata _submissions
    ) public OnlyRegistered returns (uint) {
        uint SubId = AssignmentsToDo[_index].SubmissionCounter;
        submissions[_index][SubId] = _submissions;
        submitterList[_index][SubId] = msg.sender;

        AssignmentsToDo[_index].SubmissionCounter++;

        return (SubId);
    }

    /*
    function Inspect(uint _index) public OnlyEmployer(_index){
        uint NOS = AssignmentsToDo[_index].SubmissionCounter;
        for(uint i=0; i<NOS; i++) {
           GetSubmission(_index, i);  
        }
    } */

    function getAssignmentsToDoSize() public view returns (uint) {
        return (Assignments);
    }

    function getSubmissionsSize(uint _index) public view returns (uint) {
        return (AssignmentsToDo[_index].SubmissionCounter);
    }

    function getworkersSize() public view returns (uint) {
        return (Workforce);
    }

    function GetSubmission(
        uint _index,
        uint _SubId
    ) public view returns (string memory, address) {
        return (submissions[_index][_SubId], submitterList[_index][_SubId]);
    }

    function SetBestSubmission(
        uint _Aindex,
        uint _Sindex
    ) public returns (string memory, address) {
        AssignmentsToDo[_Aindex].BestSubmission = submissions[_Aindex][_Sindex];
        AssignmentsToDo[_Aindex].BestSubmitter = payable(
            submitterList[_Aindex][_Sindex]
        );
        return (
            AssignmentsToDo[_Aindex].BestSubmission,
            AssignmentsToDo[_Aindex].BestSubmitter
        );
    }

    function Award(uint _index) public OnlyEmployer(_index) {
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                address(this),
                AssignmentsToDo[_index].BestSubmitter,
                AssignmentsToDo[_index].price
            ),
            "Transfer failed."
        );
    }

    /**
     * @dev Allows the contract owner to withdraw tokens from the contract.
     * @param _to The address to send the tokens to.
     * @param _amount The amount of tokens to withdraw.
     */
    function withdraw(address _to, uint256 _amount) public OnlyOwner {
        require(
            IERC20Token(cUsdTokenAddress).transfer(_to, _amount),
            "Transfer failed."
        );
    }
}
