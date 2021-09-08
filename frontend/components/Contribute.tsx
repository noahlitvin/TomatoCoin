import { useState } from 'react'
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

const Contribute = ({ handleContribute }) => {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(0)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    handleContribute(amount).finally(() => {
      setLoading(false)
      setAmount(0)
    })
  }

  return (
    <Box mb={6}>
      <Heading size="md" color="green.900" mb={1}>
        Contribute
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
                  ETH
                </Text>
              }
            />
          </InputGroup>
          <Button type="submit" ml={4} colorScheme="green" isLoading={loading}>
            Contribute
          </Button>
        </Flex>
      </form>
    </Box>
  )
}

export default Contribute
