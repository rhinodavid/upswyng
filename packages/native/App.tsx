import * as Font from "expo-font";

import {
  ActivityIndicator,
  BackHandler,
  NativeEventSubscription,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import {
  NativeRouter,
  Route,
  RouteComponentProps,
  Switch,
  withRouter,
} from "react-router-native";
import React, { useEffect, useState } from "react";

import Categories from "./src/components/Categories";
import Header from "./src/components/Header";
import Home from "./src/components/Home";
import Resource from "./src/components/Resource";
import { colors } from "./src/App.styles";

// import Hotlines from "./src/components/Hotlines";
// import Resource from "./src/components/Resource";
// import Search from "./src/components/Search";

const {
  Food,
  Health,
  Hygiene,
  JobTraining,
  Resources,
  Shelters,
  SocialServices,
  Transit,
  Wifi,
} = Categories;

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "ios" ? 20 : StatusBar.currentHeight,
    flex: 1,
    backgroundColor: colors.charcoal,
    alignItems: "stretch",
    justifyContent: "center",
    paddingLeft: 8,
    paddingRight: 8,
  },
});

const AppContents = withRouter((props: RouteComponentProps) => {
  let listener: NativeEventSubscription | null;
  useEffect(() => {
    // Make the Android back button make React Router go back
    listener && listener.remove();
    listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (props.location.pathname === "/") {
        return false;
      }
      props.history.goBack();
      return true;
    });
    return () => {
      listener && listener.remove();
    };
  }, [props.location.pathname]);

  // Font loading
  const [isReady, setReady] = useState(false);
  useEffect(() => {
    Font.loadAsync({
      "open-sans": require("./assets/fonts/OpenSans-Regular.ttf"),
      "open-sans-bold": require("./assets/fonts/OpenSans-Bold.ttf"),
    }).then(() => setReady(true));
  });

  return isReady ? (
    <View style={styles.container}>
      <Header />
      <Route exact path="/" component={Home} />
      <Switch>
        <Route path="/shelters" component={Shelters} />
        <Route path="/job-training" component={JobTraining} />
        <Route path="/health" component={Health} />
        <Route path="/hygiene" component={Hygiene} />
        {/* <Route  path="/hotlines" component={Hotlines} /> */}
        <Route path="/food" component={Food} />
        <Route path="/transit" component={Transit} />
        <Route path="/resource/:id" component={Resource} />
        <Route path="/resources" component={Resources} />
        <Route path="/social-services" component={SocialServices} />
        {/* <Route  path="/search" component={Search} /> */}
        <Route path="/wifi" component={Wifi} />
      </Switch>
    </View>
  ) : (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.orangePrimary} />
    </View>
  );
});

export default function App() {
  return (
    <NativeRouter>
      <AppContents />
    </NativeRouter>
  );
}
