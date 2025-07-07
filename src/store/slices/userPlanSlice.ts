
import { StateCreator } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'hobby' | 'startup' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  maxForms: number;
  maxSubmissionsPerMonth: number;
  maxKnowledgeBases: number;
  hasChatSupport: boolean;
  hasAdvancedAnalytics: boolean;
  hasCustomBranding: boolean;
  hasApiAccess: boolean;
}

export interface UserPlanSlice {
  // State
  userSubscription: UserSubscription | null;
  planLimits: PlanLimits;
  planLoading: boolean;
  planError: string | null;

  // Actions
  fetchUserSubscription: () => Promise<void>;
  updateUserPlan: (planType: PlanType) => Promise<boolean>;
  checkFeatureAccess: (feature: keyof PlanLimits) => boolean;
  checkFormLimit: (currentCount: number) => boolean;
  checkSubmissionLimit: (currentCount: number) => boolean;
  checkKnowledgeBaseLimit: (currentCount: number) => boolean;
  getPlanDisplayName: (planType?: PlanType) => string;
  getPlanColor: (planType?: PlanType) => string;
  isFeatureRestricted: (feature: string) => boolean;
  
  // Reset
  resetPlanState: () => void;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  hobby: {
    maxForms: 5,
    maxSubmissionsPerMonth: 100,
    maxKnowledgeBases: 2,
    hasChatSupport: false,
    hasAdvancedAnalytics: false,
    hasCustomBranding: false,
    hasApiAccess: false,
  },
  startup: {
    maxForms: 25,
    maxSubmissionsPerMonth: 1000,
    maxKnowledgeBases: 10,
    hasChatSupport: true,
    hasAdvancedAnalytics: true,
    hasCustomBranding: false,
    hasApiAccess: true,
  },
  enterprise: {
    maxForms: -1, // unlimited
    maxSubmissionsPerMonth: -1, // unlimited
    maxKnowledgeBases: -1, // unlimited
    hasChatSupport: true,
    hasAdvancedAnalytics: true,
    hasCustomBranding: true,
    hasApiAccess: true,
  },
};

export const createUserPlanSlice: StateCreator<
  any,
  [],
  [],
  UserPlanSlice
> = (set, get) => ({
  // Initial state
  userSubscription: null,
  planLimits: PLAN_LIMITS.hobby,
  planLoading: false,
  planError: null,

  // Actions
  fetchUserSubscription: async () => {
    set({ planLoading: true, planError: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // If no subscription exists, create default hobby plan
      if (!data) {
        const { data: newSubscription, error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan_type: 'hobby',
            status: 'active',
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        set({
          userSubscription: newSubscription,
          planLimits: PLAN_LIMITS.hobby,
          planLoading: false,
        });
      } else {
        set({
          userSubscription: data,
          planLimits: PLAN_LIMITS[data.plan_type],
          planLoading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      set({
        planError: error instanceof Error ? error.message : 'Failed to fetch subscription',
        planLoading: false,
      });
    }
  },

  updateUserPlan: async (planType: PlanType) => {
    const { userSubscription } = get();
    
    if (!userSubscription) {
      console.error('No user subscription found');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          plan_type: planType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userSubscription.id);

      if (error) {
        throw error;
      }

      set({
        userSubscription: {
          ...userSubscription,
          plan_type: planType,
          updated_at: new Date().toISOString(),
        },
        planLimits: PLAN_LIMITS[planType],
      });

      return true;
    } catch (error) {
      console.error('Error updating user plan:', error);
      set({
        planError: error instanceof Error ? error.message : 'Failed to update plan',
      });
      return false;
    }
  },

  checkFeatureAccess: (feature: keyof PlanLimits) => {
    const { planLimits } = get();
    return planLimits[feature] as boolean;
  },

  checkFormLimit: (currentCount: number) => {
    const { planLimits } = get();
    return planLimits.maxForms === -1 || currentCount < planLimits.maxForms;
  },

  checkSubmissionLimit: (currentCount: number) => {
    const { planLimits } = get();
    return planLimits.maxSubmissionsPerMonth === -1 || currentCount < planLimits.maxSubmissionsPerMonth;
  },

  checkKnowledgeBaseLimit: (currentCount: number) => {
    const { planLimits } = get();
    return planLimits.maxKnowledgeBases === -1 || currentCount < planLimits.maxKnowledgeBases;
  },

  getPlanDisplayName: (planType?: PlanType) => {
    const { userSubscription } = get();
    const plan = planType || userSubscription?.plan_type || 'hobby';
    
    const names: Record<PlanType, string> = {
      hobby: 'Hobby Plan',
      startup: 'Startup Plan',
      enterprise: 'Enterprise Plan',
    };
    
    return names[plan];
  },

  getPlanColor: (planType?: PlanType) => {
    const { userSubscription } = get();
    const plan = planType || userSubscription?.plan_type || 'hobby';
    
    const colors: Record<PlanType, string> = {
      hobby: 'bg-blue-500 text-white',
      startup: 'bg-purple-500 text-white',
      enterprise: 'bg-gold-500 text-white',
    };
    
    return colors[plan];
  },

  isFeatureRestricted: (feature: string) => {
    const { planLimits } = get();
    
    switch (feature) {
      case 'chat':
        return !planLimits.hasChatSupport;
      case 'analytics':
        return !planLimits.hasAdvancedAnalytics;
      case 'branding':
        return !planLimits.hasCustomBranding;
      case 'api':
        return !planLimits.hasApiAccess;
      default:
        return false;
    }
  },

  resetPlanState: () => {
    set({
      userSubscription: null,
      planLimits: PLAN_LIMITS.hobby,
      planLoading: false,
      planError: null,
    });
  },
});
