import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { Colors } from '../constants/colors';

// NOTE: Replace this with your actual logo image:
// import { Image } from 'expo-image';
// const logo = require('../assets/images/mav-logo.png');
// Then use: <Image source={logo} style={{ width: size, height: size }} />

interface MavLogoProps {
  size?: number;
}

export function MavLogo({ size = 32 }: MavLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.2 }]}>
      <ShoppingBag size={size * 0.5} color={Colors.white} fill={Colors.white} />
      <Text style={[styles.letter, { fontSize: size * 0.2 }]}>A</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.utaBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: Colors.white,
    fontWeight: '700',
    position: 'absolute',
    bottom: '20%',
  },
});
