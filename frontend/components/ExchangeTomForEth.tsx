import { useState, useEffect, useContext } from 'react'
import {
  Heading,
  Box,
  InputGroup,
  Input,
  Text,
  InputRightElement,
  Flex,
  Button,
} from '@chakra-ui/react'

//import Web3Context from '../../providers/web3'

const Contribute = ({ handleExchange, handleEstimate }) => {
  //const web3 = useContext(Web3Context)

  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(0)
  const [estimate, setEstimate] = useState(0)

  useEffect(() => {
    if (amount > 0) {
      setEstimate(handleEstimate(amount))
    } else {
      setEstimate(0)
    }
  }, [amount])

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    handleExchange(amount).finally(() => {
      setLoading(false)
      setAmount(0)
    })
  }

  return (
    <Box mb={6}>
      <Heading size="md" color="green.900" mb={1}>
        Exchange for ETH
      </Heading>
      <form onSubmit={handleSubmit}>
        <Flex>
          <InputGroup maxWidth={210}>
            <Input
              type="number"
              step="any"
              background="white"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <InputRightElement
              children={
                <Text pr={4} opacity={0.5}>
                  TOM
                </Text>
              }
            />
          </InputGroup>
          <Button type="submit" ml={4} colorScheme="green" isLoading={loading}>
            Exchange
          </Button>
        </Flex>
      </form>
    </Box>
  )
}

export default Contribute
