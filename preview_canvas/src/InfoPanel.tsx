import {
  Box,
  Center,
  Checkbox,
  CircularProgress,
  Fade,
  Heading,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Tr,
} from "@chakra-ui/react";
import { default as NumberFormat } from "react-number-format";
import { useDispatch } from "react-redux";
import { selectAreaOfInterestSize, selectHexPolygons } from "./state/mapSlice";
import settingsSlice from "./state/settingsSlice";
import { useAppSelector } from "./state/store";

export default function InfoPanel() {
  const map = useAppSelector((state) => state.map);
  const settings = useAppSelector((state) => state.settings);
  const areaOfInterestSize = useAppSelector(selectAreaOfInterestSize);
  const dispatch = useDispatch();

  return (
    <Stack w={300} p={4} spacing={4}>
      <Table sx={{ tr: { height: "60px" } }} variant="simple">
        <Tbody>
          <Tr>
            <Th w={70}>Area</Th>
            <Td w="auto">
              <Fade in={!!areaOfInterestSize}>
                <Text>
                  <NumberFormat
                    value={Math.round(areaOfInterestSize ?? 0 / 1000) / 1000}
                    displayType="text"
                    thousandSeparator
                  />{" "}
                  km<sup>2</sup>
                </Text>
              </Fade>
            </Td>
          </Tr>
          <Tr>
            <Th>Total Hexes</Th>
            <Td>
              <Fade in={!!map.aoiHexes}>
                <NumberFormat value={map?.aoiHexes?.length} displayType="text" thousandSeparator />
              </Fade>
            </Td>
          </Tr>
          <Tr>
            <Th>Mappable Hexes</Th>
            <Td>
              {map.areaOfInterest &&
                (map.mappableHexes != null ? (
                  <NumberFormat
                    value={map.mappableHexes?.length}
                    displayType="text"
                    thousandSeparator
                  />
                ) : (
                  <CircularProgress isIndeterminate size="1.2em" />
                ))}
            </Td>
          </Tr>
        </Tbody>
      </Table>
      <Heading size="md" textAlign="center">
        Options
      </Heading>
      <Stack>
        <Checkbox
          isChecked={settings.viewHexes}
          onChange={(e) => dispatch(settingsSlice.actions.set({ viewHexes: e.target.checked }))}
        >
          Show hexes
        </Checkbox>
      </Stack>
    </Stack>
  );
}
