import { useState } from 'react'
import { Heading, Box, Text, Button } from '@chakra-ui/react'

const Withdraw = ({ handleWithdraw }) => {
  const [loading, setLoading] = useState(false)

  const handleClick = (e) => {
    e.preventDefault()
    setLoading(true)

    handleWithdraw().finally(() => {
      setLoading(false)
    })
  }

  return (
    <Box>
      <Heading size="md" color="green.900">
        Withdraw
      </Heading>
      <Text mb={2} color="green.900" fontWeight={500}>
        Withdraw your proportional share of the pool in exchange for your
        liquidity tokens.
      </Text>
      <Button
        colorScheme="red"
        size="sm"
        onClick={handleClick}
        isLoading={loading}
      >
        Withdraw
      </Button>
    </Box>
  )
}

export default Withdraw
