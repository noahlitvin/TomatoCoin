import { useState, useEffect } from 'react'
import {
  Heading,
  Box,
  InputGroup,
  Input,
  Text,
  InputRightElement,
  Flex,
  Button,
  FormHelperText,
} from '@chakra-ui/react'

const Stake = ({ ethBalance, tomBalance, handleStake }) => {
  const [loading, setLoading] = useState(false)
  const [ethAmount, setEthAmount] = useState(0)
  const [tomAmount, setTomAmount] = useState(0)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    handleStake(ethAmount, tomAmount).finally(() => {
      setLoading(false)
      setEthAmount(0)
    })
  }

  useEffect(() => {
    if (!emptyPool()) {
      setTomAmount((tomBalance / ethBalance) * ethAmount)
    }
  }, [ethBalance, tomBalance, ethAmount])

  function emptyPool() {
    return tomBalance == 0 && ethBalance == 0
  }

  return (
    <Box mb={6}>
      <Heading size="md" color="green.900" mb={1}>
        Deposit
      </Heading>
      <form onSubmit={handleSubmit}>
        <Flex>
          {emptyPool() && (
            <InputGroup mr={4} maxWidth={210}>
              <Input
                type="number"
                step="any"
                background="white"
                value={tomAmount}
                onChange={(event) => setTomAmount(event.target.value)}
              />
              <InputRightElement
                children={
                  <Text pr={4} opacity={0.5}>
                    TOM
                  </Text>
                }
              />
            </InputGroup>
          )}
          <InputGroup maxWidth={210}>
            <Input
              type="number"
              step="any"
              background="white"
              value={ethAmount}
              onChange={(event) => setEthAmount(event.target.value)}
            />
            <InputRightElement
              children={
                <Text pr={4} opacity={0.5}>
                  ETH
                </Text>
              }
            />
          </InputGroup>
          <Button
            type="submit"
            minWidth={90}
            ml={4}
            colorScheme="green"
            isLoading={loading}
          >
            Deposit
          </Button>
        </Flex>
        {!emptyPool() && (
          <Text fontSize="sm" mt={1} color="green.900">
            You will also need to stake {tomAmount} TOM.
          </Text>
        )}
      </form>
    </Box>
  )
}

export default Stake
