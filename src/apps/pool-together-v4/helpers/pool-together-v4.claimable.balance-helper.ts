import { Inject } from '@nestjs/common';
import { compact } from 'lodash';

import { drillBalance } from '~app-toolkit';
import { APP_TOOLKIT, IAppToolkit } from '~app-toolkit/app-toolkit.interface';
import { buildDollarDisplayItem } from '~app-toolkit/helpers/presentation/display-item.present';
import { getTokenImg } from '~app-toolkit/helpers/presentation/image.present';
import { POOL_TOGETHER_V3_DEFINITION } from '~apps/pool-together-v3';
import { ContractType } from '~position/contract.interface';
import { ContractPositionBalance } from '~position/position-balance.interface';
import { Network } from '~types/network.interface';

import { PoolTogetherV4ContractFactory } from '../contracts';
import POOL_TOGETHER_V4_DEFINITION from '../pool-together-v4.definition';

type GetClaimableTokenBalanceParams = {
  address: string;
  network: Network;
};

type PoolTogetherV3TicketTokenDataProps = {
  apy: number;
  liquidity: number;
  faucetAddresses: string[];
};

export class PoolTogetherV4ClaimableTokenBalancesHelper {
  constructor(
    @Inject(APP_TOOLKIT) private readonly appToolkit: IAppToolkit,
    @Inject(PoolTogetherV4ContractFactory) private readonly contractFactory: PoolTogetherV4ContractFactory,
  ) {}

  async getBalances({ address, network }: GetClaimableTokenBalanceParams) {
    const multicall = this.appToolkit.getMulticall(network);
    const prices = await this.appToolkit.getBaseTokenPrices(network);

    const poolTogetherTokens = await this.appToolkit.getAppTokenPositions<PoolTogetherV3TicketTokenDataProps>({
      appId: POOL_TOGETHER_V3_DEFINITION.id,
      groupIds: [POOL_TOGETHER_V3_DEFINITION.groups.ticket.id],
      network: network,
    });

    const allFaucetAddresses = poolTogetherTokens.flatMap(token => token.dataProps.faucetAddresses);
    const claimableBalances = await Promise.all(
      allFaucetAddresses.map(async faucetAddress => {
        const faucetContract = this.contractFactory.poolTogetherV3TokenFaucet({ address: faucetAddress, network });
        const [rewardTokenAddressRaw, claimableBalanceRaw] = await Promise.all([
          multicall.wrap(faucetContract).asset(),
          multicall.wrap(faucetContract).callStatic.claim(address),
        ]);

        const rewardTokenAddress = rewardTokenAddressRaw.toLowerCase();
        const rewardBaseToken = prices.find(p => p.address === rewardTokenAddress);
        const rewardPoolTogetherAppToken = poolTogetherTokens.find(p => p.address === rewardTokenAddress);
        const rewardToken = rewardPoolTogetherAppToken ?? rewardBaseToken;
        if (!rewardToken) return null;

        const rewardTokenBalance = drillBalance(rewardToken, claimableBalanceRaw.toString());
        const tokens = [rewardTokenBalance];
        const balanceUSD = rewardTokenBalance.balanceUSD;

        // Display Props
        const label = `Claimable ${
          rewardToken.type === ContractType.BASE_TOKEN ? rewardToken.symbol : rewardToken.displayProps.label
        }`;
        const secondaryLabel = buildDollarDisplayItem(rewardToken.price);
        const images =
          rewardToken.type === ContractType.BASE_TOKEN
            ? [getTokenImg(rewardToken.address, network)]
            : rewardToken.displayProps.images;

        const positionBalance: ContractPositionBalance = {
          type: ContractType.POSITION,
          address: faucetAddress,
          appId: POOL_TOGETHER_V4_DEFINITION.id,
          groupId: POOL_TOGETHER_V4_DEFINITION.groups.claimable.id,
          network,
          tokens,
          balanceUSD,

          dataProps: {},

          displayProps: {
            label,
            secondaryLabel,
            images,
          },
        };

        return positionBalance;
      }),
    );

    return compact(claimableBalances);
  }
}
