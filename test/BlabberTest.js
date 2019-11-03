const BlabberToken = artifacts.require('./BlabberToken')

import EVMThrow from './helpers/EVMThrow'
import assertRevert from './helpers/assertRevert';
const BigNumber = web3.BigNumber
var moment = require('moment');
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('BlabberToken', function ([_, owner, recipient, anotherAccount]) {
  	const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  	const totalAmount = new BigNumber('1000000000000000000000000000');

  	beforeEach(async function () {
    	this.token = await BlabberToken.new(owner, owner);
    	await this.token.unlockTokens({ from: owner});
  	});

  	describe('total supply', function () {
    	it('returns the total amount of tokens', async function () {
      		const totalSupply = await this.token.totalSupply();

      		totalSupply.should.be.bignumber.equal(totalAmount);
    	});
  	});

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        const balance = await this.token.balanceOf(recipient);

        assert.equal(balance, 0);
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        const balance = await this.token.balanceOf(owner);

        balance.should.be.bignumber.equal(totalAmount);
      });
    });
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = totalAmount.plus('1');

        it('reverts', async function () {
          	await assertRevert(this.token.transfer(to, amount, {from: owner}));
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = totalAmount;

        it('transfers the requested amount', async function () {
          	await this.token.transfer(to, amount, { from: owner});

          	const senderBalance = await this.token.balanceOf(owner);
          	assert.equal(senderBalance, 0);

          	const recipientBalance = await this.token.balanceOf(to);
          	recipientBalance.should.be.bignumber.equal(amount);
        });

        it('emits a transfer event', async function () {
          	const { logs } = await this.token.transfer(to, amount, { from: owner});

          	assert.equal(logs.length, 1);
          	assert.equal(logs[0].event, 'Transfer');
          	assert.equal(logs[0].args._from, owner);
          	assert.equal(logs[0].args._to, to);
          	logs[0].args._value.should.be.bignumber.equal(amount);
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(this.token.transfer(to, totalAmount, { from: owner}));
      });
    });
  });

  describe('approve', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        const amount = totalAmount;

        it('emits an approval event', async function () {
          const { logs } = await this.token.approve(spender, amount, { from: owner});

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args._owner, owner);
          assert.equal(logs[0].args._spender, spender);
          logs[0].args._value.should.be.bignumber.equal(amount);
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.approve(spender, amount, { from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner});
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await this.token.approve(spender, amount, { from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = totalAmount.plus('1');

        it('emits an approval event', async function () {
          const { logs } = await this.token.approve(spender, amount, { from: owner});

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args._owner, owner);
          assert.equal(logs[0].args._spender, spender);
          logs[0].args._value.should.be.bignumber.equal(amount);
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.approve(spender, amount, { from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner});
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await this.token.approve(spender, amount, { from: owner});

            const allowance = await this.token.allowance(owner, spender);
            allowance.should.be.bignumber.equal(amount);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = totalAmount;
      const spender = ZERO_ADDRESS;

      it('approves the requested amount', async function () {
        await this.token.approve(spender, amount, { from: owner});

        const allowance = await this.token.allowance(owner, spender);
        allowance.should.be.bignumber.equal(amount);
      });

      it('emits an approval event', async function () {
        const { logs } = await this.token.approve(spender, amount, { from: owner});

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, owner);
        assert.equal(logs[0].args._spender, spender);
        logs[0].args._value.should.be.bignumber.equal(amount);
      });
    });
  });

  describe('transfer from', function () {
    const spender = recipient;

    describe('when the recipient is not the zero address', function () {
      const to = anotherAccount;

      describe('when the spender has enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, totalAmount, { from: owner});
        });

        describe('when the owner has enough balance', function () {
          const amount = totalAmount;

          it('transfers the requested amount', async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            const senderBalance = await this.token.balanceOf(owner);
            assert.equal(senderBalance, 0);

            const recipientBalance = await this.token.balanceOf(to);
            recipientBalance.should.be.bignumber.equal(amount);
          });

          it('decreases the spender allowance', async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            const allowance = await this.token.allowance(owner, spender);
            assert(allowance.eq(0));
          });

          it('emits a transfer event', async function () {
            const { logs } = await this.token.transferFrom(owner, to, amount, { from: spender });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Transfer');
            assert.equal(logs[0].args._from, owner);
            assert.equal(logs[0].args._to, to);
            logs[0].args._value.should.be.bignumber.equal(amount);
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = totalAmount.plus('1');

          it('reverts', async function () {
            await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });

      describe('when the spender does not have enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, totalAmount.minus('1'), { from: owner});
        });

        describe('when the owner has enough balance', function () {
          const amount = totalAmount;

          it('reverts', async function () {
            await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = totalAmount.plus('1');

          it('reverts', async function () {
            await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const amount = totalAmount;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await this.token.approve(spender, amount, { from: owner});
      });

      it('reverts', async function () {
        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
      });
    });
  });
});