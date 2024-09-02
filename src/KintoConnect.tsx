import { useEffect, useState } from 'react';
import { createKintoSDK, KintoAccountInfo } from 'kinto-web-sdk';
import {
  encodeFunctionData, Address, getContract,
  defineChain, createPublicClient, http
} from 'viem';
import styled from 'styled-components';
import AppHeader from 'components/shared/AppHeader';
import AppFooter from 'components/shared/AppFooter';
import {
  BaseScreen, BaseHeader, LearnLink, KintoAddress,
  GlobalLoader, PrimaryButton
} from 'components/shared';
import { getERC20Balances, formatTokenBalance, TokenBalance } from './BlockscoutUtils';
import { BREAKPOINTS } from 'config';
import { ReactComponent as CreditImage } from './credit.svg';
import numeral from 'numeral';
import contractsJSON from '../public/abis/7887.json';
import {KYCViewerService} from './KYCViewerService';
import './App.css';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';

// import AttestationApp from './SignProtocol';

interface KYCViewerInfo {
  isIndividual: boolean;
  isCorporate: boolean;
  isKYC: boolean;
  isSanctionsSafe: boolean;
  getCountry: string;
  getWalletOwners: Address[];
}

export const counterAbi = [{ "type": "constructor", "inputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "count", "inputs": [], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "increment", "inputs": [], "outputs": [], "stateMutability": "nonpayable" }];

const kinto = defineChain({
  id: 7887,
  name: 'Kinto',
  network: 'kinto',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.kinto-rpc.com/'],
      webSocket: ['wss://rpc.kinto.xyz/ws'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://kintoscan.io' },
  },
});

const KintoConnect = () => {
  const [accountInfo, setAccountInfo] = useState<KintoAccountInfo | undefined>(undefined);
  const [kycViewerInfo, setKYCViewerInfo] = useState<any | undefined>(undefined);
  const [counter, setCounter] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [destinationKYCInfo, setDestinationKYCInfo] = useState<KYCViewerInfo | null>(null);
  
  
  const kintoSDK = createKintoSDK('0xCFE10657E75385F0c93Ee7e0Aec266Ae9382E0ED');
  const counterAddress = "0xCFE10657E75385F0c93Ee7e0Aec266Ae9382E0ED" as Address;
  const paymentAddress = "0xCfe808D7994bB4b3741008B4c301688D4Cd4958C" as Address;


  async function kintoLogin() {
    try {
      await kintoSDK.createNewWallet();
    } catch (error) {
      console.error('Failed to login/signup:', error);
    }
  }

  const fundTransferAbi = [
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "transferFunds",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ];
  

  async function transferFunds(recipient: string, amount: bigint) {
    const data = encodeFunctionData({
      abi: fundTransferAbi,
      functionName: 'transferFunds',
      args: [recipient, amount]
    });
    
    setLoading(true);
    try {
      const response = await kintoSDK.sendTransaction([{ to: paymentAddress, data, value: amount }]);
      console.log('Transfer successful:', response);
    } catch (error) {
      console.error('Failed to transfer funds:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleTransferFunds = async () => {
    const recipientAddress = "0x79edB24F41Ec139dde29B6e604ed52954d643858" as Address;
    const verySmallAmount = BigInt(10000000000000); // 0.00001 ETH en wei

    try {
      await transferFunds(recipientAddress, verySmallAmount);
      console.log('Funds transferred successfully');
    } catch (error) {
      console.error('Failed to transfer funds:', error);
    }
  };

  // const sendMoney = async () => {
    
  // };
  

  async function fetchCounter() {
    const client = createPublicClient({
      chain: kinto,
      transport: http(),
    });
    const counter = getContract({
      address: counterAddress as Address,
      abi: counterAbi,
      client: { public: client }
    });
    const count = await counter.read.count([]) as BigInt;
    setCounter(parseInt(count.toString()));
  }

  async function increaseCounter() {
    const data = encodeFunctionData({
      abi: counterAbi,
      functionName: 'increment',
      args: []
    });
    setLoading(true);
    try {
      const response = await kintoSDK.sendTransaction([{ to: counterAddress, data, value: BigInt(0) }]);
      await fetchCounter();
    } catch (error) {
      console.error('Failed to login/signup:', error);
    } finally {
      setLoading(false);
    }
  }

  // var adressSend = "0x..." as Address;

  // const targetAddress = '0x...'; 
  // const amountToSend = BigInt(1e15); 

  // async function fetchKintoWalletFactory () {
  //   if (!accountInfo?.walletAddress) return;

  //   const client = createPublicClient({
  //     chain: kinto,
  //     transport: http(),
  //   });
  //   const walletFactory = getContract({
  //     address: contractsJSON.contracts.KintoWalletFactory.address as Address,
  //     abi: contractsJSON.contracts.KintoWalletFactory.abi,
  //     client: { public: client }
  //   });
  //   console.log ('the Kynto wallet factory is ', walletFactory)
  //   console.log ('Sending money ')
  //   await walletFactory.sendMoneyToAccount(targetAddress, {
  //     value: amountToSend,
  //   });
  // }

  const KYCInfoDisplay: React.FC<{ kycInfo: KYCViewerInfo; title: string }> = ({ kycInfo, title }) => (
    <KYCInfo>
      <KYCInfoHeader>{title}</KYCInfoHeader>
      <KYCInfoRow>
        <KYCInfoLabel>Is Individual:</KYCInfoLabel>
        <KYCInfoValue>{kycInfo.isIndividual ? 'Yes' : 'No'}</KYCInfoValue>
      </KYCInfoRow>
      <KYCInfoRow>
        <KYCInfoLabel>Is Corporate:</KYCInfoLabel>
        <KYCInfoValue>{kycInfo.isCorporate ? 'Yes' : 'No'}</KYCInfoValue>
      </KYCInfoRow>
      <KYCInfoRow>
        <KYCInfoLabel>Is KYC:</KYCInfoLabel>
        <KYCInfoValue>{kycInfo.isKYC ? 'Yes' : 'No'}</KYCInfoValue>
      </KYCInfoRow>
      <KYCInfoRow>
        <KYCInfoLabel>Is Sanctions Safe:</KYCInfoLabel>
        <KYCInfoValue>{kycInfo.isSanctionsSafe ? 'Yes' : 'No'}</KYCInfoValue>
      </KYCInfoRow>
    </KYCInfo>
  );
  

  async function fetchKYCViewerInfo() {
    if (!accountInfo?.walletAddress) return;

    const client = createPublicClient({
      chain: kinto,
      transport: http(),
    });
    const kycViewer = getContract({
      address: contractsJSON.contracts.KYCViewer.address as Address,
      abi: contractsJSON.contracts.KYCViewer.abi,
      client: { public: client }
    });

    try {
      const [isIndividual, isCorporate, isKYC, isSanctionsSafe, getCountry, getWalletOwners] = await Promise.all([
        kycViewer.read.isIndividual([accountInfo.walletAddress]),
        kycViewer.read.isCompany([accountInfo.walletAddress]),
        kycViewer.read.isKYC([accountInfo.walletAddress]),
        kycViewer.read.isSanctionsSafe([accountInfo.walletAddress]),
        kycViewer.read.getCountry([accountInfo.walletAddress]),
        kycViewer.read.getWalletOwners([accountInfo.walletAddress])
      ]);

      setKYCViewerInfo({
        isIndividual,
        isCorporate,
        isKYC,
        isSanctionsSafe,
        getCountry,
        getWalletOwners
      } as KYCViewerInfo);
    } catch (error) {
      console.error('Failed to fetch KYC viewer info:', error);
    }

    console.log('KYCViewerInfo:', kycViewerInfo);
  }

  async function fetchAccountInfo() {
    try {
      setAccountInfo(await kintoSDK.connect());
    } catch (error) {
      console.error('Failed to fetch account info:', error);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
    fetchCounter();
  });

  useEffect(() => {
    if (accountInfo?.walletAddress) {
      fetchKYCViewerInfo();
    }
  }, [accountInfo]);

  async function fetchTokenBalances() {
    if (accountInfo?.walletAddress) {
      const balances = await getERC20Balances(accountInfo.walletAddress);
      console.log('Token balances:', balances);

      //array of all erc20 addresses:
      const erc20Addresses = balances.map(token => token.contractAddress);
      console.log('ERC20 Addresses:', erc20Addresses);

      //TODO: better to fetch balances from the contract
      setTokenBalances(balances);
    }
  }

  const handleTransfer = async () => {
    console.log('Attempting transfer');
    if (!selectedToken || !recipientAddress || !transferAmount || !accountInfo?.walletAddress) {
      console.log('Transfer cancelled: missing information');
      return;
    }

    try {
      const amount = BigInt(parseFloat(transferAmount) * Math.pow(10, parseInt(selectedToken.decimals)));
      const data = encodeFunctionData({
        abi: [{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
        functionName: 'transfer',
        args: [recipientAddress as Address, amount]
      });

      console.log('Sending transaction');
      const response = await kintoSDK.sendTransaction([{ 
        to: selectedToken.contractAddress as Address, 
        data, 
        value: BigInt(0) 
      }]);

      console.log('Transfer response:', response);
      // Refresh token balances after transfer
      await fetchTokenBalances();
      
      // Clear input fields after successful transfer
      setTransferAmount('');
      setRecipientAddress('');
      setSelectedToken(null);
    } catch (error) {
      console.error('Failed to transfer token:', error);
    }
  };

  const fetchDestinationKYC = async () => {
    if (!recipientAddress) return;

    const kycViewer = KYCViewerService.getInstance();
    const info = await kycViewer.fetchKYCInfo(recipientAddress as Address);
    setDestinationKYCInfo(info);
  };

  useEffect(() => {
    fetchAccountInfo();
  });

  useEffect(() => {
    if (accountInfo?.walletAddress) {
      fetchKYCViewerInfo();
      fetchTokenBalances();
    }
  }, [accountInfo]);

  useEffect(() => {
    if (recipientAddress && recipientAddress.length === 42) {
      fetchDestinationKYC();
    } else {
      setDestinationKYCInfo(null);
    }
  }, [recipientAddress]);

  // todo: add info about the dev portal and link
  return (
    <WholeWrapper>
      <AppWrapper>
        <ContentWrapper>
          <AppHeader />
          <BaseScreen>
            {accountInfo && (
              <BgWrapper>
                <CounterWrapper>
                  <BaseHeader
                    title="Kinto Wallet SDK Sample App" />
                  {accountInfo.walletAddress && (
                    <PrimaryButton onClick={kintoLogin}>
                      Login/Signup
                    </PrimaryButton>
                  )}
                  <WalletRows>
                    <WalletRow key="chain">
                      <WalletRowName>Chain</WalletRowName>
                      <WalletRowValue>
                        <StyledCreditImage />
                        <KintoLabel>Kinto (ID: 7887)</KintoLabel>
                      </WalletRowValue>
                    </WalletRow>
                    {/* <WalletRow key="app">
                      <WalletRowName>App</WalletRowName>
                      <WalletRowValue>
                        <StyledMainAddress chainId={7887} address={counterAddress} showExplorer showClipboard />
                      </WalletRowValue>
                    </WalletRow>
                    <WalletRow key="address">
                      <WalletRowName>Wallet</WalletRowName>
                      <WalletRowValue>
                        <StyledMainAddress chainId={7887} address={accountInfo.walletAddress as Address} showExplorer showClipboard />
                      </WalletRowValue>
                    </WalletRow>
                    <WalletRow key="Application Key">
                      <WalletRowName>App Key</WalletRowName>
                      <WalletRowValue>
                        <StyledMainAddress chainId={7887} address={accountInfo.appKey as Address} showExplorer showClipboard />
                      </WalletRowValue>
                    </WalletRow> */}
                    {kycViewerInfo && (
                      <>

                        <WalletRow key="isIndividual">
                          <WalletRowName>Is Individual</WalletRowName>
                          <WalletRowValue>
                            <ETHValue>{kycViewerInfo.isIndividual ? 'Yes' : 'No'}</ETHValue>
                          </WalletRowValue>
                        </WalletRow>
                        <WalletRow key="isCorporate">
                          <WalletRowName>Is Corporate</WalletRowName>
                          <WalletRowValue>
                            <ETHValue>{kycViewerInfo.isCorporate ? 'Yes' : 'No'}</ETHValue>
                          </WalletRowValue>
                        </WalletRow>
                        <WalletRow key="isKYC">
                          <WalletRowName>Is KYC</WalletRowName>
                          <WalletRowValue>
                            <ETHValue>{kycViewerInfo.isKYC ? 'Yes' : 'No'}</ETHValue>
                          </WalletRowValue>
                        </WalletRow>
                        <WalletRow key="isSanctionsSafe">
                          <WalletRowName>Is Sanctions Safe</WalletRowName>
                          <WalletRowValue>
                            <ETHValue>{kycViewerInfo.isSanctionsSafe ? 'Yes' : 'No'}</ETHValue>
                          </WalletRowValue>
                        </WalletRow>
                        <WalletRow key="country">
                          <WalletRowName>Country</WalletRowName>
                          <WalletRowValue>
                            <ETHValue>{kycViewerInfo.getCountry}</ETHValue>
                          </WalletRowValue>
                        </WalletRow>
                      </>
                    )}
                    <WalletRow key="counter">
                      <WalletRowName>Counter</WalletRowName>
                      <WalletRowValue>
                        <ETHValue>{counter}</ETHValue>
                      </WalletRowValue>
                    </WalletRow>
                  </WalletRows>
                  <WalletNotice>
                    <span>Attention!</span> Only send funds to your wallet address in the Kinto Network
                  </WalletNotice>
                  {accountInfo && (
                    <PrimaryButton onClick={increaseCounter}>
                      Increase Counter
                    </PrimaryButton>
                  )}
                  {/* {accountInfo && (
                    <PrimaryButton onClick={handleTransferFunds} disabled={loading}>
                      {loading ? 'Transferring...' : 'Transfer Funds'}
                  </PrimaryButton>
                  )} */}
                  <LearnLink link={"https://docs.kinto.xyz"} text="Learn more about the Kinto Wallet SDK" />
                </CounterWrapper>
              </BgWrapper>
            )}
            {!accountInfo && (
              <GlobalLoader />
            )}
             {accountInfo ? (
              <ThreeColumnLayout>
                <Column>
                  <ColumnContent>
                    <ColumnHeader>Your Wallet</ColumnHeader>
                    <WalletInfo>
                      <WalletInfoRow>
                        <WalletInfoLabel>Address:</WalletInfoLabel>
                        <StyledCompressedAddress address={accountInfo.walletAddress as Address} />
                      </WalletInfoRow>
                      <WalletInfoRow>
                        <WalletInfoLabel>App Key:</WalletInfoLabel>
                        <StyledCompressedAddress address={accountInfo.appKey as Address} />
                      </WalletInfoRow>
                    </WalletInfo>
                  </ColumnContent>
                  <KYCInfoWrapper>
                    {kycViewerInfo && (
                      <KYCInfoDisplay kycInfo={kycViewerInfo} title="Your KYC Information" />
                    )}
                  </KYCInfoWrapper>
                </Column>

                <ArrowColumn>
                  <ArrowIcon>➡️</ArrowIcon>
                </ArrowColumn>

                <Column>
                  <ColumnContent>
                    <ColumnHeader>Destination</ColumnHeader>
                    <DestinationSection>
                      <TextField
                        fullWidth
                        label="Recipient Address"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                      />
                    </DestinationSection>
                  </ColumnContent>
                  <KYCInfoWrapper>
                    {destinationKYCInfo && (
                      <KYCInfoDisplay kycInfo={destinationKYCInfo} title="Destination KYC Information" />
                    )}
                  </KYCInfoWrapper>
                </Column>

                <ArrowColumn>
                  <ArrowIcon>➡️</ArrowIcon>
                </ArrowColumn>

                <Column>
                  <ColumnHeader>Transfer</ColumnHeader>
                  <TransferSection>
                    <FormControl fullWidth>
                      <InputLabel id="token-select-label">Select Token</InputLabel>
                      <Select
                        labelId="token-select-label"
                        id="token-select"
                        value={selectedToken ? selectedToken.symbol : ''}
                        label="Select Token"
                        onChange={(e) => {
                          const token = tokenBalances.find(t => t.symbol === e.target.value);
                          setSelectedToken(token || null);
                        }}
                      >
                        {tokenBalances.map((token, index) => (
                          <MenuItem key={`erc20-${index}`} value={token.symbol}>
                            {token.symbol} - Balance: {formatTokenBalance(token.balance, token.decimals)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Amount to Transfer"
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                    />
                    <PrimaryButton onClick={handleTransfer} disabled={!selectedToken || !transferAmount || !recipientAddress}>
                      Transfer
                    </PrimaryButton>
                  </TransferSection>
                </Column>
              </ThreeColumnLayout>
            ) : (
              <ConnectButton onClick={kintoLogin}>Connect Wallet</ConnectButton>
            )}

            {/* <AttestationApp></AttestationApp> */}
          </BaseScreen>
          <AppFooter />
        </ContentWrapper>
      </AppWrapper>
    </WholeWrapper>
  );
}

const WholeWrapper = styled.div`
  flex-flow: column nowrap;
  height: auto;
  align-items: center;
  width: 100%;
  display: flex;
  min-height: 100vh;
  min-width: 100vw;
  position: relative;
`;

const AppWrapper = styled.div`
  flex-flow: column nowrap;
  height: auto;
  align-items: center;
  width: 100%;
  display: flex;
  min-height: 85vh;
  min-width: 100vw;

  @media only screen and (max-width: 400px) {
    min-height: 90vh;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  height: auto;
  min-height: 100vh;
  width: 100%;
  background: url(engen/commitment.svg) no-repeat;
  background-position-x: right;
  background-size: auto;
  overflow: hidden;
`;

const BgWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-flow: column nowrap;
  justify-content: center;
`;

const CounterWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  gap: 32px;
  padding: 16px 0;
`;

const WalletRows = styled.div`
  display: flex;
  padding-top: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;
  max-width: 800px;
  border-top: 1px solid var(--light-grey3);
`;

const WalletRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  padding-bottom: 16px;
  align-items: center;
  gap: 32px;
  align-self: stretch;
  border-bottom: 1px solid var(--light-grey3);
  width: 100%;
  overflow: hidden;
`;

const WalletRowName = styled.div`
  width: 150px;
  color: var(--night);
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;

  @media only screen and (max-width: ${BREAKPOINTS.mobile}) {
    width: 60px;
    font-size: 14px;
  }
`;

const WalletRowValue = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  flex: 1 0 0;
  align-self: stretch;
  font-size: 24px;
  font-weight: 700;
  line-height: 120%;

  @media only screen and (max-width: ${BREAKPOINTS.mobile}) {
    font-size: 20px;
  }
`;

const StyledCreditImage = styled(CreditImage)`
  height: 28px;
  width: 28px;
`;

const KintoLabel = styled.div`
  color: var(--night);
  font-size: 24px;
  font-weight: 400;
  line-height: 120%; /* 28.8px */
  @media only screen and (max-width: ${BREAKPOINTS.mobile}) {
    font-size: 20px;
  }
`;

const StyledMainAddress = styled(KintoAddress)`
  > div {
    font-size: 24px;
    font-weight: 700;
  }
  gap: 16px;
  svg {
    width: 32px;
    height: 32px;
  }
  div {
    border: none;
    padding: 0;
    justify-content: flex-start;

    div div {
      width: calc(100% - 84px);
    }
  }

  svg {
    width: 32px;
    height: 32px;
  }
`;

const WalletNotice = styled.div`
  color: var(--dark-grey);
  font-size: 18px;
  font-weight: 400;
  width: 95%;

  span {
    color: var(--orange);
    font-weight: 700;
  }
`;


const ThreeColumnLayout = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
`;

const Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ColumnContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
`;

const ColumnHeader = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const WalletInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const WalletInfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const WalletInfoLabel = styled.span`
  font-weight: bold;
`;

const TransferSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DestinationSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const KYCInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const KYCInfoHeader = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const KYCInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const KYCInfoLabel = styled.span`
  font-weight: bold;
  flex: 1;
`;

const KYCInfoValue = styled.span`
  flex: 1;
  text-align: right;

  & > span {
    margin-right: 5px;
  }
`;

const ConnectButton = styled(PrimaryButton)`
  align-self: center;
`;

interface CompressedAddressProps {
  address: Address;
  className?: string;
}

const CompressedAddress: React.FC<CompressedAddressProps> = ({ address, className }) => (
  <div className={className}>
    {address.slice(0, 10)}...{address.slice(-10)}
  </div>
);

const StyledCompressedAddress = styled(CompressedAddress)`
  font-family: monospace;
  font-size: 14px;
`;

const ArrowColumn = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ArrowIcon = styled.span`
  font-size: 24px;
  color: var(--primary-color);
`;

const KYCInfoWrapper = styled.div`
  margin-top: auto;
`;

const ETHValue = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 400;
  line-height: 120%;
  color: var(--night);

  @media only screen and (max-width: ${BREAKPOINTS.mobile}) {
    font-size: 24px;
  }

`;

export default KintoConnect;