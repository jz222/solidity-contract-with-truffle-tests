pragma solidity 0.4.23;

import './ERC20Interface.sol';
import './SafeMath.sol';

contract BlabberToken is ERC20Interface {
	// Using safe mathematical operations to prevent underflow and overflow attacks
	using SafeMath for uint256;

	// Fixed total supply of 1.25 billion tokens
	uint public _totalSupply = 1250000000000000000000000000;

	// Transfer of tokens is locked until the crowdsale is over
	bool public isLocked = true;
	string public constant symbol = "BLA";
	string public constant name = "BLABBER Token";
	uint8 public constant decimals = 18;

	// Defines the wallet that distributes the tokens during the crowdsale
	address public tokenHolder = 0xDf73b94a0e7150B2BAfF062c22744F61eE217574;

	mapping(address => uint256) balances;
	mapping(address => mapping(address => uint256)) allowed;

	// Defines the admin of the contract
	modifier onlyAdmin{
		require(msg.sender == 0x6A88e24C90F06b15aeb61Ff9E12DB97777D30BE2);
		_;
	}

	// Unlocks the token transfer after the crowdsale
	function unlockTokens() public onlyAdmin {
		isLocked = false;
	}

	constructor() public {
		balances[tokenHolder] = _totalSupply;
	}

	function totalSupply() public constant returns (uint256 total) {
		return _totalSupply;
	}

	function balanceOf(address _owner) public constant returns (uint256 balance) {
		return balances[_owner];
	}

	function transfer(address _to, uint256 _value) public returns (bool success) {
		require(
			balances[msg.sender] >= _value
			&& _value > 0
		);

		require(!isLocked || (msg.sender == tokenHolder));

		balances[msg.sender] = balances[msg.sender].sub(_value);
		balances[_to] = balances[_to].add(_value);

		emit Transfer(msg.sender, _to, _value);

		return true;
	}

	function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
		require(
			allowed[_from][msg.sender] >= _value
			&& balances[_from] >= _value
			&& _value > 0
		);

		require(!isLocked || (msg.sender == tokenHolder));

		balances[_from] = balances[_from].sub(_value);
		balances[_to] = balances[_to].add(_value);

		allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);

		emit Transfer(_from, _to, _value);

		return true;
	}

	function approve(address _spender, uint256 _value) public returns (bool success) {
		allowed[msg.sender][_spender] = _value;
		emit Approval(msg.sender, _spender, _value);

		return true;
	}

	// Allows the user to increase their approval
	function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
		allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
		emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);

		return true;
	}

	// Allows the user to decrease their approval
	function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
		uint oldValue = allowed[msg.sender][_spender];

		if (_subtractedValue > oldValue) {
			allowed[msg.sender][_spender] = 0;
		} else {
			allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
		}

		emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);

		return true;
	}

	function allowance(address _owner, address _spender) public constant returns (uint256 remaining) {
		return allowed[_owner][_spender];
	}

	// tokenHolder can burn unsold tokens
	function burn(uint256 _value) public {
		require(_value <= balances[msg.sender]);

		require(msg.sender == tokenHolder);

		address burner = msg.sender;
		balances[burner] = balances[burner].sub(_value);
		_totalSupply = _totalSupply.sub(_value);
		emit Burn(burner, _value);
	}

	event Transfer(address indexed _from, address indexed _to, uint256 _value);
	event Approval(address indexed _owner, address indexed _spender, uint256 _value);
	event Burn(address indexed burner, uint256 value);
}
