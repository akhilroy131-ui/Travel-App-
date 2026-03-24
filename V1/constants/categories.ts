import { ExperienceCategory } from '../types/models'
import { Colors } from './theme'

export interface CategoryDefinition {
  id: ExperienceCategory
  label: string
  icon: string          // emoji icon for now; swap to vector icons later
  color: string         // tag background colour
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'food_drink',
    label: 'Food & Drink',
    icon: '🍽️',
    color: Colors.categoryFoodDrink,
  },
  {
    id: 'adventure_outdoors',
    label: 'Adventure',
    icon: '🏔️',
    color: Colors.categoryAdventure,
  },
  {
    id: 'culture_history',
    label: 'Culture',
    icon: '🏛️',
    color: Colors.categoryCulture,
  },
  {
    id: 'wellness_mindfulness',
    label: 'Wellness',
    icon: '🧘',
    color: Colors.categoryWellness,
  },
]

export function getCategoryById(id: ExperienceCategory): CategoryDefinition | undefined {
  return CATEGORIES.find((c) => c.id === id)
}
