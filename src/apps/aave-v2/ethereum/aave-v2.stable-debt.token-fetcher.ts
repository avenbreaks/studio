import { Register } from '~app-toolkit/decorators';
import { DisplayPropsStageParams } from '~position/template/app-token.template.position-fetcher';
import { Network } from '~types/network.interface';

import { AAVE_V2_DEFINITION } from '../aave-v2.definition';
import { AaveV2AToken } from '../contracts/ethers/AaveV2AToken';
import {
  AaveV2ReserveApyData,
  AaveV2ReserveTokenAddressesData,
  AaveV2LendingTemplateTokenFetcher,
  AaveV2LendingTokenDataProps,
} from '../helpers/aave-v2.lending.template.token-fetcher';

const appId = AAVE_V2_DEFINITION.id;
const groupId = AAVE_V2_DEFINITION.groups.stableDebt.id;
const network = Network.ETHEREUM_MAINNET;

@Register.TokenPositionFetcher({ appId, groupId, network })
export class EthereumAaveV2StableDebtTokenFetcher extends AaveV2LendingTemplateTokenFetcher {
  appId = AAVE_V2_DEFINITION.id;
  groupId = AAVE_V2_DEFINITION.groups.stableDebt.id;
  network = Network.ETHEREUM_MAINNET;
  groupLabel = 'Lending';
  providerAddress = '0x057835ad21a177dbdd3090bb1cae03eacf78fc6d';
  isDebt = true;

  getTokenAddress(reserveTokenAddressesData: AaveV2ReserveTokenAddressesData): string {
    return reserveTokenAddressesData.stableDebtTokenAddress;
  }

  getApy(reserveApyData: AaveV2ReserveApyData): number {
    return reserveApyData.stableBorrowApy;
  }

  async getTertiaryLabel({ appToken }: DisplayPropsStageParams<AaveV2AToken, AaveV2LendingTokenDataProps>) {
    return `${(appToken.dataProps.apy * 100).toFixed(3)}% APR (stable)`;
  }
}
