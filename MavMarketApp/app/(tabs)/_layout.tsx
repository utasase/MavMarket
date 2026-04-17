import React, { useState, useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { House, Compass, MessageCircle, User, Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreateListingModal } from "../../components/CreateListingModal";
import { useTheme } from "../../lib/ThemeContext";
import { spacing, radius } from "../../lib/theme";

const TAB_HEIGHT = 60;
const CENTER_SIZE = 60;
const CENTER_LIFT = 18;

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const { theme } = useTheme();
  const c = theme.colors;

  const scales = useRef(
    [0, 1, 2, 3, 4].map(() => new Animated.Value(1))
  ).current;

  const dotOpacities = useRef(
    [0, 1, 2, 3, 4].map((i) => new Animated.Value(state.index === i ? 1 : 0))
  ).current;

  React.useEffect(() => {
    dotOpacities.forEach((v, i) => {
      Animated.timing(v, {
        toValue: state.index === i ? 1 : 0,
        duration: theme.motion.fast,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index, dotOpacities, theme.motion.fast]);

  const pressTab = (index: number, routeName: string, isFocused: boolean) => {
    if (routeName === "create") {
      Animated.sequence([
        Animated.spring(scales[index], {
          toValue: 0.9,
          useNativeDriver: true,
          speed: 50,
          bounciness: 10,
        }),
        Animated.spring(scales[index], {
          toValue: 1,
          useNativeDriver: true,
          speed: 24,
          bounciness: 14,
        }),
      ]).start();
      setShowCreate(true);
      return;
    }

    Animated.sequence([
      Animated.spring(scales[index], {
        toValue: theme.motion.pressScale,
        useNativeDriver: true,
        speed: 60,
        bounciness: 0,
      }),
      Animated.spring(scales[index], {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }),
    ]).start();

    const event = navigation.emit({
      type: "tabPress",
      target: state.routes[index].key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate({ name: routeName, merge: true });
    }
  };

  return (
    <>
      <View
        style={[
          styles.tabBarOuter,
          {
            paddingBottom: insets.bottom,
            height: TAB_HEIGHT + insets.bottom,
            borderTopColor: c.tabBarBorder,
          },
        ]}
      >
        {Platform.OS !== "web" ? (
          <BlurView
            intensity={theme.dark ? 60 : 80}
            tint={theme.dark ? "dark" : "light"}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: c.tabBar },
            ]}
          />
        )}

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = route.name === "create";

          if (isCenter) {
            return (
              <View key={route.key} style={styles.tabSlot}>
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
                {options.tabBarIcon?.({
                  color: iconColor,
                  size: 22,
                  focused: isFocused,
                })}
                <Animated.View
                  style={[
                    styles.activeDot,
                    {
                      backgroundColor: c.accentLight,
                      opacity: dotOpacities[index],
                    },
                  ]}
                />
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <Animated.View
          style={[
            styles.centerBtnWrapper,
            {
              bottom:
                TAB_HEIGHT / 2 + insets.bottom - CENTER_SIZE / 2 + CENTER_LIFT,
              transform: [{ scale: scales[2] }],
              shadowColor: c.accent,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => pressTab(2, "create", false)}
            activeOpacity={1}
            style={[
              styles.centerBtn,
              { backgroundColor: c.accent500, borderColor: c.accent700 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create listing"
          >
            <Plus size={26} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <CreateListingModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          router.navigate("/(tabs)/profile" as any);
        }}
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
            <House size={22} color={color} strokeWidth={1.85} />
          ),
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <Compass size={22} color={color} strokeWidth={1.85} />
          ),
        }}
      />
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
            <MessageCircle size={22} color={color} strokeWidth={1.85} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <User size={22} color={color} strokeWidth={1.85} />
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
    overflow: "hidden",
  },
  tabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    width: "100%",
    height: "100%",
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  centerBtnWrapper: {
    position: "absolute",
    alignSelf: "center",
    left: "50%",
    marginLeft: -(CENTER_SIZE / 2),
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
  },
  centerBtn: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
