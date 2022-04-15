import React from "react";
import logo from "./logo.svg";
import "./App.css";
import MapView from "./MapView";
import { Box, ChakraProvider, Stack } from "@chakra-ui/react";
import { Provider } from "react-redux";
import store from "./state/store";
import InfoPanel from "./InfoPanel";

function App() {
  return (
    <Provider store={store}>
      <ChakraProvider>
        <Stack direction="row" h="100vh">
          <Box flex="1">
            <MapView />
          </Box>
          <InfoPanel />
        </Stack>
      </ChakraProvider>
    </Provider>
  );
}

export default App;
