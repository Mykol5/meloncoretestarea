export interface PlanConfig {
  name: string;
  userLimit: number;
  price: number;
  features: string[];
  trialDays: number;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  trial: {
    name: 'Trial',
    userLimit: 2, // Allow trial with grace period
    price: 0,
    features: [
      'All core features',
      '5 projects',
      '10 metrics',
      '100 responses',
      'Basic analytics',
    ],
    trialDays: 14,
  },
  starter: {
    name: 'Starter',
    userLimit: 1,
    price: 20000, // $200
    features: [
      'All core features',
      '10 projects',
      '25 metrics',
      '500 responses',
      'Advanced analytics',
    ],
    trialDays: 0,
  },
  regular: {
    name: 'Regular',
    userLimit: 5,
    price: 120000, // $1200
    features: [
      'All starter features',
      'Unlimited projects',
      'Unlimited metrics',
      '2500 responses',
      'Team collaboration',
      'Custom dashboards',
    ],
    trialDays: 0,
  },
  premium: {
    name: 'Premium',
    userLimit: -1, // Unlimited
    price: 250000, // $2500
    features: [
      'All regular features',
      'Unlimited responses',
      'Advanced integrations',
      'SSO',
      'Priority support',
      'Custom branding',
    ],
    trialDays: 0,
  },
};

export function getPlanConfig(plan: string): PlanConfig {
  return PLAN_CONFIGS[plan] || PLAN_CONFIGS.trial;
}

export function canAddUser(
  currentPlan: string,
  currentUserCount: number,
): boolean {
  const config = getPlanConfig(currentPlan);
  if (config.userLimit === -1) return true; // Unlimited
  return currentUserCount < config.userLimit;
}
