import { Inject } from '@nestjs/common';

import { APP_TOOLKIT, IAppToolkit } from '~app-toolkit/app-toolkit.interface';
import { Register } from '~app-toolkit/decorators';
import { getLabelFromToken } from '~app-toolkit/helpers/presentation/image.present';
import { MetaType } from '~position/position.interface';
import { isSupplied } from '~position/position.utils';
import {
  ContractPositionTemplatePositionFetcher,
  DisplayPropsStageParams,
  GetTokenBalancesPerPositionParams,
  TokenStageParams,
} from '~position/template/contract-position.template.position-fetcher';
import { Network } from '~types';

import { ConvexContractFactory } from '../contracts';
import { ConvexVotingEscrow } from '../contracts/ethers/ConvexVotingEscrow';
import { CONVEX_DEFINITION } from '../convex.definition';

const appId = CONVEX_DEFINITION.id;
const groupId = CONVEX_DEFINITION.groups.votingEscrow.id;
const network = Network.ETHEREUM_MAINNET;

@Register.ContractPositionFetcher({ appId, groupId, network })
export class EthereumConvexVotingEscrowContractPositionFetcher extends ContractPositionTemplatePositionFetcher<ConvexVotingEscrow> {
  appId = appId;
  groupId = groupId;
  network = network;
  groupLabel = 'Vote Locked CVX';

  constructor(
    @Inject(APP_TOOLKIT) protected readonly appToolkit: IAppToolkit,
    @Inject(ConvexContractFactory) protected readonly contractFactory: ConvexContractFactory,
  ) {
    super(appToolkit);
  }

  getContract(address: string): ConvexVotingEscrow {
    return this.contractFactory.convexVotingEscrow({ address, network: this.network });
  }

  async getDescriptors() {
    return [{ address: '0x72a19342e8f1838460ebfccef09f6585e32db86e' }];
  }

  async getTokenDescriptors({ contract }: TokenStageParams<ConvexVotingEscrow>) {
    const stakedTokenAddress = await contract.stakingToken();
    const rewardTokenAddress = await contract.rewardTokens(0);

    return [
      { metaType: MetaType.SUPPLIED, address: stakedTokenAddress },
      { metaType: MetaType.CLAIMABLE, address: rewardTokenAddress },
    ];
  }

  async getLabel({ contractPosition }: DisplayPropsStageParams<ConvexVotingEscrow>) {
    const suppliedToken = contractPosition.tokens.find(isSupplied)!;
    return `Voting Escrow ${getLabelFromToken(suppliedToken)}`;
  }

  async getTokenBalancesPerPosition({ address, contract }: GetTokenBalancesPerPositionParams<ConvexVotingEscrow>) {
    return Promise.all([
      contract.lockedBalances(address).then(v => v.total),
      contract.claimableRewards(address).then(v => v[0].amount),
    ]);
  }
}
