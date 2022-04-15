import { Box, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { useAppSelector } from "./state/store";
import { default as NumberFormat } from "react-number-format";

const HEX_AREA_SQ_KM = 0.0021496;

export default function InfoPanel() {
  const { areaOfInterestSize } = useAppSelector((state) => state.map);

  return (
    <Box>
      <Table>
        <Tbody>
          <Tr>
            <Th>Area</Th>
            <Td>
              {areaOfInterestSize && (
                <Text>
                  {Math.round(areaOfInterestSize / 1000) / 1000} km<sup>2</sup>
                </Text>
              )}
            </Td>
          </Tr>
          <Tr>
            <Th>Total Hexes</Th>
            <Td>
              <NumberFormat
                value={Math.ceil((areaOfInterestSize ?? 0) / (1000 * 1000) / HEX_AREA_SQ_KM)}
                displayType="text"
                thousandSeparator
              />
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
}
