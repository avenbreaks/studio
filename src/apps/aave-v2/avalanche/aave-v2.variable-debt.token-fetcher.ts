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
const groupId = AAVE_V2_DEFINITION.groups.variableDebt.id;
const network = Network.AVALANCHE_MAINNET;

@Register.TokenPositionFetcher({ appId, groupId, network })
export class AvalancheAaveV2VariableDebtTokenFetcher extends AaveV2LendingTemplateTokenFetcher {
  appId = AAVE_V2_DEFINITION.id;
  groupId = AAVE_V2_DEFINITION.groups.variableDebt.id;
  network = Network.AVALANCHE_MAINNET;
  groupLabel = 'Lending';
  providerAddress = '0x65285e9dfab318f57051ab2b139cccf232945451';
  isDebt = true;

  getTokenAddress(reserveTokenAddressesData: AaveV2ReserveTokenAddressesData): string {
    return reserveTokenAddressesData.variableDebtTokenAddress;
  }

  getApy(reserveApyData: AaveV2ReserveApyData): number {
    return reserveApyData.variableBorrowApy;
  }

  async getTertiaryLabel({ appToken }: DisplayPropsStageParams<AaveV2AToken, AaveV2LendingTokenDataProps>) {
    return `${(appToken.dataProps.apy * 100).toFixed(3)}% APR (variable)`;
  }
}
