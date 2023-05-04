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
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Work {

    uint internal Workforce = 0;
    uint internal Assignments = 0;
    uint public platfee;
    address public platowner;
    
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

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
    
    mapping (uint => string[]) internal AssignmentCompleted;
    mapping (uint => mapping(uint => string)) internal submissions;
    mapping (uint => mapping(uint => address)) internal submitterList;
    mapping (address => bool) internal workers;
    mapping (uint => Worker) internal workforce;
    mapping (uint => Assignment) internal AssignmentsToDo;
    
    constructor() {
        platowner = msg.sender;
    }
    
    modifier OnlyOwner() {
        require(msg.sender == platowner);
        _;
    }

    modifier OnlyRegistered () {
        require(workers[msg.sender]);
        _;
    }

    modifier OnlyEmployer (uint _index) {
        require(msg.sender == AssignmentsToDo[_index].employer);
        _;
    }

    function SetPlatFee (uint _newfee) OnlyOwner() public {
        platfee = _newfee;
    }

    function Addassignment(
        string memory _name,
        string memory _image,
        string memory _description,  
        uint _price
    
    ) public {
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            address(this),
            _price
          ),
          "Transfer failed."
        );

        AssignmentsToDo[Assignments].employer = payable(msg.sender);
        AssignmentsToDo[Assignments].name = _name;
        AssignmentsToDo[Assignments].image= _image;
        AssignmentsToDo[Assignments].AssignmentDescription = _description;
        AssignmentsToDo[Assignments].price = _price;
        AssignmentsToDo[Assignments].index = Assignments;
        AssignmentsToDo[Assignments].SubmissionCounter = 0;
        
        Assignments++;
    }

    function AddtoWorkforce (
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
        Workforce++;
    }

    function GetAssignment(uint _index) OnlyRegistered() public view returns (
        address payable,
        string memory, 
        string memory,  
        string memory, 
        uint
    ) {
        return (
            AssignmentsToDo[_index].employer,
            AssignmentsToDo[_index].name, 
            AssignmentsToDo[_index].image, 
            AssignmentsToDo[_index].AssignmentDescription, 
            AssignmentsToDo[_index].price
        );
    }

    function GetWorkerInfo(uint _index) public view returns(
        address payable,
        string memory,
        string memory,
        string memory,
        uint

    ) {
       return(
          workforce[_index].Worker,
          workforce[_index].name,
          workforce[_index].image,
          workforce[_index].description,
          workforce[_index].AssignmentsDone 
       );
    }
    
    function SubmitWork(uint _index, string calldata _submissions) OnlyRegistered() public returns (uint)  {
        uint SubId = AssignmentsToDo[_index].SubmissionCounter ;
        submissions[_index][SubId] = _submissions;
        submitterList[_index][SubId] = msg.sender;
        
        AssignmentsToDo[_index].SubmissionCounter++ ;

        return(SubId);

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

    function GetSubmission(uint _index,uint _SubId) public view returns(string memory, address){
        return(submissions[_index][_SubId],
               submitterList[_index][_SubId] 
               );
    }

    function SetBestSubmission(uint _Aindex, uint _Sindex) public returns(string memory, address){
         AssignmentsToDo[_Aindex].BestSubmission = submissions[_Aindex][_Sindex];
         AssignmentsToDo[_Aindex].BestSubmitter = payable(submitterList[_Aindex][_Sindex]);
         return(
           AssignmentsToDo[_Aindex].BestSubmission,
           AssignmentsToDo[_Aindex].BestSubmitter
         );
    }

    function Award(uint _index) public OnlyEmployer(_index){
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
            address(this),
            AssignmentsToDo[_index].BestSubmitter,
            AssignmentsToDo[_index].price
          ),
          "Transfer failed."
        );
    
    }
}
