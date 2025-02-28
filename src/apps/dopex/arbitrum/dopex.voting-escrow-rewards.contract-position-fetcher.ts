import { Inject } from '@nestjs/common';

import { APP_TOOLKIT, IAppToolkit } from '~app-toolkit/app-toolkit.interface';
import { Register } from '~app-toolkit/decorators';
import { getLabelFromToken } from '~app-toolkit/helpers/presentation/image.present';
import { MetaType } from '~position/position.interface';
import { isClaimable } from '~position/position.utils';
import {
  ContractPositionTemplatePositionFetcher,
  DisplayPropsStageParams,
  GetTokenBalancesPerPositionParams,
  TokenStageParams,
} from '~position/template/contract-position.template.position-fetcher';
import { Network } from '~types/network.interface';

import { DopexContractFactory, DopexVotingEscrowRewards } from '../contracts';
import { DOPEX_DEFINITION } from '../dopex.definition';

const appId = DOPEX_DEFINITION.id;
const groupId = DOPEX_DEFINITION.groups.votingEscrowRewards.id;
const network = Network.ARBITRUM_MAINNET;

@Register.ContractPositionFetcher({ appId, groupId, network })
export class ArbitrumDopexVotingEscrowRewardsContractPositionFetcher extends ContractPositionTemplatePositionFetcher<DopexVotingEscrowRewards> {
  appId = appId;
  groupId = groupId;
  network = network;
  groupLabel = 'Voting Escrow Rewards';

  constructor(
    @Inject(APP_TOOLKIT) protected readonly appToolkit: IAppToolkit,
    @Inject(DopexContractFactory) protected readonly contractFactory: DopexContractFactory,
  ) {
    super(appToolkit);
  }

  getContract(address: string): DopexVotingEscrowRewards {
    return this.contractFactory.dopexVotingEscrowRewards({ address, network: this.network });
  }

  async getDescriptors() {
    return [{ address: '0xcbbfb7e0e6782df0d3e91f8d785a5bf9e8d9775f' }];
  }

  async getTokenDescriptors({ contract }: TokenStageParams<DopexVotingEscrowRewards>) {
    return [{ metaType: MetaType.CLAIMABLE, address: await contract.emittedToken() }];
  }

  async getLabel({ contractPosition }: DisplayPropsStageParams<DopexVotingEscrowRewards>) {
    const suppliedToken = contractPosition.tokens.find(isClaimable)!;
    return `Voting Escrow ${getLabelFromToken(suppliedToken)} Rewards`;
  }

  async getTokenBalancesPerPosition({
    address,
    contract,
  }: GetTokenBalancesPerPositionParams<DopexVotingEscrowRewards>) {
    return [await contract.earned(address)];
  }
}
