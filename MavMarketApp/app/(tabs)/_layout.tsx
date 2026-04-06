import React, { useState, useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { Tabs } from "expo-router";
import { House, Compass, MessageCircle, User, Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreateListingModal } from "../../components/CreateListingModal";
import { useTheme } from "../../lib/ThemeContext";

// Custom tab bar with a raised center "+" button
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const { theme } = useTheme();
  const c = theme.colors;

  // Scale animation refs for each tab (indexed by position 0-4)
  const scales = useRef(
    [0, 1, 2, 3, 4].map(() => new Animated.Value(1))
  ).current;

  const pressTab = (index: number, routeName: string, isFocused: boolean) => {
    if (routeName === "create") {
      // Animate the center button with a spring pop
      Animated.sequence([
        Animated.spring(scales[index], { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 12 }),
        Animated.spring(scales[index], { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
      ]).start();
      setShowCreate(true);
      return;
    }

    Animated.sequence([
      Animated.spring(scales[index], { toValue: 0.82, useNativeDriver: true, speed: 50, bounciness: 6 }),
      Animated.spring(scales[index], { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();

    const event = navigation.emit({ type: "tabPress", target: state.routes[index].key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate({ name: routeName, merge: true });
    }
  };

  const TAB_HEIGHT = 56;
  const CENTER_SIZE = 56;
  const CENTER_LIFT = 14;

  return (
    <>
      {/* Tab bar container — raised enough to show the center button */}
      <View
        style={[
          styles.tabBarOuter,
          {
            paddingBottom: insets.bottom,
            height: TAB_HEIGHT + insets.bottom,
            backgroundColor: c.tabBar,
            borderTopColor: c.tabBarBorder,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = route.name === "create";

          if (isCenter) {
            // Center "+" button — rendered inline so the layout still stretches evenly
            return (
              <View key={route.key} style={styles.tabSlot}>
                {/* Invisible placeholder so the button sits above the bar */}
                <View style={{ width: CENTER_SIZE, height: CENTER_SIZE }} />
              </View>
            );
          }

          const iconColor = isFocused ? c.accentLight : c.textTertiary;

          return (
            <Animated.View
              key={route.key}
              style={[styles.tabSlot, { transform: [{ scale: scales[index] }] }]}
            >
              <TouchableOpacity
                style={styles.tabBtn}
                onPress={() => pressTab(index, route.name, isFocused)}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
              >
                {options.tabBarIcon?.({ color: iconColor, size: 24, focused: isFocused })}
                {/* Active dot indicator */}
                {isFocused && <View style={[styles.activeDot, { backgroundColor: c.accentLight }]} />}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Floating center button — absolutely positioned above the bar */}
        <Animated.View
          style={[
            styles.centerBtnWrapper,
            {
              bottom: TAB_HEIGHT / 2 + insets.bottom - CENTER_SIZE / 2 + CENTER_LIFT,
              transform: [{ scale: scales[2] }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => pressTab(2, "create", false)}
            activeOpacity={1}
            style={styles.centerBtn}
            accessibilityRole="button"
            accessibilityLabel="Create listing"
          >
            <Plus size={26} color={c.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Create Listing Modal rendered here so it's available from any tab */}
      <CreateListingModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setShowCreate(false)}
      />
    </>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <House size={24} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <Compass size={24} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      {/* Center dummy tab — press intercepted in CustomTabBar */}
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => (
            <MessageCircle size={24} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <User size={24} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 12 },
    }),
  },
  tabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 4,
    width: "100%",
    height: "100%",
    gap: 3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  // Center button
  centerBtnWrapper: {
    position: "absolute",
    alignSelf: "center",
    left: "50%",
    marginLeft: -(56 / 2),
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0064B1",
    alignItems: "center",
    justifyContent: "center",
  },
});
