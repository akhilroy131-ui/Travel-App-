import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../types/navigation'
import { signUpWithEmail } from '../../lib/auth'
import { UserRole } from '../../types/models'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>

export default function SignUpScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('traveller')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!displayName || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error } = await signUpWithEmail(email, password, displayName, role)
    setLoading(false)
    if (error) {
      Alert.alert('Sign up failed', error.message)
    } else {
      Alert.alert('Check your email', 'We sent you a confirmation link.')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join Roam and start exploring</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={Colors.textTertiary}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 characters)"
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Role selector */}
        <Text style={styles.roleLabel}>I want to…</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleOption, role === 'traveller' && styles.roleOptionSelected]}
            onPress={() => setRole('traveller')}
          >
            <Text style={[styles.roleOptionText, role === 'traveller' && styles.roleOptionTextSelected]}>
              🧳 Explore experiences
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleOption, role === 'host' && styles.roleOptionSelected]}
            onPress={() => setRole('host')}
          >
            <Text style={[styles.roleOptionText, role === 'host' && styles.roleOptionTextSelected]}>
              🏡 Host experiences
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.textOnAccent} />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.switchText}>
          Already have an account? <Text style={styles.switchLink}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  roleLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: -Spacing.xs,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleOption: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  roleOptionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '18',
  },
  roleOptionText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  roleOptionTextSelected: {
    color: Colors.accent,
    fontWeight: Typography.weight.bold,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.textOnAccent,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  switchText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  switchLink: {
    color: Colors.accent,
    fontWeight: Typography.weight.semibold,
  },
})
