import { Box, Checkbox, Heading, Stack, Table, Tbody, Td, Text, Th, Tr } from "@chakra-ui/react";
import { default as NumberFormat } from "react-number-format";
import { useDispatch } from "react-redux";
import { selectAreaOfInterestSize, selectHexPolygons } from "./state/mapSlice";
import settingsSlice from "./state/settingsSlice";
import { useAppSelector } from "./state/store";

export default function InfoPanel() {
  const map = useAppSelector((state) => state.map);
  const settings = useAppSelector((state) => state.settings);
  const selectedHexagons = useAppSelector(selectHexPolygons);
  const areaOfInterestSize = useAppSelector(selectAreaOfInterestSize);
  const dispatch = useDispatch();

  return (
    <Box minW={300} p={4}>
      <Heading size="md" textAlign="center" pb={4}>
        View
      </Heading>
      <Stack>
        <Checkbox
          isChecked={settings.viewHexes}
          onChange={(e) => dispatch(settingsSlice.actions.set({ viewHexes: e.target.checked }))}
        >
          Hexes
        </Checkbox>
      </Stack>

      <Heading size="md" textAlign="center" pt={6}>
        Info
      </Heading>
      <Table>
        <Tbody>
          <Tr>
            <Th>Area</Th>
            <Td>
              {areaOfInterestSize && (
                <Text>
                  <NumberFormat
                    value={Math.round(areaOfInterestSize / 1000) / 1000}
                    displayType="text"
                    thousandSeparator
                  />{" "}
                  km<sup>2</sup>
                </Text>
              )}
            </Td>
          </Tr>
          <Tr>
            <Th>Total Hexes</Th>
            <Td>
              {selectedHexagons && (
                <NumberFormat
                  value={selectedHexagons.features.length}
                  displayType="text"
                  thousandSeparator
                />
              )}
            </Td>
          </Tr>
          <Tr>
            <Th>Mappable Hexes</Th>

            <Td>
              {map.mappableHexes && (
                <NumberFormat
                  value={map.mappableHexes?.length}
                  displayType="text"
                  thousandSeparator
                />
              )}
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
}
