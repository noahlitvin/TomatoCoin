import { useState, useEffect } from 'react'
import type { NextPage } from 'next'
import theme from '../styles/theme'
import Head from 'next/head'
import Image from 'next/image'
import {
  createStandaloneToast,
  Container,
  Box,
  Flex,
  Heading,
  Text,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
} from '@chakra-ui/react'
import Phase from '../components/Phase'
import Contribute from '../components/Contribute'
import Redeem from '../components/Redeem'
import Stake from '../components/Stake'
import Withdraw from '../components/Withdraw'
import ExchangeTomForEth from '../components/ExchangeTomForEth'
import ExchangeEthForTom from '../components/ExchangeEthForTom'

import { ethers, BigNumber } from 'ethers'
import TomatoICOJSON from '../../artifacts/contracts/TomatoICO.sol/TomatoICO.json'
import TomatoCoinJSON from '../../artifacts/contracts/TomatoCoin.sol/TomatoCoin.json'
import TomatoLPTJSON from '../../artifacts/contracts/TomatoLPT.sol/TomatoLPT.json'
import TomatoPoolJSON from '../../artifacts/contracts/TomatoPool.sol/TomatoPool.json'

const Home: NextPage = () => {
  const toast = createStandaloneToast({ theme })

  const provider = new ethers.providers.JsonRpcProvider()
  /*
  const provider = process.browser
    ? new ethers.providers.Web3Provider(window.ethereum)
    : new ethers.providers.JsonRpcProvider() //.Web3Provider(window.ethereum) // .getDefaultProvider('rinkeby')
    */
  const signer = provider.getSigner()

  provider.on('network', (newNetwork, oldNetwork) => {
    // When a Provider makes its initial connection, it emits a "network"
    // event with a null oldNetwork along with the newNetwork. So, if the
    // oldNetwork exists, it represents a changing network
    if (oldNetwork) {
      window.location.reload()
    }
  })

  const coinAddress = process.env.NEXT_PUBLIC_COIN_ADDRESS
  const lptAddress = process.env.NEXT_PUBLIC_LPT_ADDRESS
  const poolAddress = process.env.NEXT_PUBLIC_POOL_ADDRESS
  const icoAddress = process.env.NEXT_PUBLIC_ICO_ADDRESS

  const icoContract = new ethers.Contract(
    icoAddress,
    TomatoICOJSON.abi,
    provider,
  )
  const poolContract = new ethers.Contract(
    poolAddress,
    TomatoPoolJSON.abi,
    provider,
  )
  const lptContract = new ethers.Contract(
    lptAddress,
    TomatoLPTJSON.abi,
    provider,
  )
  const coinContract = new ethers.Contract(
    coinAddress,
    TomatoCoinJSON.abi,
    provider,
  )

  const submitToastEvent = () => {
    toast({
      title: 'Transaction Submitted',
      description:
        'A notice will appear here after the transaction has been successfully processed. Refer to your wallet for the latest status.',
      status: 'info',
      position: 'top',
      duration: 10000,
      isClosable: true,
    })
  }

  const getErrorMessage = (error) => {
    let message = 'An error has occurred.'
    if (error?.error?.message) {
      // For Alchemy with ethers.providers.Web3Provider(window.ethereum) with alchemy
      message = error.error.message.split(': ')[1]
    } else if (error?.data?.message) {
      // For ethers.providers.JsonRpcProvider()
      message = error.data.message.match(/\'(.*)\'/).pop()
    } else if (JSON.parse(error.body)?.error?.message) {
      // For ethers.providers.Web3Provider(window.ethereum)
      message = JSON.parse(error.body)
        .error.message.match(/\'(.*)\'/)
        .pop()
    }
    return message
  }

  const errorToastEvent = (error) => {
    toast({
      title: 'Error',
      description: getErrorMessage(error),
      status: 'error',
      position: 'top',
      isClosable: true,
    })
  }

  const [phase, setPhase] = useState('')
  const [contribution, setContribution] = useState(0)
  const [ethBalance, setEthBalance] = useState(0)
  const [tomBalance, setTomBalance] = useState(0)

  const getContributionAmount = async () => {
    const resp = await icoContract.balances(signer.getAddress())
    var x = resp.toString()

    setContribution(x)
  }

  const getBalances = async () => {
    const resp1 = await poolContract.ethBalance()
    setEthBalance(resp1.toString())

    const resp2 = await poolContract.tomBalance()
    setTomBalance(resp2.toString())
  }

  const handleExchangeTomForEth = async () => {
    await coinContract
      .connect(signer)
      .approve(poolAddress, tomAmount)
      .then(submitToastEvent)
      .catch(errorToastEvent)
    await poolContract
      .exchangeForEth()
      .then(submitToastEvent)
      .catch(errorToastEvent)
  }

  const handleEstimateTomForEth = async (ethAmount) => {
    return await poolContract.estimateTom(ethAmount).catch(() => {})
  }

  const handleExchangeEthForTom = async (amount) => {
    await poolContract
      .exchangeForTom({
        value: ethers.utils.parseEther(amount.toString()),
      })
      .then(submitToastEvent)
      .catch(errorToastEvent)
  }

  const handleEstimateEthForTom = async (tomAmount) => {
    return await poolContract.estimateEth(tomAmount).catch(() => {})
  }

  const handleContribute = async (amount) => {
    try {
      await signer.getAddress()
    } catch {
      await provider.send('eth_requestAccounts', [])
    }

    await icoContract
      .connect(signer)
      .contribute({ value: ethers.utils.parseEther(amount.toString()) })
      .then(submitToastEvent)
      .catch(errorToastEvent)
  }

  const handleRedeem = async () => {
    await icoContract
      .connect(signer)
      .redeem()
      .then(submitToastEvent)
      .catch(errorToastEvent)
  }

  const handleStake = async (ethAmount, tomAmount) => {
    try {
      await signer.getAddress()
    } catch {
      await provider.send('eth_requestAccounts', [])
    }

    await coinContract
      .connect(signer)
      .approve(poolAddress, tomAmount)
      .then(submitToastEvent)
      .catch(errorToastEvent)

    await poolContract
      .connect(signer)
      .stake({
        value: ethers.utils.parseEther(ethAmount.toString()),
      })
      .then(submitToastEvent)
      .catch(errorToastEvent)
  }

  const handleWithdraw = async () => {
    try {
      await signer.getAddress()
    } catch {
      await provider.send('eth_requestAccounts', [])
    }

    await poolContract
      .connect(signer)
      .withdraw()
      .then(submitToastEvent)
      .catch(errorToastEvent)
  }

  const advancePhase = async () => {
    try {
      await signer.getAddress()
    } catch {
      await provider.send('eth_requestAccounts', [])
    }

    icoContract.connect(signer).advancePhase()
    icoContract.getCurrentPhase().then((resp) => {
      setPhase(resp)
    })
  }

  useEffect(() => {
    icoContract.getCurrentPhase().then((resp) => {
      setPhase(resp)
    })
    getContributionAmount()
    getBalances()

    icoContract.on('Contribution', async (sender, amount) => {
      const signerAddress = await signer.getAddress()
      if (signerAddress == sender) {
        toast({
          title: 'Contribution Successful',
          description: `You have contributed ${amount / 10 ** 18} ETH.`,
          status: 'success',
          position: 'top',
          duration: 10000,
          isClosable: true,
        })
      }
      await getContributionAmount()
    })

    icoContract.on('Redemption', async (sender, amount) => {
      const signerAddress = await signer.getAddress()
      if (signerAddress == sender) {
        toast({
          title: 'Redemption Successful',
          description: `You have redeemed ${amount / 10 ** 18} TOM.`,
          status: 'success',
          position: 'top',
          duration: 10000,
          isClosable: true,
        })
      }
      await getContributionAmount()
    })
  }, [])

  return (
    <div>
      <Head>
        <title>Tomato Coin</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Bubblegum+Sans&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Flex
        align="center"
        height="100vh"
        backgroundImage="background.jpg"
        backgroundSize="180px 180px"
      >
        <Container maxW="container.lg">
          <Flex align="center" justify="center">
            <Box mr={14} mt={20}>
              <Box className="bounce">
                <Image
                  src="/mascot.png"
                  alt="Tomato Coin"
                  width={310}
                  height={330}
                />
              </Box>
              <Flex opacity={0.5} justify="center">
                <Box className="zoom">
                  <Image src="/shadow.svg" width={145} height={24} />
                </Box>
              </Flex>
            </Box>
            <Box
              p={8}
              width="100%"
              maxWidth={417}
              background="rgba(255,255,255,0.4)"
              borderRadius={16}
            >
              <Heading as="h1" size="3xl" mb={2} color="green.900">
                Tomato Coin
              </Heading>

              <Tabs variant="soft-rounded" colorScheme="green">
                {phase == 'open' && (
                  <TabList pb={2}>
                    <Tab>ICO</Tab>
                    <Tab>Pool</Tab>
                    <Tab>Swap</Tab>
                  </TabList>
                )}
                <TabPanels>
                  <TabPanel p={0}>
                    <Text
                      fontWeight={500}
                      fontSize="lg"
                      maxWidth="sm"
                      mb={6}
                      color="green.900"
                    >
                      Participate in the ICO by contributing ETH. You’ll be able
                      to redeem <em>five times</em> that in Tomato Coins during
                      the Open Phase!
                    </Text>
                    <Phase phase={phase} advancePhase={advancePhase} />
                    <Contribute handleContribute={handleContribute} />
                    {phase == 'open' && (
                      <Redeem
                        handleRedeem={handleRedeem}
                        contribution={contribution}
                      />
                    )}
                  </TabPanel>
                  <TabPanel p={0}>
                    <Text
                      fontWeight={500}
                      fontSize="lg"
                      maxWidth="sm"
                      mb={6}
                      color="green.900"
                    >
                      Stake TOM and ETH to receive liquidity tokens. Return your
                      liquidity tokens to retrieve your TOM and ETH, plus any
                      yield you’ve earned from exchange fees.
                    </Text>
                    <Stake
                      ethBalance={ethBalance}
                      tomBalance={tomBalance}
                      handleStake={handleStake}
                    />
                    <Withdraw handleWithdraw={handleWithdraw} />
                  </TabPanel>
                  <TabPanel p={0}>
                    <Text
                      fontWeight={500}
                      fontSize="lg"
                      maxWidth="sm"
                      mb={6}
                      color="green.900"
                    >
                      Exchange TOM and ETH using the liquidity pool. A 1% fee is
                      applied. Slippage will be less than 10%.
                    </Text>

                    <ExchangeTomForEth
                      handleEstimate={handleEstimateTomForEth}
                      handleExchange={handleExchangeTomForEth}
                    />
                    <ExchangeEthForTom
                      handleEstimate={handleEstimateEthForTom}
                      handleExchange={handleExchangeEthForTom}
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </Flex>
        </Container>
      </Flex>
    </div>
  )
}

export default Home
