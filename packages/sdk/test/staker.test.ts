import { Token } from '@convexus/sdk-core'
import { FeeAmount } from '../src/constants'
import { Pool } from '../src/entities/pool'
import { Staker } from '../src/staker'
import { NonfungiblePositionManager } from '../src/nonfungiblePositionManager'
import { encodeSqrtRatioX96 } from '../src/utils/encodeSqrtRatioX96'
import { TestPoolFactoryProvider } from './entities/TestPoolFactoryProvider'

describe('Staker', () => {
  const reward = new Token('cx1f9840a85d5af5bf1d1762f925bdaddc4201f984', 18, 'r',  'reward')
  const token0 = new Token('cx0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token('cx0000000000000000000000000000000000000002', 18, 't1', 'token1')
  const stakerAddress = "cx0000000000000000000000000000000000000003";
  const nonfungiblePositionManagerAddress = "cx0000000000000000000000000000000000000004";

  const pool_0_1 = new Pool(token0, token1, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])

  const incentiveKey = {
    rewardToken: reward,
    pool: pool_0_1,
    startTime: 100,
    endTime: 200,
    refundee: 'hx0000000000000000000000000000000000000001'
  }

  const incentiveKeys = [incentiveKey]
  incentiveKeys.push({
    rewardToken: reward,
    pool: pool_0_1,
    startTime: 50,
    endTime: 100,
    refundee: 'hx0000000000000000000000000000000000000089'
  })

  const poolFactoryProvider = new TestPoolFactoryProvider()

  const recipient = 'hx0000000000000000000000000000000000000003'
  const sender = 'hx0000000000000000000000000000000000000004'
  const tokenId = 1

  describe('#collectRewards', () => {
    it('succeeds with amount', async () => {
      const calldata = await Staker.collectRewards(poolFactoryProvider, incentiveKey, {
        tokenId: tokenId,
        recipient: recipient,
        amount: 1
      }, stakerAddress)

      expect(calldata).toStrictEqual([
        {
          "claimRewardTx": {
            "method": "claimReward",
            "params": {
              "amountRequested": "0x1",
              "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
              "to": "hx0000000000000000000000000000000000000003"
            },
            "to": "cx0000000000000000000000000000000000000003"
          },
          "unstakeTokenTx": {
            "method": "unstakeToken",
            "params": {
              "key": {
                "endTime": "0xc8",
                "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                "refundee": "hx0000000000000000000000000000000000000001",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "startTime": "0x64"
              },
              "tokenId": "0x1"
            },
            "to": "cx0000000000000000000000000000000000000003"
          }
        },
        {
          "method": "stakeToken",
          "params": {
            "key": {
              "endTime": "0xc8",
              "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
              "refundee": "hx0000000000000000000000000000000000000001",
              "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
              "startTime": "0x64"
            },
            "tokenId": "0x1"
          },
          "to": "cx0000000000000000000000000000000000000003"
        }
      ])
    })

    it('succeeds no amount', async () => {
      const calldata = await Staker.collectRewards(poolFactoryProvider, incentiveKey, {
        tokenId: tokenId,
        recipient: recipient
      }, stakerAddress)

      expect(calldata).toStrictEqual(
        [
          {
            "claimRewardTx": {
              "method": "claimReward",
              "params": {
                "amountRequested": "0x0",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "to": "hx0000000000000000000000000000000000000003"
              },
              "to": "cx0000000000000000000000000000000000000003"
            },
            "unstakeTokenTx": {
              "method": "unstakeToken",
              "params": {
                "key": {
                  "endTime": "0xc8",
                  "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                  "refundee": "hx0000000000000000000000000000000000000001",
                  "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                  "startTime": "0x64"
                },
                "tokenId": "0x1"
              },
              "to": "cx0000000000000000000000000000000000000003"
            }
          },
          {
            "method": "stakeToken",
            "params": {
              "key": {
                "endTime": "0xc8",
                "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                "refundee": "hx0000000000000000000000000000000000000001",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "startTime": "0x64"
              },
              "tokenId": "0x1"
            },
            "to": "cx0000000000000000000000000000000000000003"
          }
        ]
      )
    })

    it('succeeds multiple keys', async () => {
      const calldata = await Staker.collectRewards(poolFactoryProvider, incentiveKeys, {
        tokenId: tokenId,
        recipient: recipient
      }, stakerAddress)

      expect(calldata).toStrictEqual(
        [
          {
            "claimRewardTx": {
              "method": "claimReward",
              "params": {
                "amountRequested": "0x0",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "to": "hx0000000000000000000000000000000000000003"
              },
              "to": "cx0000000000000000000000000000000000000003"
            },
            "unstakeTokenTx": {
              "method": "unstakeToken",
              "params": {
                "key": {
                  "endTime": "0xc8",
                  "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                  "refundee": "hx0000000000000000000000000000000000000001",
                  "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                  "startTime": "0x64"
                },
                "tokenId": "0x1"
              },
              "to": "cx0000000000000000000000000000000000000003"
            }
          },
          {
            "method": "stakeToken",
            "params": {
              "key": {
                "endTime": "0xc8",
                "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                "refundee": "hx0000000000000000000000000000000000000001",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "startTime": "0x64"
              },
              "tokenId": "0x1"
            },
            "to": "cx0000000000000000000000000000000000000003"
          },
          {
            "claimRewardTx": {
              "method": "claimReward",
              "params": {
                "amountRequested": "0x0",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "to": "hx0000000000000000000000000000000000000003"
              },
              "to": "cx0000000000000000000000000000000000000003"
            },
            "unstakeTokenTx": {
              "method": "unstakeToken",
              "params": {
                "key": {
                  "endTime": "0x64",
                  "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                  "refundee": "hx0000000000000000000000000000000000000089",
                  "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                  "startTime": "0x32"
                },
                "tokenId": "0x1"
              },
              "to": "cx0000000000000000000000000000000000000003"
            }
          },
          {
            "method": "stakeToken",
            "params": {
              "key": {
                "endTime": "0x64",
                "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                "refundee": "hx0000000000000000000000000000000000000089",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "startTime": "0x32"
              },
              "tokenId": "0x1"
            },
            "to": "cx0000000000000000000000000000000000000003"
          }
        ]
      )
    })
  })

  describe('#withdrawToken', () => {
    it('succeeds with one keys', async () => {
      const calldata = await Staker.withdrawToken(poolFactoryProvider, incentiveKey, {
        tokenId: tokenId,
        recipient: recipient,
        amount: 0,
        owner: sender,
        data: '0x0000000000000000000000000000000000000008'
      }, stakerAddress)

      expect(calldata).toStrictEqual(
        [
          {
            "claimRewardTx": {
              "method": "claimReward",
              "params": {
                "amountRequested": "0x0",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "to": "hx0000000000000000000000000000000000000003"
              },
              "to": "cx0000000000000000000000000000000000000003"
            },
            "unstakeTokenTx": {
              "method": "unstakeToken",
              "params": {
                "key": {
                  "endTime": "0xc8",
                  "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                  "refundee": "hx0000000000000000000000000000000000000001",
                  "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                  "startTime": "0x64"
                },
                "tokenId": "0x1"
              },
              "to": "cx0000000000000000000000000000000000000003"
            }
          },
          {
            "method": "withdrawToken",
            "params": {
              "data": "0x0000000000000000000000000000000000000008",
              "to": "hx0000000000000000000000000000000000000004",
              "tokenId": "0x1"
            },
            "to": "cx0000000000000000000000000000000000000003"
          }
        ]
      )
    })

    it('succeeds with multiple keys', async () => {
      const calldata = await Staker.withdrawToken(poolFactoryProvider, incentiveKeys, {
        tokenId: tokenId,
        recipient: recipient,
        amount: 0,
        owner: sender,
        data: '0x0000000000000000000000000000000000000008'
      }, stakerAddress)

      expect(calldata).toStrictEqual(
        [
          {
            "claimRewardTx": {
              "method": "claimReward",
              "params": {
                "amountRequested": "0x0",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "to": "hx0000000000000000000000000000000000000003"
              },
              "to": "cx0000000000000000000000000000000000000003"
            },
            "unstakeTokenTx": {
              "method": "unstakeToken",
              "params": {
                "key": {
                  "endTime": "0xc8",
                  "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                  "refundee": "hx0000000000000000000000000000000000000001",
                  "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                  "startTime": "0x64"
                },
                "tokenId": "0x1"
              },
              "to": "cx0000000000000000000000000000000000000003"
            }
          },
          {
            "claimRewardTx": {
              "method": "claimReward",
              "params": {
                "amountRequested": "0x0",
                "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                "to": "hx0000000000000000000000000000000000000003"
              },
              "to": "cx0000000000000000000000000000000000000003"
            },
            "unstakeTokenTx": {
              "method": "unstakeToken",
              "params": {
                "key": {
                  "endTime": "0x64",
                  "pool": "cx41ca025441ca025441ca026041ca025441ca027c",
                  "refundee": "hx0000000000000000000000000000000000000089",
                  "rewardToken": "cx1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                  "startTime": "0x32"
                },
                "tokenId": "0x1"
              },
              "to": "cx0000000000000000000000000000000000000003"
            }
          },
          {
            "method": "withdrawToken",
            "params": {
              "data": "0x0000000000000000000000000000000000000008",
              "to": "hx0000000000000000000000000000000000000004",
              "tokenId": "0x1"
            },
            "to": "cx0000000000000000000000000000000000000003"
          }
        ]
      )
    })
  })

  describe('#encodeDeposit', () => {
    it('succeeds single key', async () => {
      const deposit = await Staker.encodeDeposit(poolFactoryProvider, incentiveKey)

      expect(deposit).toEqual(
        '0x5b5b22637831663938343061383564356166356266316431373632663932356264616464633432303166393834222c22637834316361303235343431636130323534343163613032363034316361303235343431636130323763222c2230783634222c2230786338222c22687830303030303030303030303030303030303030303030303030303030303030303030303030303031225d5d'
      )
    })

    it('succeeds multiple keys', async () => {
      const deposit = await Staker.encodeDeposit(poolFactoryProvider, incentiveKeys)

      expect(deposit).toEqual(
        '0x5b5b22637831663938343061383564356166356266316431373632663932356264616464633432303166393834222c22637834316361303235343431636130323534343163613032363034316361303235343431636130323763222c2230783634222c2230786338222c22687830303030303030303030303030303030303030303030303030303030303030303030303030303031225d2c5b22637831663938343061383564356166356266316431373632663932356264616464633432303166393834222c22637834316361303235343431636130323534343163613032363034316361303235343431636130323763222c2230783332222c2230783634222c22687830303030303030303030303030303030303030303030303030303030303030303030303030303839225d5d'
      )
    })
  })

  describe('#safeTransferFrom with correct data for staker', () => {
    it('succeeds', async () => {
      const data = await Staker.encodeDeposit(poolFactoryProvider, incentiveKey)

      const options = {
        sender,
        recipient,
        tokenId,
        data
      }
      const calldata = NonfungiblePositionManager.safeTransferFromParameters(options, nonfungiblePositionManagerAddress)

      expect(calldata).toStrictEqual(
        {
          "to": nonfungiblePositionManagerAddress,
          "method": "safeTransferFrom",
          "params": {
            "_data": "0x5b5b22637831663938343061383564356166356266316431373632663932356264616464633432303166393834222c22637834316361303235343431636130323534343163613032363034316361303235343431636130323763222c2230783634222c2230786338222c22687830303030303030303030303030303030303030303030303030303030303030303030303030303031225d5d",
            "from": "hx0000000000000000000000000000000000000004",
            "to": "hx0000000000000000000000000000000000000003",
            "tokenId": "0x1"
          }
        }
      )
    })
  })
})
