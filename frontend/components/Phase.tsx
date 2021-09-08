import { Heading, Badge, Box, Button, Text } from '@chakra-ui/react'
import { ArrowRightIcon } from '@chakra-ui/icons'

const Phase = ({ phase, advancePhase }) => {
  return (
    <Box mb={6}>
      <Heading size="md" color="green.900">
        Current Phase
      </Heading>
      <Badge
        mr="2.5"
        fontSize="0.8em"
        opacity={phase != 'seed' && 0.5}
        colorScheme={phase == 'seed' && 'green'}
        variant={phase == 'seed' && 'solid'}
      >
        Seed
      </Badge>
      <ArrowRightIcon color="green.900" mr="2.5" w={2} h={2} opacity={0.75} />
      <Badge
        mr="2.5"
        fontSize="0.8em"
        opacity={phase != 'general' && 0.5}
        colorScheme={phase == 'general' && 'green'}
        variant={phase == 'general' && 'solid'}
      >
        General
      </Badge>
      <ArrowRightIcon color="green.900" mr="2.5" w={2} h={2} opacity={0.75} />
      <Badge
        mr="2.5"
        fontSize="0.8em"
        opacity={phase != 'open' && 0.5}
        colorScheme={phase == 'open' && 'green'}
        variant={phase == 'open' && 'solid'}
      >
        Open
      </Badge>
      {phase != 'open' && (
        <Box float="right" textAlign="center">
          <Button onClick={advancePhase} size="xs" colorScheme="blue">
            Advance Phase
          </Button>
          <Text opacity={0.5} fontSize="xs">
            Admin only
          </Text>
        </Box>
      )}
    </Box>
  )
}

export default Phase
