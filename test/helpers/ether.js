export default function ether(n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'))
}


// arbiPreIco.buyTokens("0x99f3fc1d613b2e0593468b7a7381793e928f7817", {from: "0x99f3fc1d613b2e0593468b7a7381793e928f7817", value: web3.toWei(0.01, 'ether')})