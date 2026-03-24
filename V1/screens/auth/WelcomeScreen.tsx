import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../types/navigation'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Roam</Text>
        <Text style={styles.tagline}>Discover local experiences,{'\n'}meet the people behind them.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.giant,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: Typography.size.display,
    fontWeight: Typography.weight.extrabold,
    color: Colors.accent,
    marginBottom: Spacing.base,
  },
  tagline: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
    lineHeight: Typography.size.xl * Typography.lineHeight.relaxed,
  },
  actions: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.textOnAccent,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
})
