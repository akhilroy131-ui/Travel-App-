import type { Tables } from './database'
import type { Profile } from './models'

type Assert<T extends true> = T
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? (<Value>() => Value extends Right ? 1 : 2) extends
      (<Value>() => Value extends Left ? 1 : 2)
      ? true
      : false
    : false

// A profile consumed by the app must not drift from the generated database contract.
type ProfileUsesGeneratedSchema = Assert<Equal<Profile, Tables<'profiles'>>>

export type { ProfileUsesGeneratedSchema }
