import { useState } from 'react'
import { Heading, Box, Text, Button } from '@chakra-ui/react'

const Redeem = ({ handleRedeem, contribution }) => {
  const [loading, setLoading] = useState(false)

  const handleClick = (e) => {
    e.preventDefault()
    setLoading(true)

    handleRedeem().finally(() => {
      setLoading(false)
    })
  }

  return (
    <Box>
      <Heading size="md" color="green.900">
        Redeem
      </Heading>
      <Text mb={2} color="green.900" fontWeight={500}>
        You can redeem {(contribution * 5) / 10 ** 18} Tomato Coins.
      </Text>
      <Button
        colorScheme="red"
        size="sm"
        onClick={handleClick}
        isLoading={loading}
      >
        Redeem
      </Button>
    </Box>
  )
}

export default Redeem
